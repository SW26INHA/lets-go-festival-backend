import http from 'http'

import cors from 'cors'
import express from 'express'
import morgan from 'morgan'

import { config } from './config'
import router from './router'
import { startSchedulers } from './scheduler'
import { logger, stream } from './utils'

global.log = logger

const app = express()
const port = config.port

app.set('trust proxy', true)

app.use(cors())

app.use(express.json())
app.use(morgan('combined', { stream }))
app.use('/', router)
app.get('/', (req, res) => {
  res.send('백엔드 템플릿 서버')
})
app.get(/.*/, (req, res) => {
  res.send('백엔드 템플릿 서버')
})

const server = http.createServer(app)
server.listen(port)

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    error && log.error(`Error for Server: ${error.message}`)
    throw error
  }

  const bind = typeof port === 'string' ? `${port} namepipe` : `${port} port`
  switch (error.code) {
    case 'EACCES':
      log.error(`Error for Server: ${bind} requires elevated privileges.`)
      process.exit(1)
      break
    case 'EADDRINUSE':
      log.error(`Error for Server: ${bind} is already in use`)
      process.exit(1)
      break
    default:
      error && log.error(`Error for Server: ${error.message}`)
      throw error
  }
})

server.on('listening', async () => {
  log.debug(`${port}로 서버가 실행중입니다.`)
  startSchedulers()
})
