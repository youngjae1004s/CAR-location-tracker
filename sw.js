self.addEventListener('install', (e) => {
  console.log('서비스 워커 설치 완료');
});
self.addEventListener('fetch', (e) => {
  // 앱 구동을 위해 필요한 기본 핸들러
});