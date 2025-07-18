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
      endTime: Date.now() + 1000 * 60 * 5 // 5 минут
    },
    {
      id: 2,
      title: 'Лот 2',
      category: 'Категория B',
      price: 2000,
      status: 'active',
      image: 'https://via.placeholder.com/100',
      bids: [],
      endTime: Date.now() + 1000 * 60 * 10 // 10 минут
    },
    {
      id: 3,
      title: 'Лот 3',
      category: 'Категория A',
      price: 1500,
      status: 'sold',
      image: 'https://via.placeholder.com/100',
      bids: []
    }
  ];
  
  let currentUser = null;
  let editingLotId = null;
  
  // Получаем элементы из DOM
  const loginUsername = document.getElementById('loginUsername');
  const loginPassword = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');
  
  const currentUserSpan = document.getElementById('currentUser');
  const lotsList = document.getElementById('lotsList');
  const adminPanel = document.getElementById('adminPanel');
  
  const searchTitle = document.getElementById('searchTitle');
  const filterCategory = document.getElementById('filterCategory');
  const filterStatus = document.getElementById('filterStatus');
  const filterPriceMin = document.getElementById('filterPriceMin');
  const filterPriceMax = document.getElementById('filterPriceMax');
  const sortSelect = document.getElementById('sortSelect');
  
  const addLotForm = document.getElementById('addLotForm');
  const newLotTitle = document.getElementById('newLotTitle');
  const newLotCategory = document.getElementById('newLotCategory');
  const newLotPrice = document.getElementById('newLotPrice');
  const newLotImage = document.getElementById('newLotImage');
  const newLotStatus = document.getElementById('newLotStatus');
  const addLotSubmitBtn = document.getElementById('addLotSubmitBtn');
  
  // События
  loginBtn.addEventListener('click', login);
  logoutBtn.addEventListener('click', logout);
  
  if(searchTitle) searchTitle.addEventListener('input', applyFilters);
  if(filterCategory) filterCategory.addEventListener('change', applyFilters);
  if(filterStatus) filterStatus.addEventListener('change', applyFilters);
  if(filterPriceMin) filterPriceMin.addEventListener('input', applyFilters);
  if(filterPriceMax) filterPriceMax.addEventListener('input', applyFilters);
  if(sortSelect) sortSelect.addEventListener('change', applyFilters);
  
  if(addLotForm) addLotForm.addEventListener('submit', addLot);
  
  // Функции
  
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
    loginUsername.value = '';
    loginPassword.value = '';
    clearFilters();
    editingLotId = null;
    addLotSubmitBtn.textContent = 'Добавить лот';
    addLotForm.reset();
    lotsList.innerHTML = '';
  }
  
  function showMainPage() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainPage').classList.remove('hidden');
    currentUserSpan.textContent = currentUser.username;
  
    if(currentUser.role === 'admin') {
      adminPanel.classList.remove('hidden');
    } else {
      adminPanel.classList.add('hidden');
    }
  
    applyFilters();
  }
  
  function applyFilters() {
    const searchText = searchTitle ? searchTitle.value.trim().toLowerCase() : '';
    const category = filterCategory ? filterCategory.value : '';
    const status = filterStatus ? filterStatus.value : '';
    const priceMin = filterPriceMin ? parseFloat(filterPriceMin.value) : NaN;
    const priceMax = filterPriceMax ? parseFloat(filterPriceMax.value) : NaN;
    const sortValue = sortSelect ? sortSelect.value : '';
  
    // Обновляем статус лотов по таймеру
    lots.forEach(lot => {
      if(lot.status === 'active' && lot.endTime && Date.now() >= lot.endTime) {
        lot.status = 'sold';
      }
    });
  
    let filtered = lots.slice();
  
    if(searchText) filtered = filtered.filter(l => l.title.toLowerCase().includes(searchText));
    if(category) filtered = filtered.filter(l => l.category === category);
    if(status) filtered = filtered.filter(l => l.status === status);
    if(!isNaN(priceMin)) filtered = filtered.filter(l => l.price >= priceMin);
    if(!isNaN(priceMax)) filtered = filtered.filter(l => l.price <= priceMax);
  
    if(sortValue === 'priceAsc') {
      filtered.sort((a,b) => a.price - b.price);
    } else if(sortValue === 'priceDesc') {
      filtered.sort((a,b) => b.price - a.price);
    } else if(sortValue === 'titleAsc') {
      filtered.sort((a,b) => a.title.localeCompare(b.title));
    } else if(sortValue === 'titleDesc') {
      filtered.sort((a,b) => b.title.localeCompare(a.title));
    }
  
    renderLots(filtered);
  }
  
  function renderLots(lotsToRender) {
    lotsList.innerHTML = '';
  
    if(lotsToRender.length === 0) {
      lotsList.textContent = 'Лоты не найдены';
      return;
    }
  
    lotsToRender.forEach(lot => {
      const highestBid = lot.bids.length ? Math.max(...lot.bids.map(b => b.amount)) : lot.price;
      const remainingMs = lot.endTime ? lot.endTime - Date.now() : null;
  
      const div = document.createElement('div');
      div.className = 'lot';
  
      div.innerHTML = `
        <img src="${lot.image || 'https://via.placeholder.com/100'}" alt="Фото лота" style="max-width:100px; display:block; margin-bottom:5px;" />
        <b>${lot.title}</b><br/>
        Категория: ${lot.category}<br/>
        Начальная цена: ${lot.price} сом<br/>
        Текущая ставка: ${highestBid} сом<br/>
        Статус: <span id="status${lot.id}">${lot.status}</span><br/>
        ${lot.status === 'active' && remainingMs > 0 ? `
        До окончания: <span id="timer${lot.id}" class="lot-timer">${Math.floor(remainingMs/60000)}м ${Math.floor((remainingMs/1000)%60)}с</span><br/>
          <input type="number" id="bidAmount${lot.id}" placeholder="Ваша ставка" min="${highestBid + 1}" style="max-width: 150px;"/>
          <button onclick="placeBid(${lot.id})">Сделать ставку</button><br/>
        ` : ''}
        <details>
          <summary>История ставок (${lot.bids.length})</summary>
          <ul>
            ${lot.bids.map(b => `<li>${b.user}: ${b.amount} сом (${new Date(b.time).toLocaleString()})</li>`).join('')}
          </ul>
        </details>
        ${currentUser.role === 'admin' ? `
          <button onclick="editLot(${lot.id})">Редактировать</button>
          <button onclick="deleteLot(${lot.id})">Удалить</button>
        ` : ''}
      `;
  
      lotsList.appendChild(div);
    });
  }
  
  function addLot(event) {
    event.preventDefault();
  
    const title = newLotTitle.value.trim();
    const category = newLotCategory.value.trim();
    const price = parseFloat(newLotPrice.value);
    const image = newLotImage.value.trim();
    const status = newLotStatus.value;
  
    if(!title || !category || isNaN(price)) {
      alert('Заполните все поля правильно');
      return;
    }
  
    if(editingLotId) {
      const lot = lots.find(l => l.id === editingLotId);
      if(lot) {
        lot.title = title;
        lot.category = category;
        lot.price = price;
        lot.image = image;
        lot.status = status;
        if(!lot.endTime && status === 'active') {
          lot.endTime = Date.now() + 1000 * 60 * 5;
        }
        if(status === 'sold') {
          lot.endTime = null;
        }
      }
      editingLotId = null;
      addLotSubmitBtn.textContent = 'Добавить лот';
    } else {
      lots.push({
        id: lots.length ? Math.max(...lots.map(l => l.id)) + 1 : 1,
        title,
        category,
        price,
        image,
        status,
        bids: [],
        endTime: status === 'active' ? Date.now() + 1000 * 60 * 5 : null
      });
    }
  
    addLotForm.reset();
    applyFilters();
  }
  
  function deleteLot(id) {
    if(confirm('Удалить этот лот?')) {
      lots = lots.filter(l => l.id !== id);
      applyFilters();
    }
  }
  
  function editLot(id) {
    const lot = lots.find(l => l.id === id);
    if(!lot) return alert('Лот не найден');
  
    newLotTitle.value = lot.title;
    newLotCategory.value = lot.category;
    newLotPrice.value = lot.price;
    newLotImage.value = lot.image || '';
    newLotStatus.value = lot.status;
  
    editingLotId = id;
    addLotSubmitBtn.textContent = 'Сохранить изменения';
  }
  
  function placeBid(lotId) {
    const input = document.getElementById(`bidAmount${lotId}`);
    if(!input) return alert('Поле для ставки не найдено!');
    const bidAmount = parseFloat(input.value);
    if(isNaN(bidAmount)) return alert('Введите корректную ставку');
  
    const lot = lots.find(l => l.id === lotId);
    if(!lot) return alert('Лот не найден');
    if(lot.status !== 'active') return alert('Аукцион закрыт');
  
    const highestBid = lot.bids.length ? Math.max(...lot.bids.map(b => b.amount)) : lot.price;
    if(bidAmount <= highestBid) {
      alert(`Ставка должна быть выше текущей (${highestBid} сом)`);
      return;
    }
  
    lot.bids.push({
      user: currentUser.username,
      amount: bidAmount,
      time: Date.now()
    });
  
    alert('Ставка принята');
    input.value = '';
  
    applyFilters(); // Обновить интерфейс со ставками и таймером
  }
  
  function clearFilters() {
    if(searchTitle) searchTitle.value = '';
    if(filterCategory) filterCategory.value = '';
    if(filterStatus) filterStatus.value = '';
    if(filterPriceMin) filterPriceMin.value = '';
    if(filterPriceMax) filterPriceMax.value = '';
    if(sortSelect) sortSelect.value = '';
    lotsList.innerHTML = '';
  }
  
  // Функция обновления таймеров для всех активных лотов
