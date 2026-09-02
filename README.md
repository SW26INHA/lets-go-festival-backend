# Let's Go Festival Backend

Node.js(v22.21.1) + Express로 구성된 **축제 정보 서비스** 백엔드입니다.

한국관광공사 TourAPI에서 축제 데이터를 주기적으로 수집해 DB에 적재하고,
지역/기간/상태 조건으로 축제 목록을 조회하는 API를 제공합니다.

<br />

## 기술 스택

| 구분           | 사용 기술                                   |
| -------------- | ------------------------------------------- |
| **런타임**     | Node.js 22.21.1 (Babel + ESM)               |
| **프레임워크** | Express 5                                   |
| **DB**         | MySQL (mysql2, Connection Pool)             |
| **스케줄러**   | node-cron                                   |
| **로깅**       | winston + winston-daily-rotate-file, morgan |
| **외부 API**   | 한국관광공사 TourAPI(KorService2)           |

<br />

## 배포 구성

| 구분     | 서비스     | 비고                                                 |
| -------- | ---------- | ---------------------------------------------------- |
| **서버** | **Render** | Web Service. `npm run start`로 프로세스 직접 실행    |
| **DB**   | **Aiven**  | Aiven for MySQL. 접속 정보는 `./src/config/index.js` |

### Render 설정

| 항목          | 값                                       |
| ------------- | ---------------------------------------- |
| Language      | Node                                     |
| Build Command | `npm install`                            |
| Start Command | `npm run start`                          |
| Node Version  | `package.json`의 `engines.node`(22.21.1) |

**환경변수(Environment)** 에 아래 두 값을 등록해야 합니다.
`NODE_ENV=production`은 `start` 스크립트에서 `cross-env`로 직접 주입하므로 별도 등록이 필요 없습니다.

| 키                     | 설명                                                  |
| ---------------------- | ----------------------------------------------------- |
| `DB_PASSWORD`          | Aiven MySQL 접속 비밀번호                             |
| `TOUR_API_SERVICE_KEY` | 공공데이터포털 TourAPI 서비스키(**디코딩 키**를 사용) |

### PM2를 사용하지 않는 이유

Render는 컨테이너에서 **하나의 프로세스를 포그라운드로 유지**하는 방식으로 서비스를 실행합니다.
PM2는 앱을 백그라운드 데몬으로 띄우고 명령 자체는 바로 종료되기 때문에,
`pm2 start ...`를 Start Command로 쓰면 컨테이너가 곧바로 종료됩니다.

그래서 운영용 `start` 스크립트에서 PM2를 제거하고 `NODE_ENV=production`으로 프로세스를 직접 실행하도록 변경했습니다.

```bash
# 변경 전 (PM2)
"start": "pm2 restart backend-sample-prod || pm2 start ecosystem.config.js --env production"

# 변경 후 (Render)
"start": "cross-env NODE_ENV=production nodemon --exec babel-node ./src"
```

`dev`/`stop` 스크립트와 `ecosystem.config.js`는 **PM2를 쓰는 개발 서버 전용**으로 남아 있습니다.

<br />

## 실행 방법

1. 의존성 설치

   ```bash
   npm install
   ```

2. 프로젝트 루트에 `.env` 생성

   ```bash
   DB_PASSWORD=<DB 비밀번호>
   TOUR_API_SERVICE_KEY=<TourAPI 디코딩 서비스키>
   ```

3. 실행

   ```bash
   # 로컬 개발 (로컬 MySQL, 파일 변경 시 자동 재시작)
   npm run local

   # 개발 서버 (PM2)
   npm run dev

   # 운영 (Render에서 실행되는 명령)
   npm run start
   ```

### 환경별 설정값

`NODE_ENV` 값에 따라 `./src/config/index.js`에서 포트 / DB / 로그 경로가 결정됩니다.

| 환경          | 포트 | DB          | 로그 경로                 |
| ------------- | ---- | ----------- | ------------------------- |
| `local`       | 4000 | 로컬 MySQL  | `./logs`                  |
| `development` | 4011 | 개발 DB     | `./lets-go-festival/dev`  |
| `production`  | 4000 | Aiven MySQL | `./lets-go-festival/prod` |

<br />

## 스크립트 설명

| 스크립트              | 설명                                                                     |
| --------------------- | ------------------------------------------------------------------------ |
| **local**             | 로컬 개발 환경 실행. 파일 변경 시 자동 재시작(nodemon) 및 Babel 적용     |
| **dev**               | PM2 개발 모드 실행. 이미 실행 중이면 재시작, 없으면 새로 시작            |
| **start**             | 운영 실행(Render). PM2 없이 `NODE_ENV=production`으로 프로세스 직접 실행 |
| **stop**              | PM2로 실행 중인 모든 애플리케이션 종료(개발 서버 전용)                   |
| **sync:festival**     | 축제 동기화 1회 수동 실행. 신규 축제를 실제로 저장                       |
| **sync:festival:dry** | 축제 동기화 예행 실행. 수집만 하고 INSERT는 하지 않음                    |
| **lint**              | 프로젝트 전체를 ESLint 규칙에 따라 검사                                  |
| **lint:fix**          | ESLint 자동 수정 가능한 부분을 정리                                      |
| **format**            | Prettier 규칙에 맞는지 검사. 코드 스타일 유지 여부 확인 용도             |
| **format:fix**        | Prettier 포맷 규칙에 따라 전체 코드 자동 정리                            |

