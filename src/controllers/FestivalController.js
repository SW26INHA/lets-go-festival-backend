import { maria } from '../db';

export const getFestivalMapList = async (req, res) => {

  try {
    const result = await maria.select(
      'festival',
      [
        'festival_idx AS festivalIdx',
        'thumbnail_image_url AS thumbnailImageUrl',
        'latitude',
        'longitude'
      ],
      {
        latitude: { operator: 'IS NOT', value: null },
        longitude: { operator: 'IS NOT', value: null }
      }
    );

    const festivals = Array.isArray(result) ? result : [];

    return res.status(200).json({
      success: true,
      code: "FESTIVAL_MAP_LIST_SUCCESS",
      message: "지도용 축제 목록 조회를 성공하였습니다.",
      data: {
        festivals
      }
    });

  } catch (error) {
    console.error('[FestivalController.getFestivalMapList Error]:', error);

    return res.status(500).json({
      success: false,
      code: "FESTIVAL_MAP_LIST_ERROR",
      message: "지도용 축제 목록 조회 중 오류가 발생하였습니다.",
      data: null
    });
  }
};