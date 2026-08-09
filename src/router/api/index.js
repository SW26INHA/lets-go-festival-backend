import express from 'express'

import festivalApi from './FestivalApi'
import regionApi from './RegionApi'

const api = express.Router()

api.get('/', (req, res) => {
  res.send('백엔드 엔드포인트: /api')
})
api.use('/v1/regions', regionApi)
api.use('/v1/festivals', festivalApi)

export default api
