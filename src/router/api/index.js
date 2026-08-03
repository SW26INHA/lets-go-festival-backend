import express from 'express'

import sampleApi from './SampleApi'

const api = express.Router()

api.get('/', (req, res) => {
  res.send('백엔드 엔드포인트: /api')
})
api.use('/sample', sampleApi)

export default api
