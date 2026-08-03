module.exports = {
  apps: [
    {
      autorestart: true, // 에러 시 자동 재시작
      exec_mode: 'cluster', // 클러스터 모드 (CPU 코어 활용)
      ignore_watch: ['logs/', 'node_modules/'], // 감시 제외 폴더
      instances: 1, // 인스턴스 수 (운영 환경은 scale up 가능)
      merge_logs: true, // 모든 클러스터 로그를 하나로 합침
      name: 'backend-template', // 기본 앱 이름
      script: './babel-hook.js', // Babel을 통한 진입 파일
      watch: ['src/'], // src 폴더 감시
      watch_delay: 1000, // 파일 변경 후 1초 뒤 재시작 (불필요한 반복 방지)

      env: {
        // 개발 환경
        NODE_ENV: 'development',
        name: 'backend-template-dev',
      },
      env_production: {
        // 운영 환경
        NODE_ENV: 'production',
        name: 'backend-template-prod',
      },
    },
  ],
}
