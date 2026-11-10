// Thẻ tri ân của đại lễ: dữ liệu người xem chỉ đi qua thuộc tính DOM.
// Đồng hồ theo frame của cảnh để tạm dừng/reset không để lại timer hay thẻ cũ.
(function () {
  const K = window.Kit;
  const DURATION = 5000, FADE = 420, MAX_WAITING = 5;
  const waiting = [];
  let card = null, current = null, startedAt = 0;

  const STYLE = `
    .cx-tribute { position:absolute; box-sizing:border-box; left:116px; right:116px; top:1180px; height:136px;
      display:grid; grid-template-columns:80px minmax(0,1fr); gap:24px; align-items:center; padding:18px 28px;
      pointer-events:none; color:#fff2ce; font-family:'Be Vietnam Pro',system-ui,sans-serif;
      border:2px solid #e8c06a; border-radius:12px;
      background:linear-gradient(115deg,rgba(76,13,7,.97),rgba(120,33,17,.94) 52%,rgba(59,12,7,.96));
      box-shadow:inset 0 0 0 4px rgba(72,17,8,.8),inset 0 0 0 5px rgba(232,192,106,.35),0 0 24px rgba(245,187,70,.23),0 8px 18px rgba(0,0,0,.32);
      opacity:0; visibility:hidden; transform:translateY(12px); transition:opacity .42s ease,transform .42s ease,visibility .42s;
    }
    .cx-tribute.show { opacity:1; visibility:visible; transform:none; }
    .cx-tribute::before,.cx-tribute::after { content:''; position:absolute; width:12px; height:12px; border-color:#f5d794; border-style:solid; opacity:.9; }
    .cx-tribute::before { left:9px; top:9px; border-width:1px 0 0 1px; border-radius:3px 0 0; }
    .cx-tribute::after { right:9px; bottom:9px; border-width:0 1px 1px 0; border-radius:0 0 3px; }
    .cx-tribute-avatar { position:relative; width:80px; height:80px; box-sizing:border-box; border:3px solid #f1cd78; border-radius:50%; overflow:hidden;
      display:grid; place-items:center; background:radial-gradient(circle at 35% 25%,#a65b28,#4a190e); color:#fff0bf; font-size:29px; font-weight:800;
      box-shadow:0 0 0 4px rgba(239,191,86,.1),0 0 18px rgba(255,213,120,.24); }
    .cx-tribute-avatar img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0; }
    .cx-tribute-avatar.loaded img { opacity:1; }
    .cx-tribute-copy { min-width:0; }
    .cx-tribute-label { display:flex; align-items:center; gap:16px; white-space:nowrap; }
    .cx-tribute-title { color:#f5d286; font:800 22px/1.3 'Playfair Display',serif; letter-spacing:3px; }
    .cx-tribute-message { color:#f4dfb2; font:italic 600 24px/1.3 'Lora',serif; }
    .cx-tribute-name { display:block; margin-top:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font:800 40px/1.25 'Be Vietnam Pro',system-ui,sans-serif; color:#fff5d9; text-shadow:0 2px 4px rgba(0,0,0,.5); }
    .grand-tribute-active .cx-toast,.grand-tribute-active .cx-so { visibility:hidden; }
    @media (prefers-reduced-motion:reduce) { .cx-tribute { transform:none; transition:opacity .2s,visibility .2s; } }
  `;

  function mount() {
    if (card?.isConnected) return true;
    const stage = document.getElementById('stage');
    if (!stage) return false;
    if (!document.getElementById('cx-tribute-style')) {
      const style = document.createElement('style');
      style.id = 'cx-tribute-style'; style.textContent = STYLE;
      document.head.appendChild(style);
    }
    card = document.createElement('div');
    card.className = 'cx-tribute';
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');
    card.setAttribute('aria-hidden', 'true');
    // Chuỗi cố định; tên và avatar được gán riêng ở show().
    card.innerHTML = '<div class="cx-tribute-avatar" role="img"><span class="cx-tribute-initials" aria-hidden="true"></span></div><div class="cx-tribute-copy"><div class="cx-tribute-label"><span class="cx-tribute-title">TRI ÂN</span><span class="cx-tribute-message">Trân trọng tấm lòng của</span></div><strong class="cx-tribute-name"></strong></div>';
    stage.appendChild(card);
    return true;
  }

  function safeAvatar(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return '';
    try {
      const url = new URL(value);
      return !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }

  function show(entry, now) {
    current = entry;
    startedAt = now;
    const name = entry.name;
    const words = name.split(/\s+/);
    const avatar = card.querySelector('.cx-tribute-avatar');
    avatar.classList.remove('loaded');
    avatar.querySelector('img')?.remove();
    avatar.setAttribute('aria-label', `Ảnh đại diện của ${name}`);
    card.querySelector('.cx-tribute-initials').textContent = (words.length > 1
      ? Array.from(words[0])[0] + Array.from(words.at(-1))[0]
      : Array.from(name).slice(0, 2).join('')).toLocaleUpperCase('vi-VN');
    const label = card.querySelector('.cx-tribute-name');
    label.textContent = name; label.title = name;
    if (entry.avatar) {
      const image = document.createElement('img');
      image.alt = ''; image.decoding = 'async'; image.referrerPolicy = 'no-referrer';
      image.onload = () => { if (image.parentNode === avatar) avatar.classList.add('loaded'); };
      image.onerror = () => { if (image.parentNode === avatar) { avatar.classList.remove('loaded'); image.remove(); } };
      avatar.appendChild(image); image.src = entry.avatar;
    }
    card.setAttribute('aria-hidden', 'false');
    card.parentElement.classList.add('grand-tribute-active');
    card.classList.add('show');
  }

  function reset() {
    waiting.length = 0; current = null; startedAt = 0;
    if (!card) return;
    card.parentElement?.classList.remove('grand-tribute-active');
    card.classList.remove('show');
    card.setAttribute('aria-hidden', 'true');
    card.querySelector('.cx-tribute-avatar').classList.remove('loaded');
    card.querySelector('img')?.remove();
    card.querySelector('.cx-tribute-name').textContent = '';
    card.querySelector('.cx-tribute-initials').textContent = '';
  }

  K.on('start', mount);
  window.Live.on('ready', () => { mount(); reset(); });
  window.Live.on('reset', reset);
  K.on('grandOffering', ({ person, event } = {}) => {
    if (!mount()) return;
    const name = String(event?.user?.name || person?.name || '').trim() || 'Thí chủ';
    const entry = { name, avatar: safeAvatar(event?.user?.avatar) };
    if (!current) show(entry, performance.now());
    else {
      if (waiting.length >= MAX_WAITING) waiting.shift();
      waiting.push(entry);
    }
  });
  K.on('frame', (now) => {
    if (!card || !current) return;
    const age = now - startedAt;
    if (age >= DURATION - FADE) {
      card.classList.remove('show');
      card.setAttribute('aria-hidden', 'true');
    }
    if (age < DURATION) return;
    current = null;
    if (waiting.length) show(waiting.shift(), now);
    else card.parentElement?.classList.remove('grand-tribute-active');
  });
})();
