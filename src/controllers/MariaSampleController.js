import { maria } from '../db'

/**
 * Maria Sample 테이블에서 여러 데이터 조회 예시
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const getMariaSampleDatas = (req, res) => {
  const tag = '[SampleController.getMariaSampleDatas]'
  log.debug(`${tag} sample 데이터 목록 조회 요청 %o`, req.query)
  const { sampleId } = req.query

  const table = 'Sample'
  const fields = ['sample_id AS id', 'sample_name', 'created_at']
  const where = {
    sample_id: sampleId,
    sample_name: { like: '%test%' },
    created_at: { between: ['2026-01-01', '2026-01-31'] },
  }
  const group = 'DATE(created_at)'
  const order = 'created_at DESC'
  const limit = 1

  maria
    .select(table, fields, where, group, order, limit)
    .then((result) => {
      const data = Array.isArray(result) ? result : []

      res.json({
        code: 'OK',
        message: 'Sample 데이터 목록 조회 성공',
        data,
      })
    })
    .catch((error) => {
      log.error(`${tag} 조회 중 오류 발생: ${error.message}`)

      res.json({
        code: 'FAIL',
        message: 'Sample 데이터 목록 조회 중 오류가 발생했습니다.',
        error: error.message,
      })
    })
}

/**
 * MariaDB Sample 데이터 등록 예제
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const setMariaSampleData = (req, res) => {
  const tag = '[SampleController.createSampleData]'
  log.debug(`${tag} Sample 데이터 등록 요청 %o`, req.query)
  const { sampleData } = req.query

  const table = 'Sample'
  const values = {
    sample_id: 100,
    sampleData,
    created_at: new Date(),
  }

  maria
    .insertValues(table, values)
    .then(() => {
      res.json({
        code: 'OK',
        message: 'Sample 데이터 등록 성공',
      })
    })
    .catch((error) => {
      log.error(`${tag} 등록 중 오류 발생: ${error.message}`)

      res.json({
        code: 'FAIL',
        message: 'Sample 데이터 등록 중 오류가 발생했습니다.',
        error: error.message,
      })
    })
}

/**
 * MariaDB Sample 데이터 수정 예제
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const updateMariaSampleData = (req, res) => {
  const tag = '[SampleController.updateMariaSampleData]'
  log.debug(`${tag} Sample 데이터 수정 요청 %o`, req.body)
  const { sampleId, sampleData, sampleName } = req.query

  const table = 'Sample'
  const values = {
    sampleData,
    sampleName,
    updated_at: new Date(),
  }
  const where = {
    sample_id: sampleId,
  }

  maria
    .update(table, values, where)
    .then(() => {
      res.json({
        code: 'OK',
        message: 'Sample 데이터 수정 성공',
      })
    })
    .catch((error) => {
      log.error(`${tag} 수정 중 오류 발생: ${error.message}`)

      res.json({
        code: 'FAIL',
        message: 'Sample 데이터 수정 중 오류가 발생했습니다.',
        error: error.message,
      })
    })
}
/**
 * MariaDB Sample 데이터 삭제 예제
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const deleteMariaSampleData = (req, res) => {
  const tag = '[SampleController.deleteMariaSampleData]'
  log.debug(`${tag} Sample 데이터 삭제 요청 %o`, req.query)
  const { sampleId } = req.query

  if (!sampleId) {
    return res.json({
      code: 'FAIL',
      message: 'sampleId는 필수입니다.',
    })
  }

  const table = 'Sample'
  const where = {
    sample_id: sampleId,
  }

  maria
    .deleteData(table, where)
    .then(() => {
      res.json({
        code: 'OK',
        message: 'Sample 데이터 삭제 성공',
      })
    })
    .catch((error) => {
      log.error(`${tag} 삭제 중 오류 발생: ${error.message}`)

      res.json({
        code: 'FAIL',
        message: 'Sample 데이터 삭제 중 오류가 발생했습니다.',
        error: error.message,
      })
    })
}

const mariaSampleController = {
  getMariaSampleDatas,
  setMariaSampleData,
  updateMariaSampleData,
  deleteMariaSampleData,
  getOracleSampleDatas,
  setOracleSample,
  updateOracleSample,
  deleteOracleSample,
  getSampleInfo,
}

export { mariaSampleController }
