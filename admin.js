// admin.js

auth.onAuthStateChanged(user => {
  if (user) {
    listenToLocations();
    listenToMessages();
  }
});

// 위치 목록 표시
function listenToLocations() {
  const ref = db.ref('locations');
  ref.on('value', snapshot => {
    const data = snapshot.val() || {};
    const container = document.getElementById('locationList');
    container.innerHTML = '';

    Object.entries(data).forEach(([uid, loc]) => {
      const div = document.createElement('div');
      div.style.marginBottom = '12px';
      div.innerHTML = `
        <strong>${loc.carNum || '미등록 차량'}</strong><br/>
        위도: ${loc.lat.toFixed(5)}, 경도: ${loc.lng.toFixed(5)}<br/>
        시간: ${new Date(loc.time).toLocaleString()}
      `;
      container.appendChild(div);
    });

    if (Object.keys(data).length === 0) {
      container.textContent = '위치 정보 없음';
    }
  });
}

// 메시지 수신 (사진/파일)
function listenToMessages() {
  const ref = db.ref('messages');
  ref.on('value', snapshot => {
    const data = snapshot.val() || {};
    const container = document.getElementById('messageList');
    container.innerHTML = '';

    Object.entries(data).forEach(([uid, messages]) => {
      Object.values(messages).forEach(msg => {
        const div = document.createElement('div');
        div.style.marginBottom = '12px';
        if (msg.type === 'file') {
          div.innerHTML = `
            <strong>파일:</strong> <a href="${msg.url}" target="_blank">${msg.name}</a><br/>
            시간: ${new Date(msg.time).toLocaleString()}
          `;
        } else if (msg.type === 'photo') {
          div.innerHTML = `
            <strong>사진:</strong><br/>
            <img src="${msg.url}" style="max-width:100%; border-radius:8px; margin-top:6px"/><br/>
            시간: ${new Date(msg.time).toLocaleString()}
          `;
        }
        container.appendChild(div);
      });
    });

    if (Object.keys(data).length === 0) {
      container.textContent = '전송된 메시지가 없습니다.';
    }
  });
}

// 전달사항 전송
document.getElementById('sendMemoBtn').addEventListener('click', async () => {
  const memo = document.getElementById('adminMemoInput').value.trim();
  const fileInput = document.getElementById('adminPhotoInput');
  const file = fileInput.files[0];

  let photoUrl = '';
  if (file) {
    const ref = storage.ref(`admin/photos/${Date.now()}_${file.name}`);
    await ref.put(file);
    photoUrl = await ref.getDownloadURL();
  }

  const data = {
    memo,
    photoUrl,
    time: Date.now()
  };

  await db.ref('adminDelivery').set(data);
  alert("전달사항이 전송되었습니다.");
});