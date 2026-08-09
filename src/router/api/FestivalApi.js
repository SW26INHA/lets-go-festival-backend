import express from 'express'

import { festivalController } from '../../controllers'
import { validateFestivalListQuery } from '../../validators'

const festivalApi = express.Router()

festivalApi.get(
  '/',
  validateFestivalListQuery,
  festivalController.getFestivalList
)
festivalApi.get('/map', festivalController.getFestivalMapList)

export default festivalApi
