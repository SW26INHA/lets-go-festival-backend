import express from 'express'

import regionApi from './RegionApi'

const api = express.Router()

api.get('/', (req, res) => {
  res.send('백엔드 엔드포인트: /api')
})
api.use('/v1/regions', regionApi)

export default api
