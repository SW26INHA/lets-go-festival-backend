const FESTIVAL_STATUSES = ['ONGOING', 'UPCOMING', 'ENDED']
const DEFAULT_PAGE = 1
const DEFAULT_SIZE = 20
const MAX_PAGE_SIZE = 100

const parseInteger = (value) => {
  if (value === undefined) return null
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return NaN

  return Number(value)
}

const parseFestivalListQuery = (query) => {
  const regionIdx = parseInteger(query.regionIdx)
  const year = parseInteger(query.year)
  const month = parseInteger(query.month)
  const page =
    query.page === undefined ? DEFAULT_PAGE : parseInteger(query.page)
  const size =
    query.size === undefined ? DEFAULT_SIZE : parseInteger(query.size)
  const statuses =
    query.statuses === undefined || query.statuses === ''
      ? []
      : typeof query.statuses === 'string'
        ? query.statuses.split(',').map((status) => status.trim().toUpperCase())
        : ['']

  return {
    regionIdx,
    year,
    month,
    statuses,
    keyword:
      typeof query.keyword === 'string' ? query.keyword.trim() || null : null,
    page,
    size,
  }
}

const getValidationError = ({
  regionIdx,
  year,
  month,
  statuses,
  page,
  size,
}) => {
  if (
    Number.isNaN(regionIdx) ||
    (regionIdx !== null && (!Number.isInteger(regionIdx) || regionIdx <= 0))
  ) {
    return {
      code: 'FESTIVAL_INVALID_REGION',
      message: '지역 검색 조건이 올바르지 않습니다.',
    }
  }

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    (year !== null && (year < 1000 || year > 9999)) ||
    (month !== null && (month < 1 || month > 12))
  ) {
    return {
      code: 'FESTIVAL_INVALID_DATE',
      message: '날짜 검색 조건이 올바르지 않습니다.',
    }
  }

  if (
    statuses.some((status) => !status || !FESTIVAL_STATUSES.includes(status))
  ) {
    return {
      code: 'FESTIVAL_INVALID_STATUS',
      message: '축제 진행 상태가 올바르지 않습니다.',
    }
  }

  if (
    Number.isNaN(page) ||
    Number.isNaN(size) ||
    page < 1 ||
    size < 1 ||
    size > MAX_PAGE_SIZE
  ) {
    return {
      code: 'FESTIVAL_INVALID_PAGE',
      message: '페이지 요청값이 올바르지 않습니다.',
    }
  }

  return null
}

const validateFestivalListQuery = (req, res, next) => {
  const filters = parseFestivalListQuery(req.query)
  const validationError = getValidationError(filters)

  if (validationError) {
    return res.status(400).json({
      success: false,
      code: validationError.code,
      message: validationError.message,
      data: null,
    })
  }

  req.festivalListFilters = filters
  return next()
}

export { validateFestivalListQuery }
