import moment from 'moment'

import { config } from '../config'
import { maria } from '../db'
import { logger } from '../utils'

import { tourApi } from './TourApi'

// 시/도 코드 자릿수. lDongRegnCd가 시군구 코드까지 붙어 오는 경우를 잘라낸다.
const REGION_CODE_LENGTH = 2

const INSERT_COLUMNS = [
  'content_id',
  'region_idx',
  'title',
  'original_image_url',
  'thumbnail_image_url',
  'address1',
  'address2',
  'telephone',
  'event_start_date',
  'event_end_date',
  'latitude',
  'longitude',
  'external_created_at',
  'external_modified_at',
  'last_synced_at',
]

// 한 번의 INSERT로 처리할 최대 행 수
const INSERT_CHUNK_SIZE = 200

/**
 * 문자열 값 정리.
 * 빈 문자열은 NULL로 저장한다.
 *
 * @param {any} value 원본 값.
 * @param {Number} maxLength 컬럼 최대 길이.
 * @returns {String|null}
 */
const toNullableString = (value, maxLength) => {
  if (value === undefined || value === null) return null

  const trimmed = String(value).trim()
  if (trimmed === '') return null

  return trimmed.slice(0, maxLength)
}

/**
 * YYYYMMDD 형식을 DATE 문자열로 변환.
 *
 * @param {any} value 원본 값.
 * @returns {String|null} YYYY-MM-DD 또는 null.
 */
const toDate = (value) => {
  const parsed = moment(String(value ?? '').trim(), 'YYYYMMDD', true)

  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null
}

/**
 * YYYYMMDDHHmmss 형식을 DATETIME 문자열로 변환.
 *
 * @param {any} value 원본 값.
 * @returns {String|null} YYYY-MM-DD HH:mm:ss 또는 null.
 */
const toDateTime = (value) => {
  const parsed = moment(String(value ?? '').trim(), 'YYYYMMDDHHmmss', true)

  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : null
}

/**
 * 좌표 값 변환.
 * TourAPI는 좌표가 없을 때 빈 문자열이나 0을 반환한다.
 *
 * @param {any} value 원본 값.
 * @param {Number} limit 허용 절대값 상한.
 * @returns {Number|null}
 */
const toCoordinate = (value, limit) => {
  const parsed = Number(String(value ?? '').trim())

  if (!Number.isFinite(parsed) || parsed === 0) return null
  if (Math.abs(parsed) > limit) return null

  return parsed
}

/**
 * 축제 항목의 시/도 코드를 region_idx로 변환.
 *
 * KorService2는 areacode를 대부분 빈 값으로 내려주므로 lDongRegnCd(법정동 시도 코드)를
 * 사용한다. region 테이블이 같은 코드 체계를 쓰기 때문에 값을 그대로 쓸 수 있다.
 * 세종처럼 시군구 코드까지 붙어 오는 경우가 있어 앞 두 자리만 사용한다.
 *
 * @param {Object} item TourAPI 축제 항목.
 * @param {Set<Number>} regionIdxSet region 테이블에 존재하는 region_idx 집합.
 * @returns {Number|null} region 테이블에 없는 코드면 null.
 */
const toRegionIdx = (item, regionIdxSet) => {
  const code = String(item.lDongRegnCd ?? '').trim()
  if (code === '') return null

  const regionIdx = Number(code.slice(0, REGION_CODE_LENGTH))
  if (!Number.isInteger(regionIdx) || !regionIdxSet.has(regionIdx)) return null

  return regionIdx
}

/**
 * TourAPI 응답 항목을 festival 테이블 행으로 변환.
 * NOT NULL 컬럼을 채우지 못하면 null을 반환한다.
 *
 * @param {Object} item TourAPI 축제 항목.
 * @param {String} syncedAt 동기화 시각(YYYY-MM-DD HH:mm:ss).
 * @param {Set<Number>} regionIdxSet region 테이블에 존재하는 region_idx 집합.
 * @returns {Object|null}
 */
const toFestivalRow = (item, syncedAt, regionIdxSet) => {
  const contentId = toNullableString(item.contentid, 30)
  const title = toNullableString(item.title, 255)
  const eventStartDate = toDate(item.eventstartdate)
  const eventEndDate = toDate(item.eventenddate)

  if (!contentId || !title || !eventStartDate || !eventEndDate) return null

  return {
    content_id: contentId,
    region_idx: toRegionIdx(item, regionIdxSet),
    title,
    original_image_url: toNullableString(item.firstimage, 1000),
    thumbnail_image_url: toNullableString(item.firstimage2, 1000),
    address1: toNullableString(item.addr1, 500),
    address2: toNullableString(item.addr2, 500),
    telephone: toNullableString(item.tel, 255),
    event_start_date: eventStartDate,
    event_end_date: eventEndDate,
    latitude: toCoordinate(item.mapy, 90),
    longitude: toCoordinate(item.mapx, 180),
    external_created_at: toDateTime(item.createdtime),
    external_modified_at: toDateTime(item.modifiedtime),
    last_synced_at: syncedAt,
  }
}

/**
 * 수집 기간 계산.
 *
 * @param {moment.Moment} baseDate 기준일(스케줄러 실행일).
 * @returns {{ eventStartDate: String, eventEndDate: String }} YYYYMMDD 형식.
 */
