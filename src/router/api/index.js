import express from 'express'

import regionApi from './RegionApi'
import festivalApi from './FestivalApi';

const api = express.Router()

api.get('/', (req, res) => {
  res.send('백엔드 엔드포인트: /api')
})
api.use('/v1/regions', regionApi)
api.use('/v1/festivals', festivalApi);

export default api
