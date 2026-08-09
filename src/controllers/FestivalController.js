import { maria } from '../db'

const buildFestivalListWhere = ({
  regionIdx,
  year,
  month,
  statuses,
  keyword,
}) => {
  const conditions = ['is_active = 1']
  const params = []

  if (regionIdx !== null) {
    conditions.push('region_idx = ?')
    params.push(regionIdx)
  }

  if (year !== null && month !== null) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    conditions.push('event_start_date <= LAST_DAY(?)')
    conditions.push('event_end_date >= ?')
    params.push(monthStart, monthStart)
  } else if (year !== null) {
    conditions.push('event_start_date <= ?')
    conditions.push('event_end_date >= ?')
    params.push(`${year}-12-31`, `${year}-01-01`)
  } else if (month !== null) {
    conditions.push(
      `(TIMESTAMPDIFF(MONTH, event_start_date, event_end_date) >= 11
        OR (YEAR(event_start_date) = YEAR(event_end_date)
          AND ? BETWEEN MONTH(event_start_date) AND MONTH(event_end_date))
        OR (YEAR(event_start_date) < YEAR(event_end_date)
          AND (? >= MONTH(event_start_date) OR ? <= MONTH(event_end_date))))`
    )
    params.push(month, month, month)
  }

  if (statuses.length > 0) {
    const statusConditions = statuses.map((status) => {
      if (status === 'ONGOING') {
        return 'CURRENT_DATE BETWEEN event_start_date AND event_end_date'
      }
      if (status === 'UPCOMING') return 'event_start_date > CURRENT_DATE'

      return 'event_end_date < CURRENT_DATE'
    })
    conditions.push(`(${statusConditions.join(' OR ')})`)
  }

  if (keyword) {
    conditions.push('title LIKE ?')
    params.push(`%${keyword}%`)
  }

  return {
    clause: conditions.join(' AND '),
    params,
  }
}

const getFestivalList = async (req, res) => {
  const tag = '[FestivalController.getFestivalList]'
  const filters = req.festivalListFilters

  try {
    if (filters.regionIdx !== null) {
      const regionResult = await maria.executeQuery(
        'SELECT 1 FROM region WHERE region_idx = ? LIMIT 1',
        [filters.regionIdx]
      )

      if (!Array.isArray(regionResult) || regionResult.length === 0) {
        return res.status(400).json({
          success: false,
          code: 'FESTIVAL_INVALID_REGION',
          message: '지역 검색 조건이 올바르지 않습니다.',
          data: null,
        })
      }
    }

    const where = buildFestivalListWhere(filters)
    const countResult = await maria.executeQuery(
      `SELECT COUNT(*) AS totalElements FROM festival WHERE ${where.clause}`,
      where.params
    )
    const totalElements = Number(countResult[0]?.totalElements || 0)
    const totalPages = Math.ceil(totalElements / filters.size)
    const offset = (filters.page - 1) * filters.size
    const listResult = await maria.executeQuery(
      `SELECT
        festival_idx AS festivalIdx,
        title,
        original_image_url AS originalImageUrl,
        address1,
        address2,
        event_start_date AS eventStartDate,
        event_end_date AS eventEndDate,
        telephone,
        CASE
          WHEN CURRENT_DATE BETWEEN event_start_date AND event_end_date THEN 'ONGOING'
          WHEN event_start_date > CURRENT_DATE THEN 'UPCOMING'
          ELSE 'ENDED'
        END AS status
      FROM festival
      WHERE ${where.clause}
      ORDER BY event_start_date ASC, festival_idx ASC
      LIMIT ? OFFSET ?`,
      [...where.params, filters.size, offset]
    )
    const festivals = Array.isArray(listResult)
      ? listResult.map((festival) => ({
          ...festival,
          festivalIdx: Number(festival.festivalIdx),
        }))
      : []

    return res.status(200).json({
      success: true,
      code: 'FESTIVAL_LIST_SUCCESS',
      message: '축제 목록 조회를 성공하였습니다.',
      data: {
        festivals,
        page: filters.page,
        size: filters.size,
        totalElements,
        totalPages,
        first: filters.page === 1,
        last: totalPages === 0 || filters.page >= totalPages,
      },
    })
  } catch (error) {
    log.error(`${tag} 축제 목록 조회 중 오류 발생: ${error.message}`)

    return res.status(500).json({
      success: false,
      code: 'FESTIVAL_LIST_FAIL',
      message: '축제 목록 조회에 실패하였습니다.',
      data: null,
    })
  }
}

const getFestivalMapList = async (req, res) => {
  const tag = '[FestivalController.getFestivalMapList]'

  try {
    const result = await maria.select(
      'festival',
      [
        'festival_idx AS festivalIdx',
        'thumbnail_image_url AS thumbnailImageUrl',
        'latitude',
        'longitude',
      ],
      `is_active = 1
        AND event_end_date >= CURRENT_DATE
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL`
    )

    const festivals = Array.isArray(result) ? result : []

    return res.status(200).json({
      success: true,
      code: 'FESTIVAL_MAP_LIST_SUCCESS',
      message: '지도용 축제 목록 조회를 성공하였습니다.',
      data: {
        festivals,
      },
    })
  } catch (error) {
    log.error(`${tag} 지도용 축제 목록 조회 중 오류 발생: ${error.message}`)

    return res.status(500).json({
      success: false,
      code: 'FESTIVAL_MAP_LIST_ERROR',
      message: '지도용 축제 목록 조회에 실패하였습니다.',
      data: null,
    })
  }
}

const festivalController = {
  getFestivalList,
  getFestivalMapList,
}

export { festivalController }
