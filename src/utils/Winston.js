import { existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

import moment from 'moment'
import winston, { format, transports } from 'winston'

import 'winston-daily-rotate-file'
import { config } from '../config'

// 로그 레벨에 따른 색상 정의
const colors = {
  error: 'red',
  info: 'green',
  debug: 'blue',
}
winston.addColors(colors)

// 로그 파일 경로 설정하고 디렉토리 존재 여부 확인
let pathLog = resolve(config.logPath)
!existsSync(pathLog) && mkdirSync(pathLog, { recursive: true })

// winston 로그 포맷 설정
const { combine, label, printf, timestamp } = format
const logFormat = printf(({ level, message, label, timestamp }) => {
  const datetime = moment(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
  return `${datetime} [${label}] ${level}: ${message}`
})

// DailyRotateFile 옵션 설정
const options = {
  datePattern: 'YYYY-MM-DD',
  format: combine(label({ label: 'backend-template' }), timestamp(), logFormat),
  humanReadableUnhandledException: true,
  json: false,
  maxFiles: '30d',
}

// 각 로그 레벨에 따른 트랜스포트 생성
const errorTransport = new transports.DailyRotateFile({
  ...options,
  dirname: pathLog + '/error',
  filename: '%DATE%-error.log',
  level: 'error',
})
const debugTransport = new transports.DailyRotateFile({
  ...options,
  dirname: pathLog + '/debug',
  filename: '%DATE%-debug.log',
  level: 'debug',
})
const infoTransport = new transports.DailyRotateFile({
  ...options,
  dirname: pathLog + '/info',
  filename: '%DATE%-info.log',
  level: 'info',
})

// winston 로거 생성하고 트랜스포트 추가
const logger = winston.createLogger({
  level: 'silly',
  format: combine(format.splat()),
  transports: [debugTransport, infoTransport, errorTransport],
})

// 프로덕션 환경이 아닌 경우 콘솔 트랜스포트 추가
config.env !== 'production' &&
  logger.add(
    new transports.Console({
      format: format.combine(
        label({ label: 'backend-template' }),
        format.colorize(),
        format.simple(),
        timestamp(),
        logFormat
      ),
    })
  )

// morgan 라이브러리에서 로그 스트림 사용할 수 있도록 설정
const stream = {
  write: (message) => {
    logger.info(message)
  },
}

export { logger, stream }
