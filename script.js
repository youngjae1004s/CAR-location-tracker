// script.js

const config = {
  apiKey: "AIzaSyBMcqlyHzCO0k6G-6Fzb7AHso2A3gGAbq8",
  authDomain: "car-location-tracker-438f0.firebaseapp.com",
  projectId: "car-location-tracker-438f0",
  storageBucket: "car-location-tracker-438f0.firebasestorage.app",
  messagingSenderId: "645185980587",
  appId: "1:645185980587:web:f2b54d5df01cb14d300fee",
  measurementId: "G-B0BG1K096R"
};

firebase.initializeApp(config);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

let uid, watchId, tracking = false;

auth.signInAnonymously().then(user => {
  uid = user.user.uid;

  db.ref('users/' + uid + '/task').on('value', snap => {
    document.getElementById('taskText').textContent = snap.val() || '전체';
  });

  db.ref('adminDelivery').on('value', snap => {
    const d = snap.val();
    if (!d) return;
    document.getElementById('adminMemo').textContent = d.memo || '';
    document.getElementById('adminTime').textContent = new Date(d.time).toLocaleString();
    if (d.photoUrl) {
      const img = document.getElementById('adminPhoto');
      img.src = d.photoUrl;
      img.style.display = 'block';
    }
  });
});

document.getElementById('toggleBtn').addEventListener('click', () => {
  const carNum = document.getElementById('carNum').value.trim();
  if (!carNum) return alert("차량번호를 입력해주세요.");

  if (tracking) {
    navigator.geolocation.clearWatch(watchId);
    tracking = false;
    document.getElementById('toggleBtn').textContent = '📍 위치 전송 시작';
    document.getElementById('trackingStatus').style.display = 'none';
  } else {
    watchId = navigator.geolocation.watchPosition(pos => {
      const { latitude, longitude } = pos.coords;
      db.ref('locations/' + uid).set({
        lat: latitude,
        lng: longitude,
        time: Date.now(),
        carNum
      });
    }, err => {
      alert("위치 전송 실패: " + err.message);
    }, { enableHighAccuracy: true });

    tracking = true;
    document.getElementById('toggleBtn').textContent = '🛑 위치 전송 중지';
    document.getElementById('trackingStatus').style.display = 'block';
  }
});

document.getElementById('photoInput').addEventListener('change', async e => {
  const files = Array.from(e.target.files);
  const urls = [];
  for (const file of files) {
    const ref = storage.ref(`uploads/${uid}/photos/${Date.now()}_${file.name}`);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    urls.push(url);
  }
  await fetch('https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/sendTelegramPhotos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, photoUrls: urls })
  });
  alert("사진 전송 완료!");
});

document.getElementById('fileInput').addEventListener('change', async e => {
  const files = Array.from(e.target.files);
  for (const file of files) {
    const ref = storage.ref(`uploads/${uid}/files/${Date.now()}_${file.name}`);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    db.ref(`messages/${uid}`).push({
      type: 'file',
      url,
      name: file.name,
      time: Date.now()
    });
  }
  alert("파일 전송 완료!");
});