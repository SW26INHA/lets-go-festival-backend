import cron from 'node-cron'

import { config } from '../config'
import { festivalSync } from '../services'
import { logger } from '../utils'

const TAG = '[FestivalScheduler]'

/**
 * 스케줄러를 실행할 인스턴스인지 확인.
 *
 * PM2 cluster 모드에서는 인스턴스마다 프로세스가 뜨므로 그대로 두면
 * 스케줄러가 인스턴스 수만큼 중복 실행된다. 0번 인스턴스에서만 실행한다.
 * (fork 모드나 로컬 실행에서는 NODE_APP_INSTANCE가 없다.)
 *
 * @returns {Boolean}
 */
const isSchedulerInstance = () => {
  const instance = process.env.NODE_APP_INSTANCE

  return instance === undefined || instance === '0'
}

/**
 * 축제 동기화 실행.
 * 스케줄러가 죽지 않도록 오류를 여기서 흡수한다.
 *
 * @returns {Promise<void>}
 */
const runFestivalSync = async () => {
  try {
    await festivalSync.syncFestivals()
  } catch (error) {
    logger.error(`${TAG} 축제 동기화 중 오류 발생: ${error.message}`)
  }
}

/**
 * 축제 동기화 스케줄러 등록.
 *
 * @returns {Object|null} 등록된 cron 태스크. 등록하지 않은 경우 null.
 */
const start = () => {
  if (!isSchedulerInstance()) {
    logger.info(
      `${TAG} PM2 인스턴스 ${process.env.NODE_APP_INSTANCE}이므로 스케줄러를 등록하지 않습니다.`
    )
    return null
  }

  if (!config.tourApi.serviceKey) {
    logger.error(
      `${TAG} TOUR_API_SERVICE_KEY가 없어 스케줄러를 등록하지 않습니다.`
    )
    return null
  }

  const { cron: expression } = config.scheduler.festivalSync
  const task = cron.schedule(expression, runFestivalSync, {
    name: 'festival-sync',
    noOverlap: true, // 이전 실행이 끝나지 않았으면 건너뛴다
    timezone: config.scheduler.timezone,
  })

  logger.info(
    `${TAG} 축제 동기화 스케줄러 등록 완료 (${expression}, ${config.scheduler.timezone})`
  )

  return task
}

/**
 * 축제 동기화 스케줄러 모듈.
 *
 * @module scheduler/festivalScheduler
 */
const festivalScheduler = {
  runFestivalSync,
  start,
}

export { festivalScheduler }
