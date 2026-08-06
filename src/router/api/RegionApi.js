import express from 'express'

import { regionController } from '../../controllers'

const regionApi = express.Router()

regionApi.get('/', regionController.getRegions)

export default regionApi
