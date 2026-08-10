/**
 * 축제 동기화 수동 실행 스크립트.
 *
 * 스케줄을 기다리지 않고 동기화를 한 번 실행한다.
 *
 * @example
 * npm run sync:festival:dry   # 수집만 하고 INSERT는 하지 않음
 * npm run sync:festival       # 실제로 신규 축제를 저장
 */
import { mysql } from '../db'
import { festivalSync } from '../services'
import { logger } from '../utils'

const dryRun = process.argv.includes('--dry')

festivalSync
  .syncFestivals({ dryRun })
  .then((result) => {
    logger.info(`[RunFestivalSync] 결과: ${JSON.stringify(result)}`)

    if (!dryRun && result.inserted > 0) {
      logger.info(
        `[RunFestivalSync] 되돌리려면: DELETE FROM festival WHERE last_synced_at = '${result.syncedAt}';`
      )
    }
  })
  .catch((error) => {
    logger.error(`[RunFestivalSync] 실패: ${error.message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    // 커넥션 풀을 닫아야 프로세스가 스스로 종료된다
    await mysql.close().catch(() => {})
  })
