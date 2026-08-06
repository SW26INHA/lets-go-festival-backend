import { maria } from '../db'

const getRegions = async (req, res) => {
  const tag = '[RegionController.getRegions]'

  try {
    const result = await maria.select(
      'region',
      ['region_idx AS regionIdx', 'region_name AS regionName'],
      null,
      'region_idx ASC'
    )
    const regions = Array.isArray(result)
      ? result.map(({ regionIdx, regionName }) => ({ regionIdx, regionName }))
      : []

    return res.status(200).json({
      success: true,
      code: 'REGIONS_LIST_SUCCESS',
      message: '시/도 목록 조회를 성공하였습니다.',
      data: { regions },
    })
  } catch (error) {
    log.error(`${tag} 시/도 목록 조회 중 오류 발생: ${error.message}`)

    return res.status(500).json({
      success: false,
      code: 'REGIONS_LIST_FAIL',
      message: '시/도 목록 조회에 실패하였습니다.',
      data: null,
    })
  }
}

const regionController = {
  getRegions,
}

export { regionController }
