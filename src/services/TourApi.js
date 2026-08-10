import axios from 'axios'

import { config } from '../config'
import { logger } from '../utils'

const TOURAPI = config.tourApi

// totalCount가 비정상일 때 무한 루프를 막기 위한 상한
const MAX_PAGE = 200

const client = axios.create({
  baseURL: TOURAPI.baseUrl,
  timeout: TOURAPI.timeout,
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * TourAPI 응답 본문 파싱.
 * 서비스키 오류 등이 발생하면 JSON이 아닌 XML 문자열이 돌아오므로 형식부터 확인한다.
 *
 * @param {any} data axios 응답 데이터.
 * @returns {Object} response.body 객체.
 */
const parseResponseBody = (data) => {
  if (typeof data !== 'object' || data === null) {
    throw new Error(
      `TourAPI 응답 형식이 올바르지 않습니다: ${String(data).slice(0, 300)}`
    )
  }

  const header = data.response?.header
  const body = data.response?.body

  if (header?.resultCode !== '0000') {
    throw new Error(
      `TourAPI 오류 응답 [${header?.resultCode}] ${header?.resultMsg}`
    )
  }

  return body ?? {}
}

/**
 * 응답의 items를 배열로 정규화.
 * 결과가 없으면 빈 문자열, 1건이면 객체가 오는 경우가 있다.
 *
 * @param {any} items response.body.items 값.
 * @returns {Array<Object>} 축제 항목 배열.
 */
const normalizeItems = (items) => {
  const item = items?.item

  if (Array.isArray(item)) return item
  if (item && typeof item === 'object') return [item]

  return []
}

/**
 * 축제 목록 한 페이지 조회.
 *
 * @param {Object} params
 * @param {Number} params.pageNo 페이지 번호.
 * @param {String} params.eventStartDate 행사 시작일(YYYYMMDD).
 * @param {String} params.eventEndDate 행사 종료일(YYYYMMDD).
 * @returns {Promise<Object>} response.body 객체.
 */
const requestFestivalPage = async ({
  pageNo,
  eventStartDate,
  eventEndDate,
}) => {
  const { data } = await client.get('/searchFestival2', {
    params: {
      serviceKey: TOURAPI.serviceKey,
      MobileOS: TOURAPI.mobileOS,
      MobileApp: TOURAPI.mobileApp,
      _type: 'json',
      arrange: 'C',
      numOfRows: TOURAPI.numOfRows,
      pageNo,
      eventStartDate,
      eventEndDate,
    },
  })

  return parseResponseBody(data)
}

/**
 * 기간 내 축제 목록 전체 수집.
 * totalCount를 기준으로 마지막 페이지까지 순차 조회한다.
 *
 * @param {Object} params
 * @param {String} params.eventStartDate 행사 시작일(YYYYMMDD).
 * @param {String} params.eventEndDate 행사 종료일(YYYYMMDD).
 * @returns {Promise<Array<Object>>} 수집한 축제 항목 배열.
 */
const fetchFestivals = async ({ eventStartDate, eventEndDate }) => {
  if (!TOURAPI.serviceKey) {
    throw new Error('TOUR_API_SERVICE_KEY가 설정되지 않았습니다. (.env 확인)')
  }

  const items = []
  let pageNo = 1
  let totalCount = 0

  do {
    const body = await requestFestivalPage({
      pageNo,
      eventStartDate,
      eventEndDate,
    })
    const pageItems = normalizeItems(body.items)

    totalCount = Number(body.totalCount) || 0
    items.push(...pageItems)

    logger.debug(
      `[TourApi.fetchFestivals] ${pageNo}페이지 수집: ${pageItems.length}건 (누적 ${items.length}/${totalCount})`
    )

    if (pageItems.length === 0) break

    pageNo += 1

    if (pageNo > MAX_PAGE) {
      logger.error(
        `[TourApi.fetchFestivals] 최대 페이지(${MAX_PAGE})에 도달하여 수집을 중단합니다.`
      )
      break
    }

    if (TOURAPI.pageDelay > 0) await delay(TOURAPI.pageDelay)
  } while (items.length < totalCount)

  return items
}

/**
 * TourAPI 연동 모듈.
 *
 * @module services/tourApi
 */
const tourApi = {
  fetchFestivals,
}

export { tourApi }
