let currentUser = null;
let originalImage = null;
let currentRotation = 0;

// DOM elements
const authSection = document.getElementById('auth-section');
const editorSection = document.getElementById('editor-section');
const authMessage = document.getElementById('auth-message');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const galleryPhotos = document.getElementById('gallery-photos');

function toggleAdminPanel() {
  const editorSection = document.getElementById('editor-section');
  const adminSection = document.getElementById('admin-section');
  
  if (adminSection.style.display === 'none') {
    editorSection.style.display = 'none';
    adminSection.style.display = 'block';
    loadAdminPanel();
  } else {
    adminSection.style.display = 'none';
    editorSection.style.display = 'block';
  }
}

function toggleEditorAdmin() {
  toggleAdminPanel(); // Це просто зворотня функція
}


// Auth functions
async function register() {
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    if (response.ok) {
      authMessage.textContent = 'Реєстрація успішна! Тепер увійдіть.';
      authMessage.style.color = 'green';
    } else {
      authMessage.textContent = data.error || 'Помилка реєстрації';
      authMessage.style.color = 'red';
    }
  } catch (error) {
    authMessage.textContent = 'Помилка з\'єднання';
    authMessage.style.color = 'red';
  }
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (response.ok) {
      currentUser = { token: data.token, id: data.userId };
      localStorage.setItem('photoEditorToken', data.token);
      localStorage.setItem('photoEditorUserId', data.userId);
      authSection.style.display = 'none';
      editorSection.style.display = 'block';
      loadGallery();
    } else {
      authMessage.textContent = data.error || 'Помилка входу';
      authMessage.style.color = 'red';
    }
  } catch (error) {
    authMessage.textContent = 'Помилка з\'єднання';
    authMessage.style.color = 'red';
  }

    if (response.ok) {
    currentUser = { token: data.token, id: data.userId };
    // Додайте цю перевірку:
    try {
      const userResponse = await fetch(`http://localhost:3000/api/auth/me`, {
        headers: { 'Authorization': 'Bearer ' + data.token }
      });
      const userData = await userResponse.json();
      
      if (userData.role === 'admin') {
        document.getElementById('admin-btn').style.display = 'block';
      }
    } catch (e) {
      console.error('Error checking user role:', e);
    }
    
    authSection.style.display = 'none';
    editorSection.style.display = 'block';
    loadGallery();
  }
  
}

// Check if user is already logged in
function checkAuth() {
  const token = localStorage.getItem('photoEditorToken');
  const userId = localStorage.getItem('photoEditorUserId');
  if (token && userId) {
    currentUser = { token, id: userId };
    authSection.style.display = 'none';
    editorSection.style.display = 'block';
    loadGallery();
  }
}

// Image editing functions
function drawTransformedImage() {
  if (!originalImage) return;

  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');

  let width = originalImage.width;
  let height = originalImage.height;

  if (currentRotation % 180 !== 0) {
    offCanvas.width = height;
    offCanvas.height = width;
  } else {
    offCanvas.width = width;
    offCanvas.height = height;
  }

  offCtx.save();
  offCtx.translate(offCanvas.width / 2, offCanvas.height / 2);
  offCtx.rotate((currentRotation * Math.PI) / 180);
  offCtx.drawImage(originalImage, -width / 2, -height / 2);
  offCtx.restore();

  let imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
  let data = imageData.data;
  let brightness = document.getElementById('brightness').value / 100;
  let grayscale = document.getElementById('grayscale').checked;
  let sepia = document.getElementById('sepia').checked;
  let invert = document.getElementById('invert').checked;

  for (let i = 0; i < data.length; i += 4) {
    data[i] *= brightness;
    data[i + 1] *= brightness;
    data[i + 2] *= brightness;

    if (grayscale) {
      let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = avg;
    }

    if (sepia) {
      let r = data[i], g = data[i + 1], b = data[i + 2];
      data[i]     = Math.min(255, 0.393*r + 0.769*g + 0.189*b);
      data[i + 1] = Math.min(255, 0.349*r + 0.686*g + 0.168*b);
      data[i + 2] = Math.min(255, 0.272*r + 0.534*g + 0.131*b);
    }

    if (invert) {
      data[i]     = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  }

  offCtx.putImageData(imageData, 0, 0);

  canvas.width = offCanvas.width;
  canvas.height = offCanvas.height;
  ctx.drawImage(offCanvas, 0, 0);
}

// Event listeners
document.getElementById('upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      originalImage = img;
      currentRotation = 0;
      drawTransformedImage();
    };
    img.src = event.target.result;
  };

  if (file) {
    reader.readAsDataURL(file);
  }
});

