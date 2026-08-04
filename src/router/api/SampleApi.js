import express from 'express'

import { mariaSampleController } from '../../controllers'

const sampleApi = express.Router()

sampleApi.get('/', (req, res) => {
  res.send('백엔드 엔드포인트: /api/sample')
})

sampleApi.post('/info', mariaSampleController.getMariaSampleDatas) // 엔드포인트: /api/sample/info

export default sampleApi