> `sync:festival`, `sync:festival:dry`는 `NODE_ENV=local`로 동작하므로 **로컬 DB**를 대상으로 실행됩니다.

<br />

## API

기본 경로는 `/api/v1` 입니다.

| 메서드 | 경로                    | 설명                                      |
| ------ | ----------------------- | ----------------------------------------- |
| GET    | `/api/v1/regions`       | 시/도 목록 조회                           |
| GET    | `/api/v1/festivals`     | 축제 목록 조회(필터 + 페이지네이션)       |
| GET    | `/api/v1/festivals/map` | 지도용 축제 목록 조회(종료되지 않은 축제) |

### `GET /api/v1/festivals` 쿼리 파라미터

| 파라미터    | 타입   | 기본값 | 설명                                                      |
| ----------- | ------ | ------ | --------------------------------------------------------- |
| `regionIdx` | Number | -      | 시/도 인덱스                                              |
| `year`      | Number | -      | 연도(1000~9999)                                           |
| `month`     | Number | -      | 월(1~12)                                                  |
| `statuses`  | String | -      | `ONGOING`, `UPCOMING`, `ENDED` 중 콤마로 구분해 다중 지정 |
| `keyword`   | String | -      | 축제명 부분 검색                                          |
| `page`      | Number | `1`    | 페이지 번호(1부터)                                        |
| `size`      | Number | `20`   | 페이지 크기(최대 100)                                     |

모든 응답은 `success`, `code`, `message`, `data` 형태로 반환되며,
검증 실패는 `400`, 서버 오류는 `500`으로 응답합니다.

<br />

## 축제 동기화 스케줄러

- **주기**: 매주 월요일 04:00 (`Asia/Seoul`)
- **수집 범위**: 실행일 기준 `-30일 ~ +1년`
- **동작**: TourAPI에서 축제를 조회해 DB에 없는 `content_id`만 신규 저장(중복 방지)
- **주의**
  - `TOUR_API_SERVICE_KEY`가 없으면 스케줄러를 등록하지 않습니다.
  - PM2 cluster 모드에서 중복 실행되지 않도록 `NODE_APP_INSTANCE=0`인 인스턴스에서만 등록합니다.

설정값은 `./src/config/index.js`의 `SCHEDULER`에서 변경할 수 있습니다.

<br />

## 디렉토리 구조

```bash
lets-go-festival-backend/
├── src/
│   ├── config/          # 환경별 설정 (포트, DB, 로그 경로, TourAPI, 스케줄러)
│   │   └── index.js
│   ├── controllers/     # 비즈니스 로직
│   │   ├── FestivalController.js
│   │   ├── RegionController.js
│   │   └── index.js
│   ├── db/              # MySQL 커넥션 풀 및 쿼리 헬퍼
│   │   ├── MySQL.js
│   │   └── index.js
│   ├── router/          # API 라우팅
│   │   ├── api/
│   │   │   ├── FestivalApi.js
│   │   │   ├── RegionApi.js
│   │   │   └── index.js
│   │   └── index.js
│   ├── scheduler/       # node-cron 스케줄러
│   │   ├── FestivalScheduler.js
│   │   └── index.js
│   ├── scripts/         # 수동 실행 스크립트
│   │   └── RunFestivalSync.js
│   ├── services/        # 외부 연동 및 동기화 로직
│   │   ├── FestivalSync.js
│   │   ├── TourApi.js
│   │   └── index.js
│   ├── utils/           # 공통 유틸리티
│   │   ├── Winston.js
│   │   └── index.js
│   ├── validators/      # 요청 값 검증
│   │   ├── FestivalValidator.js
│   │   └── index.js
│   └── index.js         # 서버 엔트리포인트
│
├── babel-hook.js        # Babel 로드용 파일
├── ecosystem.config.js  # PM2 실행 설정(개발 서버 전용)
├── eslint.config.js     # ESLint 설정
├── .prettierrc.json     # Prettier 설정
└── package.json
```

<br />

## 사용 시 주의사항

- `.env`는 저장소에 커밋하지 않습니다. 운영 값은 Render의 Environment에 등록합니다.
- `TOUR_API_SERVICE_KEY`는 반드시 **디코딩 키**를 사용해야 합니다.
  axios가 쿼리스트링을 자동 인코딩하므로 인코딩 키를 넣으면 이중 인코딩되어
  `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`가 발생합니다.
- 운영 포트는 `4000`으로 고정되어 있으며 Render가 주입하는 `PORT` 환경변수는 사용하지 않습니다.
- 로그는 파일로 남지만 Render의 파일시스템은 재배포 시 초기화되므로,
  보관이 필요하면 Render 대시보드의 로그나 별도 로그 수집 도구를 사용해야 합니다.
- PM2는 개발 서버에서만 사용합니다. 설치되어 있지 않다면 전역 설치가 필요합니다.

  ```bash
  # 설치 여부 확인 (버전 확인)
  pm2 --version

  # 설치되어 있지 않은 경우 전역 설치
  npm install -g pm2
  ```