['brightness', 'grayscale', 'sepia', 'invert'].forEach(id => {
  document.getElementById(id).addEventListener('input', drawTransformedImage);
});

document.getElementById('rotate').addEventListener('click', () => {
  currentRotation = (currentRotation + 90) % 360;
  drawTransformedImage();
});

document.getElementById('crop').addEventListener('click', () => {
  if (!originalImage) return;

  // Розміри обрізаної області (можна змінити)
  const cropWidth = canvas.width / 2;
  const cropHeight = canvas.height / 2;
  
  // Створюємо новий canvas для обрізаного зображення
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext('2d');
  
  // Обрізаємо центральну частину
  croppedCtx.drawImage(
    canvas,
    canvas.width / 4,  // Початок обрізання по X
    canvas.height / 4, // Початок обрізання по Y
    cropWidth,         // Ширина обрізаної області
    cropHeight,        // Висота обрізаної області
    0,                 // Початок малювання по X
    0,                 // Початок малювання по Y
    cropWidth,         // Ширина малювання
    cropHeight         // Висота малювання
  );
  
  // Оновлюємо оригінальне зображення
  const croppedImage = new Image();
  croppedImage.onload = function() {
    originalImage = croppedImage; // Оновлюємо оригінал
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    ctx.drawImage(croppedImage, 0, 0);
  };
  croppedImage.src = croppedCanvas.toDataURL();
});

document.getElementById('download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'edited_image.png';
  link.href = canvas.toDataURL();
  link.click();
});

document.getElementById('save').addEventListener('click', async () => {
  if (!currentUser) return;
  
  const photoData = canvas.toDataURL();
  try {
    const response = await fetch('http://localhost:3000/api/photos/save', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      body: JSON.stringify({ userId: currentUser.id, photoData })
    });
    
    if (response.ok) {
      loadGallery();
    }
  } catch (error) {
    console.error('Error saving photo:', error);
  }
});


// Галерея
function addToGallery() {
  const gallery = document.getElementById('gallery-photos');
  const img = new Image();
  img.src = canvas.toDataURL();
  img.style.maxWidth = '120px';
  img.style.maxHeight = '120px';
  img.style.border = '2px solid #444';
  img.style.borderRadius = '6px';
  img.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  gallery.prepend(img);
}

document.getElementById('save').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'edited_image.png';
  link.href = canvas.toDataURL();
  link.click();
  addToGallery();
});

// Initialize
checkAuth();

// Undo last action
async function undoLast() {
  if (!currentUser) return;
  try {
    const response = await fetch(`http://localhost:3000/api/photos/undo/${currentUser.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + currentUser.token }
    });
    const data = await response.json();
    if (response.ok) {
      alert('Останню дію скасовано');
      loadGallery();
    } else {
      alert(data.error || 'Помилка відміни дії');
    }
  } catch (e) {
   alert("Помилка з'єднання");
  }
}

async function loadAdminPanel() {
  if (!currentUser) return;
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/users', {
      headers: { 'Authorization': 'Bearer ' + currentUser.token }
    });
    const data = await response.json();
    
    if (response.ok) {
      const adminSection = document.getElementById('admin-section');
      const usersList = document.getElementById('admin-users-list');
      
      usersList.innerHTML = data.users.map(user => `
        <div class="user-card">
          <h3>${user.username}</h3>
          <p>Email: ${user.email}</p>
          <p>Фото: ${user.photos?.length || 0}</p>
          <button onclick="deleteUser('${user._id}')">Видалити</button>
        </div>
      `).join('');
      
      adminSection.style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading admin panel:', error);
  }
}

async function deleteUser(userId) {
  if (!confirm('Ви впевнені, що хочете видалити цього користувача?')) return;
  
  try {
    const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + currentUser.token }
    });
    
    if (response.ok) {
      loadAdminPanel();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

// Logout user
function logout() {
  localStorage.removeItem('photoEditorToken');
  localStorage.removeItem('photoEditorUserId');
  fetch('http://localhost:3000/api/auth/logout', { method: 'POST' });
  currentUser = null;
  editorSection.style.display = 'none';
  authSection.style.display = 'block';
}