const buildSearchPeriod = (baseDate) => {
  const { startOffsetDays, endOffsetYears } = config.scheduler.festivalSync

  return {
    eventStartDate: baseDate
      .clone()
      .subtract(startOffsetDays, 'days')
      .format('YYYYMMDD'),
    eventEndDate: baseDate
      .clone()
      .add(endOffsetYears, 'years')
      .format('YYYYMMDD'),
  }
}

/**
 * region 테이블에 존재하는 region_idx 목록 조회.
 * 매핑을 코드에 박아두지 않고 테이블을 기준으로 검증한다.
 *
 * @returns {Promise<Set<Number>>}
 */
const selectRegionIdxSet = async () => {
  const result = await maria.executeQuery('SELECT region_idx FROM region')
  const rows = Array.isArray(result) ? result : []

  return new Set(rows.map((row) => Number(row.region_idx)))
}

/**
 * 이미 저장된 content_id 목록 조회.
 *
 * @returns {Promise<Set<String>>}
 */
const selectStoredContentIds = async () => {
  const result = await maria.executeQuery('SELECT content_id FROM festival')
  const rows = Array.isArray(result) ? result : []

  return new Set(rows.map((row) => String(row.content_id)))
}

/**
 * 신규 축제 배치 INSERT.
 *
 * MariaDB 모듈은 커넥션을 모듈 전역에 하나만 유지하므로 병렬 실행하면 안 된다.
 * 청크 단위로 순차 실행한다.
 *
 * @param {Array<Object>} rows INSERT할 행 목록.
 * @returns {Promise<Number>} 실제로 추가된 행 수.
 */
const insertFestivals = async (rows) => {
  const columns = INSERT_COLUMNS.join(', ')
  const rowPlaceholder = `(${INSERT_COLUMNS.map(() => '?').join(', ')})`
  let inserted = 0

  for (let offset = 0; offset < rows.length; offset += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(offset, offset + INSERT_CHUNK_SIZE)
    const placeholders = chunk.map(() => rowPlaceholder).join(', ')
    const params = chunk.flatMap((row) =>
      INSERT_COLUMNS.map((column) => row[column])
    )

    const result = await maria.executeQuery(
      `INSERT INTO festival (${columns}) VALUES ${placeholders}`,
      params
    )

    inserted += Number(result?.affectedRows ?? chunk.length)
  }

  return inserted
}

/**
 * 축제 목록 동기화.
 * TourAPI에서 기간 내 축제를 수집한 뒤 저장되지 않은 축제만 추가한다.
 * 기존 행은 갱신하거나 비활성화하지 않는다.
 *
 * @param {Object} [options]
 * @param {Date|moment.Moment} [options.baseDate] 기준일. 미지정 시 현재 시각.
 * @param {Boolean} [options.dryRun] true면 INSERT를 실행하지 않고 결과만 계산한다.
 * @returns {Promise<Object>} 동기화 결과 요약.
 */
const syncFestivals = async ({ baseDate, dryRun = false } = {}) => {
  const tag = '[FestivalSync.syncFestivals]'
  const startedAt = moment(baseDate)
  const syncedAt = startedAt.format('YYYY-MM-DD HH:mm:ss')
  const period = buildSearchPeriod(startedAt)

  logger.info(
    `${tag} 축제 동기화 시작 (${period.eventStartDate} ~ ${period.eventEndDate})${
      dryRun ? ' [드라이런]' : ''
    }`
  )

  const items = await tourApi.fetchFestivals(period)
  const regionIdxSet = await selectRegionIdxSet()
  const storedContentIds = await selectStoredContentIds()

  const rows = []
  const seenContentIds = new Set()
  let skipped = 0

  items.forEach((item) => {
    const row = toFestivalRow(item, syncedAt, regionIdxSet)

    if (!row) {
      skipped += 1
      logger.debug(`${tag} 필수 값 누락으로 제외: ${JSON.stringify(item)}`)
      return
    }

    // 페이징 중 데이터가 밀려 같은 축제가 두 번 올 수 있어 응답 내에서도 중복을 제거한다
    if (storedContentIds.has(row.content_id)) return
    if (seenContentIds.has(row.content_id)) return

    seenContentIds.add(row.content_id)
    rows.push(row)
  })

  let inserted = 0

  if (dryRun) {
    logger.info(`${tag} 드라이런이므로 INSERT를 실행하지 않습니다.`)
    rows.slice(0, 10).forEach((row) => {
      logger.info(
        `${tag} 신규 예정: ${row.content_id} | ${row.title} | region_idx=${row.region_idx} | ${row.event_start_date}~${row.event_end_date}`
      )
    })
  } else if (rows.length > 0) {
    inserted = await insertFestivals(rows)
  }

  const unmappedRegion = rows.filter((row) => row.region_idx === null).length

  logger.info(
    `${tag} 축제 동기화 완료 (수집 ${items.length}건 / 기존 ${storedContentIds.size}건 / 신규 ${dryRun ? rows.length : inserted}건 / 제외 ${skipped}건)`
  )

  if (unmappedRegion > 0) {
    logger.info(
      `${tag} 지역코드를 매핑하지 못한 신규 축제 ${unmappedRegion}건은 region_idx가 NULL로 저장되었습니다.`
    )
  }

  return {
    dryRun,
    fetched: items.length,
    candidates: rows.length,
    inserted,
    skipped,
    unmappedRegion,
    syncedAt,
    period,
  }
}

/**
 * 축제 동기화 모듈.
 *
 * @module services/festivalSync
 */
const festivalSync = {
  syncFestivals,
}

export { festivalSync }
