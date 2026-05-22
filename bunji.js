(function () {

  // ─── CONFIG ───────────────────────────────────────────────────────────────
  const LOCAL_API = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/api/chat/message'
    : 'https://kjr-backend.onrender.com/api/chat/message';

  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  let isInit = false;
  let showingCategories = false;

  // ─── PRODUCT DATA ─────────────────────────────────────────────────────────
  // Add img: 'assets/images/products/filename.jpg' for each product
  const CATEGORY_PRODUCTS = {
    "Accumulators & Receivers": [
      { name: "Rheem VPA-589-6SRD Accumulator", part: "VPA-589-6SRD", price: "$109.95", was: "$120.95", img: "assets/images/products/vpa-589-6srd.jpg" },
      { name: "Rheem VPA-5811-7SRD Accumulator", part: "VPA-5811-7SRD", price: "$120.95", was: "$133.05", img: "assets/images/products/vpa-5811-7srd.jpg" },
      { name: "Rheem VA-35-6S Accumulator", part: "VA-35-6S", price: "$179.95", was: "$197.95", img: "assets/images/products/va-35-6s.jpg" },
      { name: "Rheem VA-35-5S Accumulator", part: "VA-35-5S", price: "$96.95", was: "$108.58", img: "assets/images/products/va-35-5s.jpg" },
      { name: "Rheem VA-31-5S Accumulator", part: "VA-31-5S", price: "$97.95", was: "$109.70", img: "assets/images/products/va-31-5s.jpg" },
    ],
  };

  const PRODUCT_CATEGORIES = [
    "Accumulators & Receivers", "Adhesives", "Air Cleaners", "Air Filters",
    "Airflow Accessories", "Blower Components", "Brazing & Soldering Supplies",
    "Brazing & Soldering Tools", "Capacitors", "Caulking & Sealants",
    "Cleaners & Chemicals", "Coils", "Compressor Parts", "Compressors",
    "Condensate Drain Supplies", "Condensate Pumps", "Condenser Fan Motors",
    "Connected Home", "Construction Supplies", "Diffusers", "Double Shaft Motors",
    "Draft Inducer Motors", "Ducting & Sheet Metal", "Electrical",
    "Electrical Controls", "Evaporator and Blower Motors", "Exhaust & Supply Fans",
    "Fan Blades", "Fasteners", "Filter - Driers", "Fittings", "Gas Heat Controls",
    "Grilles", "Hand Tools", "Heat & Energy Recovery Ventilation",
    "Heat Pump Controls", "Inspection Tools", "Line Sets",
    "Miscellaneous Components", "Moisture Control & Zoning", "Motor Accessories",
    "Mounting Supplies", "Non-HVAC Items", "Oil Heat Controls",
    "Other Miscellaneous Installation Supplies", "Other Specialty Tools", "Pipe",
    "Power Tools", "Registers", "Refrigerant", "Residential Air Handlers",
    "Residential Coils", "Residential Equipment", "Residential Equipment Accessories",
    "Residential Mini Split Accessories", "Safety", "Service Tools",
    "Super Accessories", "Tape", "Test Tools",
    "Thermostat Guards & Thermostat Accessories", "Thermostats", "Tool Storage",
    "Ultraviolet", "Unit Heaters", "Valves", "Ventilators & Accessories",
    "Water Heaters"
  ];

  // Grey placeholder when no image available
  const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f0f0f0' rx='6'/%3E%3Ctext x='40' y='44' font-family='Arial' font-size='10' fill='%23bbb' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E`;

  function getDefaultProducts(cat) {
    return [
      { name: `${cat} - Item A`, part: "GEN-001", price: "$19.99", was: null, img: null },
      { name: `${cat} - Item B`, part: "GEN-002", price: "$34.50", was: null, img: null },
      { name: `${cat} - Item C`, part: "GEN-003", price: "$27.00", was: null, img: null },
      { name: `${cat} - Item D`, part: "GEN-004", price: "$45.99", was: null, img: null },
      { name: `${cat} - Item E`, part: "GEN-005", price: "$12.75", was: null, img: null },
    ];
  }

  // ─── STYLES ───────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.innerHTML = `
    #bunji-widget {
      position: fixed; bottom: 20px; right: 20px; z-index: 10000;
      font-family: 'Inter', Arial, sans-serif;
    }
    #bunji-toggle {
      width: 60px; height: 60px; border-radius: 50%;
      background: var(--primary, #cc0000); color: white;
      border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      cursor: pointer; font-size: 24px;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.3s ease;
    }
    #bunji-toggle:hover { transform: scale(1.1); }

    #bunji-chat-window {
      position: absolute; bottom: 80px; right: 0;
      width: 370px; height: 560px;
      background: #ffffff; border-radius: 12px;
      box-shadow: 0 5px 25px rgba(0,0,0,0.2);
      display: none; flex-direction: column; overflow: hidden;
      border: 1px solid #e0e0e0;
    }
    #bunji-chat-window.open { display: flex; }

    .bunji-header {
      background: var(--primary, #cc0000); color: white;
      padding: 15px; display: flex;
      justify-content: space-between; align-items: center;
      font-size: 16px; font-weight: 700; flex-shrink: 0;
    }
    .bunji-header-close {
      background: transparent; border: none;
      color: white; font-size: 20px; cursor: pointer;
    }

    .bunji-messages {
      flex: 1; padding: 12px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 10px;
      background: #f8fafc;
    }

    .bunji-bubble {
      max-width: 88%; padding: 10px 14px; border-radius: 8px;
      font-size: 13.5px; line-height: 1.45; white-space: pre-wrap;
      word-break: break-word;
    }
    .bunji-bubble.bunji {
      background: #e2e8f0; color: #1e293b;
      align-self: flex-start; border-bottom-left-radius: 0;
    }
    .bunji-bubble.user {
      background: var(--primary, #cc0000); color: white;
      align-self: flex-end; border-bottom-right-radius: 0;
    }

    /* ── Category grid ── */
    .bunji-cat-wrapper {
      align-self: flex-start; width: 100%;
      background: #e2e8f0; border-radius: 8px;
      border-bottom-left-radius: 0; padding: 12px;
      box-sizing: border-box;
    }
    .bunji-cat-title {
      font-weight: 700; color: #cc0000;
      font-size: 13px; margin-bottom: 8px;
    }
    .bunji-cat-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 5px;
    }
    .bunji-cat-btn {
      background: #fff; border: 1.5px solid #cc0000; color: #cc0000;
      border-radius: 6px; padding: 6px 7px; font-size: 11px;
      cursor: pointer; text-align: left; font-weight: 600;
      transition: background 0.15s, color 0.15s; line-height: 1.3;
    }
    .bunji-cat-btn:hover { background: #cc0000; color: #fff; }

    /* ── Product cards ── */
    .bunji-prod-wrapper {
      align-self: flex-start; width: 100%;
      background: #e2e8f0; border-radius: 8px;
      border-bottom-left-radius: 0; padding: 12px;
      box-sizing: border-box;
    }
    .bunji-prod-title {
      font-weight: 700; color: #cc0000;
      font-size: 13px; margin-bottom: 3px;
    }
    .bunji-prod-sub {
      font-size: 11px; color: #64748b; margin-bottom: 10px;
    }
    .bunji-prod-list { display: flex; flex-direction: column; gap: 8px; }

    .bunji-prod-card {
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 8px; padding: 9px;
      display: flex; gap: 9px; align-items: flex-start;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .bunji-prod-img {
      width: 68px; height: 68px; border-radius: 6px;
      object-fit: contain; background: #f5f5f5;
      border: 1px solid #eee; flex-shrink: 0;
    }
    .bunji-prod-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .bunji-prod-name { font-weight: 700; font-size: 12px; color: #1e293b; line-height: 1.3; }
    .bunji-prod-part { font-size: 10.5px; color: #94a3b8; }
    .bunji-prod-pricing { display: flex; align-items: baseline; gap: 5px; margin-top: 2px; }
    .bunji-prod-price { font-weight: 700; color: #cc0000; font-size: 14px; }
    .bunji-prod-was { font-size: 10.5px; color: #bbb; text-decoration: line-through; }
    .bunji-buy-btn {
      margin-top: 5px; align-self: flex-start;
      background: #cc0000; color: #fff; border: none;
      border-radius: 6px; padding: 5px 14px;
      font-size: 11.5px; font-weight: 700; cursor: pointer;
      transition: background 0.15s;
    }
    .bunji-buy-btn:hover { background: #a00000; }
    .bunji-buy-btn.added { background: #15803d; cursor: default; }

    /* ── Typing ── */
    .bunji-typing-indicator {
      font-size: 12px; color: #94a3b8;
      padding: 0 15px 10px; display: none; flex-shrink: 0;
    }

    /* ── Input ── */
    .bunji-input-area {
      display: flex; border-top: 1px solid #e0e0e0;
      padding: 10px; background: white; flex-shrink: 0;
    }
    #bunji-input {
      flex: 1; border: 1px solid #cbd5e1; border-radius: 20px;
      padding: 10px 15px; outline: none; font-size: 14px;
    }
    #bunji-input:focus { border-color: #cc0000; }
    #bunji-send {
      background: var(--primary, #cc0000); color: white;
      border: none; border-radius: 20px;
      padding: 0 15px; margin-left: 10px;
      cursor: pointer; font-weight: 600; font-size: 14px;
    }

    @media (max-width: 420px) {
      #bunji-chat-window { width: calc(100vw - 24px); right: -8px; }
    }
  `;
  document.head.appendChild(style);

  // ─── HTML ─────────────────────────────────────────────────────────────────
  const widget = document.createElement('div');
  widget.id = 'bunji-widget';
  widget.innerHTML = `
    <button id="bunji-toggle">💬</button>
    <div id="bunji-chat-window">
      <div class="bunji-header">
        <span>🤖 Bunji — Virtual Advisor</span>
        <button class="bunji-header-close" id="bunji-close">×</button>
      </div>
      <div class="bunji-messages" id="bunji-messages"></div>
      <div class="bunji-typing-indicator" id="bunji-typing">Bunji is typing...</div>
      <div class="bunji-input-area">
        <input type="text" id="bunji-input" placeholder="Type a message..." autocomplete="off" />
        <button id="bunji-send">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // ─── REFS ─────────────────────────────────────────────────────────────────
  const toggleBtn = document.getElementById('bunji-toggle');
  const chatWindow = document.getElementById('bunji-chat-window');
  const closeBtn = document.getElementById('bunji-close');
  const messagesEl = document.getElementById('bunji-messages');
  const inputEl = document.getElementById('bunji-input');
  const sendBtn = document.getElementById('bunji-send');
  const typingEl = document.getElementById('bunji-typing');

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  function scrollBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

  function addBubble(text, role) {
    const div = document.createElement('div');
    div.className = 'bunji-bubble ' + role;
    div.textContent = text;
    messagesEl.appendChild(div);
    scrollBottom();
  }

  function showTyping() { typingEl.style.display = 'block'; scrollBottom(); }
  function hideTyping() { typingEl.style.display = 'none'; }

  // ─── CATEGORY GRID ────────────────────────────────────────────────────────
  function renderCategoryGrid() {
    showingCategories = true;

    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-cat-wrapper';

    const title = document.createElement('div');
    title.className = 'bunji-cat-title';
    title.textContent = '📦 HVAC Parts & Accessories — Select a Category:';
    wrapper.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'bunji-cat-grid';

    PRODUCT_CATEGORIES.forEach((cat, i) => {
      const btn = document.createElement('button');
      btn.className = 'bunji-cat-btn';
      btn.textContent = `${i + 1}. ${cat}`;
      btn.addEventListener('click', () => {
        showingCategories = false;
        addBubble(`Selected: ${cat}`, 'user');
        renderProductCards(cat);
      });
      grid.appendChild(btn);
    });

    wrapper.appendChild(grid);
    messagesEl.appendChild(wrapper);
    scrollBottom();
  }

  // ─── PRODUCT CARDS ────────────────────────────────────────────────────────
  function renderProductCards(categoryName) {
    const products = CATEGORY_PRODUCTS[categoryName] || getDefaultProducts(categoryName);

    const wrapper = document.createElement('div');
    wrapper.className = 'bunji-prod-wrapper';

    const title = document.createElement('div');
    title.className = 'bunji-prod-title';
    title.textContent = `🛍️ ${categoryName}`;
    wrapper.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'bunji-prod-sub';
    sub.textContent = '100% genuine parts · Fast shipping · 350+ brands';
    wrapper.appendChild(sub);

    const list = document.createElement('div');
    list.className = 'bunji-prod-list';

    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'bunji-prod-card';

      // Image
      const img = document.createElement('img');
      img.className = 'bunji-prod-img';
      img.alt = product.name;
      img.src = product.img || PLACEHOLDER;
      img.onerror = () => { img.src = PLACEHOLDER; };
      card.appendChild(img);

      // Body
      const body = document.createElement('div');
      body.className = 'bunji-prod-body';

      const name = document.createElement('div');
      name.className = 'bunji-prod-name';
      name.textContent = product.name;

      const part = document.createElement('div');
      part.className = 'bunji-prod-part';
      part.textContent = `Part #: ${product.part}`;

      const pricing = document.createElement('div');
      pricing.className = 'bunji-prod-pricing';

      const price = document.createElement('span');
      price.className = 'bunji-prod-price';
      price.textContent = product.price;
      pricing.appendChild(price);

      if (product.was) {
        const was = document.createElement('span');
        was.className = 'bunji-prod-was';
        was.textContent = `was ${product.was}`;
        pricing.appendChild(was);
      }

      const buyBtn = document.createElement('button');
      buyBtn.className = 'bunji-buy-btn';
      buyBtn.textContent = '🛒 BUY';
      buyBtn.addEventListener('click', () => {
        if (buyBtn.classList.contains('added')) return;
        buyBtn.classList.add('added');
        buyBtn.textContent = '✓ Added';
        addBubble(`I want to buy: ${product.name} (Part #${product.part}) — ${product.price}`, 'user');
        sendToBot(`I want to buy ${product.name}, Part number ${product.part}, price ${product.price} from the ${categoryName} category. Please guide me on how to complete this purchase.`);
      });

      body.appendChild(name);
      body.appendChild(part);
      body.appendChild(pricing);
      body.appendChild(buyBtn);
      card.appendChild(body);
      list.appendChild(card);
    });

    wrapper.appendChild(list);
    messagesEl.appendChild(wrapper);
    scrollBottom();
  }

  // ─── BOT COMMUNICATION ────────────────────────────────────────────────────
  async function sendToBot(text) {
    showTyping();
    try {
      const resp = await fetch(LOCAL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text })
      });
      const data = await resp.json();
      hideTyping();

      if (resp.ok && data.reply) {
        addBubble(data.reply, 'bunji');
      } else {
        addBubble('❌ Sorry, I am having trouble connecting right now.', 'bunji');
      }
    } catch (e) {
      hideTyping();
      addBubble('❌ Error connecting to server.', 'bunji');
    }
  }

  // ─── HANDLE USER INPUT ────────────────────────────────────────────────────
  function handleInput(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    inputEl.value = '';

    // ── Press 5: show category grid, do NOT call bot ──
    if (trimmed === '5') {
      addBubble('5', 'user');
      addBubble(
        'Welcome to KJ Appliance Parts! 🛒\n' +
        'KJRID is your Appliance Parts Dealer — A Partner with Encompass.\n\n' +
        'Please log into www.encompass.com or create an account first.\n\n' +
        'Select a product category below:',
        'bunji'
      );
      renderCategoryGrid();
      return; // ← no bot call
    }

    // ── Typing a number 1–68 while grid is visible ──
    const num = parseInt(trimmed);
    if (!isNaN(num) && num >= 1 && num <= 68 && showingCategories) {
      showingCategories = false;
      addBubble(`Selected: ${PRODUCT_CATEGORIES[num - 1]}`, 'user');
      renderProductCards(PRODUCT_CATEGORIES[num - 1]);
      return;
    }

    // ── Everything else goes to bot ──
    addBubble(trimmed, 'user');
    sendToBot(trimmed);
  }

  // ─── EVENTS ───────────────────────────────────────────────────────────────
  toggleBtn.addEventListener('click', () => {
    chatWindow.classList.add('open');
    toggleBtn.style.display = 'none';
    if (!isInit) {
      isInit = true;
      sendToBot('hello');
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('open');
    toggleBtn.style.display = 'flex';
  });

  sendBtn.addEventListener('click', () => handleInput(inputEl.value));
  inputEl.addEventListener('keypress', e => { if (e.key === 'Enter') handleInput(inputEl.value); });

  // Allow external triggers (e.g. from other page buttons)
  window.addEventListener('open-bunji', (e) => {
    chatWindow.classList.add('open');
    toggleBtn.style.display = 'none';
    if (!isInit) {
      isInit = true;
      sendToBot('hello').then(() => {
        if (e.detail && e.detail.message) handleInput(e.detail.message);
      });
    } else {
      if (e.detail && e.detail.message) handleInput(e.detail.message);
    }
  });

})();
