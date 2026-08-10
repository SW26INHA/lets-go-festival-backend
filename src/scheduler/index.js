import { festivalScheduler } from './FestivalScheduler'

/**
 * 등록된 모든 스케줄러 시작.
 */
const startSchedulers = () => {
  festivalScheduler.start()
}

export * from './FestivalScheduler'
export { startSchedulers }
