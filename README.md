# 백엔드 템플릿

Node.js(v22.21.1) + Express로 구성된 백엔드 템플릿입니다.

<br />

## 사용 방법

1. 템플릿 다운로드
2. 기존 Git 연결 제거
3. 새로운 원격 저장소(origin) 등록
4. 의존성 설치

   ```bash
   npm install
   ```

5. 실행

   ```bash
   # 로컬 개발
   npm run local

   # 개발 모드
   npm run dev

   # 운영 모드
   npm run start
   ```

### 사용 시 주의사항

- 개발 환경에 맞게 `./src/config/index.js` 내용을 반드시 수정해야 합니다.
- PM2가 설치되어 있지 않은 경우 전역으로 설치해야 합니다.

  ```bash
  # 설치 여부 확인 (버전 확인)
  pm2 --version

  # 설치되어 있지 않은 경우 전역 설치
  npm install -g pm2
  ```

<br />

## 스트립트 설명

| 스크립트       | 설명                                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| **local**      | 로컬 개발 환경 실행. 파일 변경 시 자동 재시작(nodemon) 및 Babel로 최신 JS 문법 지원 |
| **dev**        | PM2 개발 모드 실행. 이미 실행 중이면 재시작, 없으면 새로 시작                       |
| **start**      | PM2 운영 모드 실행. 운영용 환경값(NODE_ENV=production)으로 서버 시작                |
| **stop**       | PM2로 실행 중인 모든 애플리케이션 종료                                              |
| **lint**       | 프로젝트 전체를 ESLint 규칙에 따라 검사                                             |
| **lint:fix**   | ESLint 자동 수정 가능한 부분을 정리                                                 |
| **format**     | Prettier 규칙에 맞는지 검사. 코드 스타일 유지 여부 확인 용도                        |
| **format:fix** | Prettier 포맷 규칙에 따라 전체 코드 자동 정리                                       |

<br />

## 디렉토리 구조

```bash
backend-template/
├── src/
│   ├── config/          # 환경별 설정
│   │   └── index.js
│   ├── controllers/     # 비즈니스 로직
│   │   └── index.js
│   │   └── SampleController.js
│   ├── router/          # API 라우팅
│   │   └── api/
│   │       └── index.js
│   │       └── SampleApi.js
│   │   └── index.js
│   ├── utils/           # 공통 유틸리티
│   │   └── index.js
│   │   ├── Socket.js
│   │   └── Winston.js
│   └── index.js         # 서버 엔트리포인트
│
├── babel-hook.js        # Babel 로드용 파일
├── ecosystem.config.js  # PM2 실행 설정
├── eslint.config.js     # ESLint 설정
├── .prettierrc          # Prettier 설정
└── package.json
```
