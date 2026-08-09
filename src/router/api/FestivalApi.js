import express from 'express'

import { festivalController } from '../../controllers'

const festivalApi = express.Router()

festivalApi.get('/map', festivalController.getFestivalMapList)

export default festivalApi