function updateTimers() {
    let needsRefresh = false;
  
    lots.forEach(lot => {
      if (lot.status === 'active' && lot.endTime) {
        const remainingMs = lot.endTime - Date.now();
        const timerSpan = document.getElementById(`timer${lot.id}`);
        const statusSpan = document.getElementById(`status${lot.id}`);
  
        if (remainingMs <= 0) {
          // Время вышло — меняем статус
          lot.status = 'sold';
          if (statusSpan) statusSpan.textContent = 'sold';
          if (timerSpan) timerSpan.textContent = 'Аукцион окончен';
          needsRefresh = true;
        } else {
          // Обновляем отображение времени
          if (timerSpan) {
            const minutes = Math.floor(remainingMs / 60000);
            const seconds = Math.floor((remainingMs / 1000) % 60);
            timerSpan.textContent = `${minutes}м ${seconds < 10 ? '0' : ''}${seconds}с`;
          }
        }
      }
    });
  
    if (needsRefresh) {
      // Если статус изменился, обновляем список лотов (чтобы убрать кнопки ставок и пр.)
      applyFilters();
    }
  }
  
  // Запускаем таймер каждую секунду, только если пользователь авторизован
  setInterval(() => {
    if (currentUser) {
      updateTimers();
    }
  }, 1000);
  
  // Важно: при рендере лотов должен быть элемент с id="timer{lot.id}", например:
  div.innerHTML = `
    ...
    До окончания: <span id="timer${lot.id}" class="lot-timer">--</span><br/>
    ...
  `;
  
  // И статус с id="status{lot.id}"
  
  
  // ✅ ВАЖНО: добавь этот вызов после загрузки страницы или лотов
  setInterval(updateTimers, 1000);
  
  
  // При загрузке страницы восстанавливаем сессию
  window.onload = () => {
    const savedUser = localStorage.getItem('auctionUser');
    if(savedUser) {
      currentUser = JSON.parse(savedUser);
      showMainPage();
    }
  };
  
  // Обновление таймеров каждую секунду
  setInterval(() => {
    if(currentUser) {
      updateTimers();
    }
  }, 1000);
  