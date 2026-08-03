/**
 * 설정 정보.
 *
 * @module config
 */

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
 * @property {Object} maria
 */
const MARIADB = {
  production: {
    host: '127.0.0.1', // 운영 DB 주소(샘플)
    port: 3306,
    user: 'prod_user',
    password: 'prod_password',
    database: 'prod_database',
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    waitForConnections: true,
    checkDuplicate: true,
  },
  development: {
    user: 'dev_user', // 개발 계정(샘플)
    password: 'dev_password', // 개발 비밀번호(샘플)
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
    user: 'local_user',
    password: 'local_password',
    host: '127.0.0.1', // 로컬 개발 DB
    port: 3306,
    database: 'local_database',
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
