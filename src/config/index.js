/**
 * 설정 정보.
 *
 * @module config
 */

import 'dotenv/config'

const ENV = process.env.NODE_ENV || 'production'

// 서버 포트
const PORT = {
  production: 4000,
  development: 4011,
  local: 4000,
}

/**
 * 로그 파일 저장 경로.
 *
 * @property {Object} LOGPATH
 */
const LOGPATH = {
  production: '/app/logs/backend-template/prod',
  development: '/app/logs/backend-template/dev',
  local: `${process.cwd()}/logs`,
}

/**
 * MariaDB 접속 정보.
 *
 * 비밀번호는 저장소에 커밋하지 않고 .env(DB_PASSWORD)로 주입한다.
 *
 * @property {Object} maria
 */
const MARIADB = {
  production: {
    host: '127.0.0.1', // 운영 DB 주소(샘플)
    port: 3306,
    user: 'prod_user',
    password: process.env.DB_PASSWORD,
    database: 'prod_database',
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    waitForConnections: true,
    checkDuplicate: true,
  },
  development: {
    user: 'dev_user', // 개발 계정(샘플)
    password: process.env.DB_PASSWORD,
    host: 'dev-db-host', // 개발용 DB 서버 주소(샘플)
    port: 3306, // MySQL/MariaDB 기본 포트
    database: 'dev_database', // 개발 DB 이름(샘플)
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    waitForConnections: true,
    checkDuplicate: true,
  },
  local: {
    user: 'lgf_app',
    password: process.env.DB_PASSWORD,
    host: '127.0.0.1', // 로컬 개발 DB
    port: 3306,
    database: 'lets_go_festival',
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    waitForConnections: true,
    checkDuplicate: true,
  },
}

const config = {
  db: {
    maria: MARIADB[ENV],
  },
  env: ENV,
  logPath: LOGPATH[ENV],
  port: PORT[ENV],
}

export { config }
