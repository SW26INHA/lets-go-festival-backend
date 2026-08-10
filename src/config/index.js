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

/**
 * TourAPI(한국관광공사 국문 관광정보) 연동 정보.
 *
 * 서비스키는 저장소에 커밋하지 않고 .env(TOUR_API_SERVICE_KEY)로 주입한다.
 * 공공데이터포털이 제공하는 두 종류의 키 중 "디코딩" 키를 넣어야 한다.
 * axios가 쿼리스트링을 자동으로 인코딩하므로 인코딩 키를 넣으면 이중 인코딩되어
 * SERVICE_KEY_IS_NOT_REGISTERED_ERROR가 발생한다.
 *
 * @property {Object} TOURAPI
 */
const TOURAPI = {
  baseUrl: 'https://apis.data.go.kr/B551011/KorService2',
  mobileApp: 'LetsGoFestival',
  mobileOS: 'WEB',
  numOfRows: 100, // 한 페이지 결과 수(최대 100)
  pageDelay: 100, // 페이지 요청 사이 간격(ms)
  serviceKey: process.env.TOUR_API_SERVICE_KEY,
  timeout: 10000,
}

/**
 * 스케줄러 설정.
 *
 * @property {Object} SCHEDULER
 */
const SCHEDULER = {
  timezone: 'Asia/Seoul',
  festivalSync: {
    cron: '0 4 * * 1', // 매주 월요일 04:00
    startOffsetDays: 30, // 수집 시작일 = 실행일 - 30일
    endOffsetYears: 1, // 수집 종료일 = 실행일 + 1년
  },
}

const config = {
  db: {
    maria: MARIADB[ENV],
  },
  env: ENV,
  logPath: LOGPATH[ENV],
  port: PORT[ENV],
  scheduler: SCHEDULER,
  tourApi: TOURAPI,
}

export { config }
