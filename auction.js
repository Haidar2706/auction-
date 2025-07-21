// auction.js

// Пользователи
const users = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'user', password: 'user', role: 'user' }
];

// Лоты
let lots = [
  {
    id: 1,
    title: 'Лот 1',
    category: 'Категория A',
    price: 1000,
    status: 'active',
    image: 'https://via.placeholder.com/100',
    bids: [],
    endTime: Date.now() + 1000 * 60 * 5
  },
  {
    id: 2,
    title: 'Лот 2',
    category: 'Категория B',
    price: 2000,
    status: 'active',
    image: 'https://via.placeholder.com/100',
    bids: [],
    endTime: Date.now() + 1000 * 60 * 10
  }
];

let currentUser = null;

// DOM
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');

const currentUserSpan = document.getElementById('currentUser');
const lotsList = document.getElementById('lotsList');
const adminPanel = document.getElementById('adminPanel');

const addLotForm = document.getElementById('addLotForm');
const newLotTitle = document.getElementById('newLotTitle');
const newLotCategory = document.getElementById('newLotCategory');
const newLotPrice = document.getElementById('newLotPrice');
const newLotStatus = document.getElementById('newLotStatus');

loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', logout);
addLotForm.addEventListener('submit', addLot);

// Telegram
function sendTelegramMessage(text) {
  const token = '7816037426:AAFVg73M8KYemZl4OoY2dYGyH2jd2_2S7lw';
  const chatId = '1237960319';
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
}

function login() {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = user;
    localStorage.setItem('auctionUser', JSON.stringify(currentUser));
    loginError.textContent = '';
    showMainPage();
  } else {
    loginError.textContent = 'Неверный логин или пароль';
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('auctionUser');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('mainPage').classList.add('hidden');
}

function showMainPage() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('mainPage').classList.remove('hidden');
  currentUserSpan.textContent = currentUser.username;

  if (currentUser.role === 'admin') {
    adminPanel.classList.remove('hidden');
  } else {
    adminPanel.classList.add('hidden');
  }

  renderLots();
}

function renderLots() {
  lotsList.innerHTML = '';
  lots.forEach(lot => {
    const highestBid = lot.bids.length ? Math.max(...lot.bids.map(b => b.amount)) : lot.price;
    const remainingMs = lot.endTime ? lot.endTime - Date.now() : null;

    const div = document.createElement('div');
    div.className = 'lot';
    div.innerHTML = `
      <img src="${lot.image}" />
      <b>${lot.title}</b><br/>
      Категория: ${lot.category}<br/>
      Стартовая цена: ${lot.price} сом<br/>
      Текущая ставка: ${highestBid} сом<br/>
      Статус: <span id="status${lot.id}">${lot.status}</span><br/>
      ${lot.status === 'active' && remainingMs > 0 ? `
        До окончания: <span id="timer${lot.id}">${formatTime(remainingMs)}</span><br/>
        <input type="number" id="bidAmount${lot.id}" placeholder="Ваша ставка" min="${highestBid + 1}" />
        <button onclick="placeBid(${lot.id})">Сделать ставку</button>
      ` : ''}
    `;
    lotsList.appendChild(div);
  });
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms / 1000) % 60);
  return `${minutes}м ${seconds < 10 ? '0' : ''}${seconds}с`;
}

function updateTimers() {
  lots.forEach(lot => {
    if (lot.status === 'active' && lot.endTime) {
      const remainingMs = lot.endTime - Date.now();
      const timerSpan = document.getElementById(`timer${lot.id}`);
      const statusSpan = document.getElementById(`status${lot.id}`);

      if (remainingMs <= 0) {
        lot.status = 'sold';
        if (statusSpan) statusSpan.textContent = 'sold';
        if (timerSpan) timerSpan.textContent = 'Аукцион окончен';
      } else {
        if (timerSpan) timerSpan.textContent = formatTime(remainingMs);
      }
    }
  });
}

function placeBid(lotId) {
  const input = document.getElementById(`bidAmount${lotId}`);
  const amount = parseFloat(input.value);
  const lot = lots.find(l => l.id === lotId);
  const highestBid = lot.bids.length ? Math.max(...lot.bids.map(b => b.amount)) : lot.price;

  if (amount > highestBid) {
    lot.bids.push({ user: currentUser.username, amount, time: Date.now() });
    input.value = '';
    sendTelegramMessage(`💸 Новая ставка: ${amount} сом на "${lot.title}" от ${currentUser.username}`);
    renderLots();
  } else {
    alert(`Ставка должна быть больше ${highestBid}`);
  }
}

function addLot(event) {
  event.preventDefault();

  const title = newLotTitle.value;
  const category = newLotCategory.value;
  const price = parseFloat(newLotPrice.value);
  const status = newLotStatus.value;

  lots.push({
    id: lots.length + 1,
    title,
    category,
    price,
    image: 'https://via.placeholder.com/100',
    status,
    bids: [],
    endTime: status === 'active' ? Date.now() + 1000 * 60 * 5 : null
  });

  addLotForm.reset();
  renderLots();
}

// Таймер
setInterval(() => {
  if (currentUser) updateTimers();
}, 1000);

window.onload = () => {
  const savedUser = localStorage.getItem('auctionUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMainPage();
  }
};
// ===== JSON Сохранение и Загрузка =====

function saveToLocalStorage() {
  const data = { users, lots };
  localStorage.setItem('auctionData', JSON.stringify(data));
  alert('Сохранено в LocalStorage');
}

function loadFromLocalStorage() {
  const data = JSON.parse(localStorage.getItem('auctionData'));
  if (data) {
    if (Array.isArray(data.users)) users.splice(0, users.length, ...data.users);
    if (Array.isArray(data.lots)) lots = data.lots;
    alert('Загружено из LocalStorage');
    renderLots();
  } else {
    alert('Нет сохранённых данных');
  }
}

function downloadJSON() {
  const data = { users, lots };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'auction-data.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function uploadJSONFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data.users)) users.splice(0, users.length, ...data.users);
      if (Array.isArray(data.lots)) lots = data.lots;
      alert('Загружено из файла!');
      renderLots();
    } catch (err) {
      alert('Ошибка при чтении JSON');
    }
  };
  reader.readAsText(file);
}
