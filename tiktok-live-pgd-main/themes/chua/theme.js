// Chùa ảo: giao diện riêng (thay Kit.hud của kit), quẻ xăm, đèn nguyện, hào quang theo danh hiệu.
// Cảnh, hành động, luật nằm trong theme.json + scene.json; file này chỉ lo phần nhìn trên cùng.
//
// Bố cục theo vùng an toàn khi live TikTok (Kit.safe, mở overlay với ?safe để xem):
//   trên cùng 240px để trống cho tên kênh; các bảng hẹp, nằm ngay trong vùng an toàn hai bên (hud.edge) để giữa thoáng cho tượng Phật;
//   nửa trái phía dưới là khung bình luận nên khay lễ phẩm nằm cột phải; thẻ hiện lên chỉ chiếm dải giữa.
//
// Chữ và vị trí đổi trong theme.json "hud":
//   "plaque": { "text": "...", "sub": "..." }   biển tên chùa (góc trên trái; góc trên phải là số liệu)
//   "guide":  { "title": "..." }                thẻ hướng dẫn bên trái (tự sinh từ luật chat)
//   "board":  { "title": "...", "size": 3 }     liễn phải: bảng vàng
//   "tray":   { "title": "..." }                mục lễ phẩm cuối thẻ hướng dẫn (lấy từ actions có "card", tên hiện là "offering")
//   "giftCard": { "verb": "kính dâng", "unit": "công đức", "top": 1120 }
//   "drawTop": 1360, "periodicTop": 800, "toastTop": 1010   vị trí thẻ quẻ, thời kinh, dòng chúc mừng (liễn tự xếp dưới biển tên / ô số liệu; "sideTop" để cố định)

(function () {
  const K = window.Kit;
  const Z = K.safe || { top: 240, side: 100, chatTop: 1250 };
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
  const later = (ms) => new Promise((r) => setTimeout(r, ms));

  let theme = {}, cfg = {}, root = null;
  const lastWords = new Map();

  // Góc mây cuốn mạ vàng
  const CORNER = `<svg viewBox="0 0 40 40"><path d="M3 37V14C3 8 8 3 14 3h23" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M9 37V18c0-5 4-9 9-9h19" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"/><circle cx="17" cy="17" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M17 13c5 0 6 6 2 7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  const corners = () => ['tl', 'tr', 'bl', 'br'].map((c) => `<i class="cn ${c}">${CORNER}</i>`).join('');

  const STYLE = `
  .cx { position:absolute; inset:0; pointer-events:none; font-family:'Be Vietnam Pro', system-ui, sans-serif; color:#fbefd2; --gold:#e8c06a; --gold2:#fff1c1; --lac:#7d1610; --lac2:#4a0a06; --ink:#5b1209; }
  .cx .cn { position:absolute; width:24px; height:24px; color:var(--gold); }
  .cx .cn svg { width:100%; height:100%; display:block; }
  .cx .cn.tl { left:4px; top:4px } .cx .cn.tr { right:4px; top:4px; transform:scaleX(-1) } .cx .cn.bl { left:4px; bottom:4px; transform:scaleY(-1) } .cx .cn.br { right:4px; bottom:4px; transform:scale(-1,-1) }
  .lac { position:absolute; background:linear-gradient(160deg, #94241a 0%, var(--lac) 45%, var(--lac2) 100%); border:3px solid var(--gold); box-shadow: inset 0 0 0 4px var(--lac2), inset 0 0 0 6px rgba(232,192,106,.75), 0 8px 24px rgba(0,0,0,.45); }
  /* khối nhìn xuyên: thấy được người và cảnh phía sau */
  .glass { position:absolute; box-sizing:border-box; background:linear-gradient(170deg, rgba(122,24,16,.5), rgba(58,8,4,.34)); border:2px solid rgba(232,192,106,.8); box-shadow: inset 0 0 0 4px rgba(58,8,4,.3), inset 0 0 0 5px rgba(232,192,106,.3); text-shadow:0 2px 4px rgba(0,0,0,.9), 0 0 2px rgba(0,0,0,.9); }
  .gold-text { background:linear-gradient(180deg, var(--gold2) 10%, var(--gold) 55%, #b5832f 100%); -webkit-background-clip:text; background-clip:text; color:transparent; text-shadow:none; filter:drop-shadow(0 2px 2px rgba(0,0,0,.85)); }

  /* hoành phi */
  .cx-plaque { box-sizing:border-box; padding:12px 10px 11px; text-align:center; border-radius:6px; }
  .cx-plaque h1 { margin:0; font:900 32px/1.1 'Playfair Display', serif; letter-spacing:2px; white-space:nowrap; }
  .cx-plaque p { margin:5px 0 0; font:italic 600 20px/1.25 'Lora', serif; color:#f6dfae; }
  .cx-stats { padding:12px 16px 12px; border-radius:6px; display:grid; gap:4px; }
  .cx-stats > div:not(.cx-goal) { display:flex; align-items:baseline; gap:10px; font:italic 600 21px 'Lora', serif; color:#f6e2bb; white-space:nowrap; }
  .cx-stats b { min-width:64px; text-align:right; font:800 27px 'Playfair Display', serif; font-style:normal; color:var(--gold2); }

  /* liễn dọc hai bên */
  .cx-scroll { padding:34px 16px 28px; border-radius:4px; }
  .cx-scroll .rod { position:absolute; left:-10px; right:-10px; height:12px; border-radius:6px; background:linear-gradient(180deg, #6b3b1c, #2e160a); box-shadow:0 2px 6px rgba(0,0,0,.4); }
  .cx-scroll .rod::before, .cx-scroll .rod::after { content:''; position:absolute; top:-3px; width:14px; height:18px; border-radius:4px; background:linear-gradient(180deg, var(--gold2), #a8742a); }
  .cx-scroll .rod::before { left:-5px } .cx-scroll .rod::after { right:-5px }
  .cx-scroll .rod.t { top:-7px } .cx-scroll .rod.b { bottom:-7px }
  .cx-scroll h3 { margin:0 0 10px; text-align:center; font:800 26px 'Playfair Display', serif; letter-spacing:4px; }
  .cx-scroll h3::after { content:''; display:block; height:1px; margin:8px 10px 0; background:linear-gradient(90deg, transparent, var(--gold), transparent); }
  .cx-guide ul { list-style:none; margin:0; padding:0; display:grid; gap:9px; }
  .cx-guide li { display:flex; align-items:baseline; gap:8px; line-height:1.2; white-space:nowrap; }
  .cx-guide li .k { font:700 24px 'Lora', serif; color:var(--gold2); }
  .cx-guide li .d { font-size:20px; font-weight:600; color:#f6e2bb; overflow:hidden; text-overflow:ellipsis; }
  .cx-board ol { list-style:none; margin:0; padding:0; display:grid; gap:10px; }
  .cx-board li { display:grid; grid-template-columns:44px minmax(0,1fr); align-items:center; gap:10px; min-height:54px; }
  .cx-board li > div { min-width:0; }
  .cx-board .portrait { position:relative; width:44px; height:44px; }
  .cx-board .av { position:relative; display:grid; place-items:center; box-sizing:border-box; width:44px; height:44px; overflow:hidden; border:2px solid var(--gold); border-radius:50%; background:linear-gradient(145deg,#983b25,#42120b); color:var(--gold2); font:800 20px 'Be Vietnam Pro',system-ui,sans-serif; text-shadow:none; }
  .cx-board .av img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0; }
  .cx-board .av.loaded img { opacity:1; }
  .cx-board .rk { position:absolute; left:-5px; bottom:-5px; width:24px; height:24px; display:grid; place-items:center; border-radius:50%; font:900 20px/1 'Playfair Display', serif; color:var(--lac2); text-shadow:none; background:radial-gradient(circle at 35% 30%, #fff6d4, var(--gold) 55%, #9a6a22); box-shadow:0 0 0 2px var(--lac2), 0 0 0 3px var(--gold); }
  .cx-board li:nth-child(2) .rk { background:radial-gradient(circle at 35% 30%, #ffffff, #c9ccd4 55%, #7b808c); }
  .cx-board li:nth-child(3) .rk { background:radial-gradient(circle at 35% 30%, #ffe2c4, #c98a4b 55%, #7a4a1e); }
  .cx-board .nm { font-weight:700; font-size:24px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cx-board .cd { font:italic 600 20px 'Lora', serif; color:var(--gold2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cx-board li.empty { opacity:.55 }
  .cx-board li.empty .nm { font:italic 600 20px 'Lora', serif; }

  /* lễ phẩm: cuối thẻ hướng dẫn bên trái (gọn như cách chanh-dien chỉ dùng 2 thẻ hai bên) */
  .cx-tiers { margin-top:14px; padding-top:10px; border-top:1px solid rgba(232,192,106,.5); display:grid; gap:7px; }
  .cx-tiers h4 { margin:0 0 2px; text-align:center; font:800 22px 'Playfair Display', serif; letter-spacing:4px; color:var(--gold2); }
  .cx-item { display:grid; grid-template-columns:34px 1fr auto; align-items:center; gap:7px; }
  .cx-item .md { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; background:radial-gradient(circle, #6d1a10, #2d0805 72%); box-shadow:0 0 0 2px var(--gold); transition:box-shadow .4s; }
  .cx-item .md img { width:26px; height:26px; object-fit:contain; }
  .cx-item .md span { font-size:22px; }
  .cx-item .nm { font:700 20px 'Lora', serif; color:var(--gold2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .cx-item .pr { font-size:17px; font-weight:800; color:#fff; text-shadow:none; background:var(--lac); padding:1px 6px; border-radius:3px; box-shadow:0 0 0 1px var(--gold); white-space:nowrap; }
  .cx-item.hit { animation:cxHit 1s ease-out; }
  .cx-item.hit .md { box-shadow:0 0 0 2px var(--gold2), 0 0 24px 8px rgba(255,210,120,.85); }
  @keyframes cxHit { 0% { transform:scale(1.08) } 100% { transform:none } }

  /* nén nhang: thanh mục tiêu, cuối ô số liệu */
  .cx-goal { margin-top:6px; padding-top:10px; border-top:1px solid rgba(232,192,106,.45); text-align:center; }
  .cx-goal .lb { line-height:1.25; font:italic 600 20px 'Lora', serif; color:#f6dfae; text-shadow:0 2px 4px #000, 0 0 2px #000; margin-bottom:6px; }
  .cx-goal .lb b { font-style:normal; color:var(--gold2); }
  .cx-goal .stick { position:relative; height:8px; border-radius:3px; background:linear-gradient(180deg, #8a5a2e, #4d2c12); box-shadow:0 2px 6px rgba(0,0,0,.6); }
  .cx-goal .ash { position:absolute; left:0; top:0; bottom:0; width:0; border-radius:3px; background:linear-gradient(90deg, #d8cfc0, #f2ece2); transition:width .8s; }
  .cx-goal .ember { position:absolute; top:50%; width:16px; height:16px; margin:-8px 0 0 -8px; border-radius:50%; background:radial-gradient(circle, #fff3c0, #ff8a2a 45%, rgba(255,90,20,0) 72%); left:0; transition:left .8s; animation:cxEmber 1.6s ease-in-out infinite; }
  @keyframes cxEmber { 50% { transform:scale(1.35); opacity:.8 } }

  /* tờ sớ khi dâng lễ: một dải gọn */
  .cx-so { position:absolute; box-sizing:border-box; padding:12px 100px 12px 26px; color:var(--ink); background: repeating-linear-gradient(95deg, rgba(120,80,30,.05) 0 2px, transparent 2px 7px), linear-gradient(180deg, rgba(246,234,208,.95), rgba(230,210,166,.93)); border-left:8px solid var(--lac); box-shadow:0 10px 24px rgba(0,0,0,.45); clip-path:inset(0 50% 0 50%); opacity:0; transition:clip-path .55s cubic-bezier(.2,.8,.2,1), opacity .3s; }
  .cx-so.show { clip-path:inset(-60px -60px -60px -60px); opacity:1; }
  .cx-so .who { font:italic 800 42px/1.1 'Playfair Display', serif; color:var(--lac); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cx-so .what { font-size:27px; font-weight:600; margin-top:3px; }
  .cx-so .what b { color:var(--lac); }
  .cx-so .quote { font:italic 23px 'Lora', serif; margin-top:3px; opacity:.85; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cx-so .quote:empty { display:none }
  .cx-so .seal { position:absolute; right:18px; top:50%; width:68px; height:68px; margin-top:-34px; display:grid; place-items:center; border:3px double #b3140e; border-radius:6px; color:#b3140e; font:900 17px/1.05 'Playfair Display', serif; text-align:center; transform:rotate(-8deg); background:rgba(179,20,14,.06); }
  .cx-so.big { box-shadow:0 0 0 3px var(--gold), 0 0 50px rgba(255,200,90,.85); }
  .cx-so.big .seal { background:#b3140e; color:#fff3d0; }

  /* thời kinh */
  .cx-kinh { position:absolute; padding:26px 32px 22px; text-align:center; color:var(--ink); background:linear-gradient(180deg, rgba(246,234,208,.95), rgba(227,205,157,.93)); box-shadow:0 12px 28px rgba(0,0,0,.45); opacity:0; transform:scaleY(.2); transform-origin:top; transition:opacity .4s, transform .6s cubic-bezier(.2,.8,.2,1); }
  .cx-kinh.show { opacity:1; transform:none; }
  .cx-kinh .rod { position:absolute; left:-12px; right:-12px; height:14px; border-radius:7px; background:linear-gradient(180deg, #6b3b1c, #2e160a); }
  .cx-kinh .rod.t { top:-7px } .cx-kinh .rod.b { bottom:-7px }
  .cx-kinh h4 { margin:0 0 8px; font:800 24px 'Playfair Display', serif; letter-spacing:6px; color:var(--lac); }
  .cx-kinh p { margin:0; font:italic 28px/1.45 'Lora', serif; }

  /* quẻ xăm: tờ giấy dó khung sơn son, mở từ giữa ra như cuộn thư; ống xăm lắc ở cột trái */
  .cx-xam { position:absolute; height:370px; opacity:0; transition:opacity .4s; }
  .cx-xam.show { opacity:1; }
  .cx-xam .slip { position:absolute; inset:0; box-sizing:border-box; padding:22px 30px 18px 168px; color:var(--ink); border-radius:6px;
    background: radial-gradient(ellipse at 70% 30%, rgba(255,255,255,.45), transparent 55%), repeating-linear-gradient(92deg, rgba(120,80,30,.045) 0 2px, transparent 2px 6px), linear-gradient(180deg, #f8eed6, #ecd9ae);
    border:6px solid var(--lac); box-shadow: 0 0 0 2px var(--gold), inset 0 0 0 7px #f8eed6, inset 0 0 0 8px rgba(184,134,47,.9), inset 0 0 0 11px #f8eed6, inset 0 0 0 12px rgba(125,22,16,.55), 0 16px 36px rgba(0,0,0,.55);
    clip-path:inset(0 50% 0 50%); transition:clip-path .75s cubic-bezier(.2,.8,.2,1); }
  .cx-xam.open .slip { clip-path:inset(-60px -60px -60px -60px); }
  .cx-xam .slip::before { content:''; position:absolute; left:150px; top:22px; bottom:22px; width:1px; background:linear-gradient(180deg, transparent, rgba(184,134,47,.8), transparent); }
  .cx-xam .hd { display:flex; align-items:center; justify-content:center; gap:14px; min-width:0; padding-right:106px; }
  .cx-xam .hd::before, .cx-xam .hd::after { content:''; flex:1; max-width:90px; height:1px; background:linear-gradient(90deg, transparent, rgba(125,22,16,.6)); }
  .cx-xam .hd::after { transform:scaleX(-1); }
  .cx-xam .heading { min-width:0; max-width:100%; text-align:center; }
  .cx-xam .so { display:block; font:900 36px/1.15 'Playfair Display', serif; color:var(--lac); letter-spacing:2px; white-space:nowrap; }
  .cx-xam .requester { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font:700 24px/1.3 'Be Vietnam Pro', system-ui, sans-serif; color:var(--lac); }
  .cx-xam .tho { margin:14px 0 10px; text-align:center; font:italic 600 28px/1.4 'Lora', serif; color:#4a0f08; }
  .cx-xam .rule { display:flex; align-items:center; justify-content:center; gap:10px; margin:0 40px 10px; color:var(--gold); font-size:15px; }
  .cx-xam .rule::before, .cx-xam .rule::after { content:''; flex:1; height:1px; background:rgba(184,134,47,.7); }
  .cx-xam .loi { text-align:center; font-size:24px; line-height:1.4; color:#3d2a1c; }
  .cx-xam .loi b { color:var(--lac); }
  .cx-xam .ft { position:absolute; left:168px; right:30px; bottom:16px; display:flex; justify-content:space-between; gap:12px; font:italic 19px 'Lora', serif; color:#6b4a2e; }
  .cx-xam .ft .nm { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cx-xam .ft .dt { flex-shrink:0; }
  .cx-xam .loai { position:absolute; right:22px; top:22px; padding:5px 9px; font:900 18px/1.15 'Playfair Display', serif; letter-spacing:1px; text-align:center; color:var(--tone, #b3140e); border:3px double var(--tone, #b3140e); border-radius:4px; transform:rotate(8deg); background:rgba(255,255,255,.25); white-space:nowrap; text-transform:uppercase; opacity:0; transition:opacity .3s .6s, transform .3s .6s; }
  .cx-xam.open .loai { opacity:.92; transform:rotate(-8deg); }
  .cx-xam .ong { position:absolute; left:16px; bottom:28px; width:120px; height:200px; z-index:2; }
  .cx-xam .cup { position:absolute; left:12px; right:12px; bottom:0; height:130px; border-radius:8px 8px 18px 18px; background:linear-gradient(90deg, #5a1a0c, #a8402a 35%, #c5603e 50%, #8a2e1c 70%, #4a1208); box-shadow:0 8px 16px rgba(0,0,0,.45); }
  .cx-xam .cup::before, .cx-xam .cup::after { content:''; position:absolute; left:0; right:0; height:8px; background:linear-gradient(90deg, #8a6020, var(--gold2), #8a6020); }
  .cx-xam .cup::before { top:14px } .cx-xam .cup::after { bottom:18px }
  .cx-xam .sticks { position:absolute; left:22px; right:22px; bottom:115px; height:70px; }
  .cx-xam .sticks i { position:absolute; bottom:0; width:8px; border-radius:3px 3px 0 0; background:linear-gradient(90deg, #c9a46a, #f1dcae, #b08850); }
  .cx-xam .sticks i::before { content:''; position:absolute; top:0; left:0; right:0; height:10px; background:#b3140e; border-radius:3px 3px 0 0; }
  .cx-xam .ong.shake { animation:cxShake .16s linear infinite; transform-origin:50% 100%; }
  @keyframes cxShake { 0% { transform:rotate(-7deg) } 50% { transform:rotate(7deg) translateY(-3px) } 100% { transform:rotate(-7deg) } }
  .cx-xam .one { position:absolute; left:68px; bottom:143px; width:16px; height:120px; z-index:3; border-radius:4px 4px 0 0; background:linear-gradient(90deg, #c9a46a, #f6e4bb, #b08850); opacity:0; transform:translateY(50px); transition:transform .7s cubic-bezier(.2,1.4,.4,1), opacity .2s; display:flex; justify-content:center; box-shadow:0 0 12px rgba(255,220,140,.8); }
  .cx-xam .one::before { content:''; position:absolute; top:0; left:0; right:0; height:15px; background:#b3140e; border-radius:4px 4px 0 0; }
  .cx-xam .one span { margin-top:22px; font:900 14px/1 'Playfair Display', serif; color:var(--ink); writing-mode:vertical-rl; }
  .cx-xam.up .one { opacity:1; transform:translateY(-60px); }

  /* đèn nguyện */
  .cx-den { position:absolute; width:240px; margin-left:-120px; text-align:center; animation:cxRise 8s ease-in forwards; }
  .cx-den .lamp { position:relative; width:70px; height:56px; margin:0 auto; }
  .cx-den .lamp img { width:70px; height:56px; object-fit:contain; filter:drop-shadow(0 0 14px rgba(255,190,90,.95)); }
  .cx-den .lamp::before { content:''; position:absolute; left:50%; top:-13px; width:12px; height:22px; margin-left:-6px; border-radius:50% 50% 45% 45%; background:radial-gradient(circle at 50% 70%, #fff7c8, #ffb23e 55%, rgba(255,120,30,0) 75%); animation:cxFlame .5s ease-in-out infinite alternate; }
  .cx-den .wish { display:inline-block; max-width:260px; margin-top:4px; padding:2px 10px; font:italic 600 25px 'Lora', serif; color:#fff3d0; text-shadow:0 0 10px rgba(255,170,60,.9), 0 2px 3px #000; }
  .cx-den .by { font-size:22px; color:#f6dfae; opacity:.85; text-shadow:0 2px 3px #000; }
  @keyframes cxFlame { to { transform:scaleY(1.2) translateY(-2px) } }
  @keyframes cxRise { 0% { opacity:0; transform:translateY(0) } 10% { opacity:1 } 50% { transform:translate(18px, var(--mid)) } 85% { opacity:1 } 100% { opacity:0; transform:translate(-10px, var(--rise)) } }

  .cx-toast { position:absolute; text-align:center; font:italic 800 38px 'Playfair Display', serif; color:#fff1c9; text-shadow:0 0 16px rgba(255,180,60,.9), 0 2px 4px #000; opacity:0; transition:opacity .4s; }
  .cx-toast::before, .cx-toast::after { content:'❀'; margin:0 14px; font-size:22px; color:var(--gold); vertical-align:middle; }
  .cx-toast.show { opacity:1; }
  .cx-unmute { position:absolute; left:50%; top:900px; transform:translateX(-50%); padding:14px 40px; font:700 24px 'Lora', serif; color:var(--gold2); border-radius:6px; pointer-events:auto; cursor:pointer; display:none; white-space:nowrap; }
  `;

  const TONES = { 'thượng cát': '#b3140e', 'trung cát': '#a8741a', 'tiểu cát': '#2f7a5a', 'bình an': '#55657f' };

  // ---------- Dựng ----------
  function init(o) {
    theme = o.theme; cfg = theme.hud || {};
    root = document.createElement('div');
    root.className = 'cx';
    o.stage.appendChild(root);
    const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);
    const L = cfg.edge ?? Z.side - 4, colW = 236;       // lề trong vùng an toàn (máy màn dài cắt mỗi bên ~100px), bề rộng các bảng
    const mid = `left:${L + 10}px;right:${L + 10}px`; // dải giữa cho thẻ hiện lên
    const top = cfg.safeTop ?? Z.top + 4, side = cfg.sideTop ?? 400;
    const plaque = cfg.plaque || cfg.title || {};
    const unit = esc(cfg.giftCard?.unit || 'công đức');
    root.insertAdjacentHTML('beforeend', `
      <div class="lac cx-plaque" style="left:${L}px;top:${top}px;width:${colW}px">${corners()}<h1 class="gold-text">${esc(plaque.text || theme.name)}</h1>${plaque.sub ? `<p>${esc(plaque.sub)}</p>` : ''}</div>
      <div class="glass cx-stats" style="right:${L}px;top:${top}px;width:${colW}px"><div><b data-c="people">0</b>Phật tử</div><div><b data-c="likes">0</b>tim</div><div><b data-c="coins">0</b>${unit}</div></div>
      <div class="glass cx-scroll cx-guide" style="left:${L}px;top:${side}px;width:${colW}px"><i class="rod t"></i><i class="rod b"></i><h3 class="gold-text">${esc(cfg.guide?.title || 'LỐI VÀO')}</h3><ul></ul></div>
      <div class="glass cx-scroll cx-board" style="right:${L}px;top:${side}px;width:${colW}px"><i class="rod t"></i><i class="rod b"></i><h3 class="gold-text">${esc(cfg.board?.title || 'BẢNG VÀNG')}</h3><ol></ol></div>
      <div class="cx-toast" style="${mid};top:${cfg.toastTop ?? 1010}px"></div>
      <div class="cx-so" style="${mid};top:${cfg.giftCard?.top ?? 1120}px"><div class="who"></div><div class="what"></div><div class="quote"></div><div class="seal">PHÚC<br>LÀNH</div></div>
      <div class="cx-kinh" style="left:${L + 50}px;right:${L + 50}px;top:${cfg.periodicTop ?? 790}px"><i class="rod t"></i><i class="rod b"></i><h4></h4><p></p></div>
      <div class="cx-xam" style="left:${L + 46}px;right:${L + 46}px;top:${cfg.drawTop ?? 1360}px"><div class="slip"><div class="hd"><div class="heading"><span class="so"></span><span class="requester"></span></div></div><div class="tho"></div><div class="rule">❀</div><div class="loi"></div><div class="ft"><span class="nm"></span><span class="dt"></span></div><div class="loai"></div></div><div class="ong"><div class="sticks">${[0, 12, 24, 36, 48, 60].map((x, i) => `<i style="left:${x}px;height:${50 + (i % 3) * 8}px"></i>`).join('')}</div><div class="cup"></div></div><div class="one"><span></span></div></div>
    `);
    const tiers = (theme.actions || []).filter((a) => a.card).slice(0, 5);
    if (tiers.length) {
      $('.cx-guide', root).insertAdjacentHTML('beforeend', `<div class="cx-tiers"><h4>${esc(cfg.tray?.title || 'LỄ PHẨM')}</h4>${tiers.map((a) => `
        <div class="cx-item" data-action="${esc(a.id)}"><div class="md">${/\.(png|webp|gif|jpe?g|svg)$/i.test(a.icon || '') ? `<img src="${esc(a.icon)}">` : `<span>${esc(a.icon || '✨')}</span>`}</div><div class="nm">${esc(a.offering || a.label)}</div><span class="pr">${esc(a.card)}</span></div>`).join('')}</div>`);
    }
    if ((theme.goals || []).length) $('.cx-stats', root).insertAdjacentHTML('beforeend', `<div class="cx-goal"><div class="lb"></div><div class="stick"><div class="ash"></div><div class="ember"></div></div></div>`);
    root.insertAdjacentHTML('beforeend', `<div class="lac cx-unmute">${corners()}Chạm để nghe chuông mõ</div>`);
    const un = $('.cx-unmute', root);
    un.onclick = () => { Live.audio()?.resume(); un.style.display = 'none'; K.audio.init(); };
    setTimeout(() => { const a = Live.audio(); if (a && a.state === 'suspended') un.style.display = 'block'; }, 1500);
    layoutSides();
    document.fonts?.ready.then(layoutSides);
  }

  // Thẻ hướng dẫn xếp ngay dưới biển tên (trái), bảng vàng dưới ô số liệu (phải): chữ to nhỏ thế nào cũng không đè nhau
  function layoutSides() {
    if (!root) return;
    const below = (el, gap = 30) => `${el.offsetTop + el.offsetHeight + gap}px`;
    const board = $('.cx-board', root);
    if (cfg.sideTop == null) {
      $('.cx-guide', root).style.top = below($('.cx-plaque', root));
      board.style.top = below($('.cx-stats', root));
    }
  }

  // ---------- Số liệu, bảng vàng, nén nhang ----------
  function boardAvatarUrl(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return '';
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }

  function updateBoard(top, count) {
    const list = $('.cx-board ol', root);
    while (list.children.length > count) list.lastElementChild.remove();
    for (let i = 0; i < count; i++) {
      let row = list.children[i];
      if (!row) {
        row = document.createElement('li');
        // Only static markup here; all viewer data is assigned through DOM properties below.
        row.innerHTML = '<span class="portrait"><span class="av" role="img"><span class="initials" aria-hidden="true"></span></span><span class="rk"></span></span><div><div class="nm"></div><div class="cd"></div></div>';
        list.appendChild(row);
      }
      const player = top[i], name = String(player?.name || '').trim() || 'Thí chủ';
      const avatar = $('.av', row), initials = $('.initials', row), rank = $('.rk', row);
      row.classList.toggle('empty', !player);
      rank.textContent = String(i + 1);
      rank.setAttribute('aria-label', `Hạng ${i + 1}`);
      const words = name.trim().split(/\s+/);
      initials.textContent = !player ? '—' : (words.length > 1
        ? Array.from(words[0])[0] + Array.from(words[words.length - 1])[0]
        : Array.from(name.trim()).slice(0, 2).join('')).toLocaleUpperCase('vi-VN');
      avatar.setAttribute('aria-label', player ? `Ảnh đại diện của ${name}` : 'Chờ người hữu duyên');
      $('.nm', row).textContent = player ? name : 'Chờ người hữu duyên';
      $('.nm', row).title = player ? name : '';
      const coins = $('.cd', row);
      coins.textContent = player ? `${fmt(player.coins)} ${cfg.giftCard?.unit || 'công đức'}` : '';
      coins.title = coins.textContent;
      const url = player ? boardAvatarUrl(player.avatar) : '';
      if (avatar.dataset.url === url) continue;
      avatar.dataset.url = url;
      avatar.classList.remove('loaded');
      $('img', avatar)?.remove();
      if (!url) continue;
      const image = document.createElement('img');
      image.alt = '';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      image.onload = () => { if (image.parentNode === avatar) avatar.classList.add('loaded'); };
      image.onerror = () => { if (image.parentNode === avatar) { avatar.classList.remove('loaded'); image.remove(); } };
      avatar.appendChild(image);
      image.src = url;
    }
  }

  function state(s, peopleCount) {
    if (!root) return;
    const set = (k, v) => { const el = $(`[data-c="${k}"]`, root); if (el) el.textContent = v; };
    set('people', fmt(peopleCount));
    set('likes', fmt(s.totals?.likes));
    set('coins', fmt(s.totals?.coins));
    const n = cfg.board?.size || 3;
    updateBoard(s.top || [], n);
    const g = (s.goals || [])[0], ge = $('.cx-goal', root);
    if (g && ge) {
      $('.lb', ge).innerHTML = `${esc(g.label)}<br><b>${fmt(g.value)}</b> / ${fmt(g.target)}`;
      const pct = `${Math.round(Math.min(1, g.progress) * 100)}%`;
      $('.ash', ge).style.width = pct; $('.ember', ge).style.left = pct;
    }
    layoutSides();
  }

  // ---------- Liễn trái: tự sinh từ luật chat ----------
  function guide(data, chars) {
    const ul = root && $('.cx-guide ul', root);
    if (!ul) return;
    const r = data?.rules || {}, rows = [];
    rows.push(r.joinMode === 'keyword' && r.joinKeywords?.length ? [`«${r.joinKeywords[0]}»`, 'vào chùa'] : ['Bình luận', 'vào chùa']);
    const seen = new Set();
    for (const c of r.chatCommands || []) {
      if (seen.has(c.action)) continue;
      seen.add(c.action);
      rows.push([`«${c.keywords[0]}»`, c.label || c.action]);
    }
    rows.push(['Thả tim', 'gõ mõ']);
    const kws = (chars || []).map((c) => c.keywords?.[0]).filter(Boolean);
    ul.innerHTML = rows.slice(0, cfg.guide?.max || 5).map(([k, d]) => `<li><span class="k">${esc(k)}</span><span class="d">${esc(d)}</span></li>`).join('');
  }

  // ---------- Tờ sớ khi dâng lễ ----------
  const soQ = [];
  let soBusy = false;
  function giftCard(ev) {
    soQ.push(ev);
    if (soQ.length > 12) soQ.splice(0, soQ.length - 12);
    if (!soBusy) nextSo();
  }
  function nextSo() {
    const el = $('.cx-so', root), ev = soQ.shift();
    if (!ev) { soBusy = false; el.classList.remove('show'); return; }
    soBusy = true;
    const g = cfg.giftCard || {};
    const a = (theme.actions || []).find((x) => x.id === ev.action);
    const said = lastWords.get(ev.user?.id);
    $('.who', el).textContent = ev.user?.name || 'Thí chủ';
    $('.what', el).innerHTML = `${esc(g.verb || 'kính dâng')} <b>${esc(a?.offering || ev.label || ev.gift?.name)}${ev.count > 1 ? ` ×${ev.count}` : ''}</b>${ev.total ? ` · ${fmt(ev.total)} ${esc(g.unit || 'công đức')}` : ''}`;
    $('.quote', el).textContent = said && Date.now() - said.at < 120000 ? `“${said.text}”` : '';
    el.classList.toggle('big', Boolean(ev.big));
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    const it = root.querySelector(`.cx-item[data-action="${CSS.escape(ev.action || '')}"]`);
    if (it) { it.classList.remove('hit'); void it.offsetWidth; it.classList.add('hit'); }
    setTimeout(() => { el.classList.remove('show'); setTimeout(nextSo, 500); }, soQ.length > 4 ? 1500 : ev.big ? 5000 : 3200);
  }

  function ticker() {} // không còn sổ lễ: tờ sớ đã báo người tặng


  // ---------- Quẻ xăm ----------
  // Giọng đọc quẻ thường tới sau vài giây: thẻ giữ trên màn hình tới khi đọc xong (tối đa 35 giây)
  const quoteVoice = new Map(); // id người xin quẻ -> 'on' | 'done'
  K.on('speak', (e) => { if (e.about === 'draw' && e.for) quoteVoice.set(e.for, 'on'); });
  K.on('speakEnd', (e) => { if (e.about === 'draw' && e.for) quoteVoice.set(e.for, 'done'); });
  async function waitQuoteVoice(uid) {
    const t0 = Date.now();
    await later(6000);
    while (Date.now() - t0 < 35000) {
      const st = quoteVoice.get(uid);
      if (st === 'done') { await later(1200); break; }
      if (!st && Date.now() - t0 > 14000) break; // không có giọng đọc (tắt giọng / lỗi): để thẻ khoảng 14 giây
      await later(250);
    }
    quoteVoice.delete(uid);
  }
  const xamQ = [];
  let xamBusy = false;
  function draw(ev) {
    if (xamQ.length < 6) xamQ.push(ev);
    if (!xamBusy) nextXam();
  }
  async function nextXam() {
    const ev = xamQ.shift();
    if (!ev) { xamBusy = false; return; }
    xamBusy = true;
    const el = $('.cx-xam', root), d = ev.draw || {};
    const loai = String(d.loai || '');
    el.style.setProperty('--tone', TONES[loai.toLowerCase()] || '#b3140e');
    $('.one span', el).textContent = `${d.so || d.n}`;
    $('.so', el).textContent = `Quẻ số ${d.so || d.n}`;
    $('.requester', el).textContent = `của ${ev.user?.name || 'thí chủ'}`;
    $('.loai', el).innerHTML = loai.split(' ').map(esc).join('<br>');
    $('.tho', el).innerHTML = [].concat(d.tho || []).map(esc).join('<br>');
    $('.loi', el).innerHTML = d.loi ? `<b>Lời bàn</b> · ${esc(d.loi)}` : '';
    $('.nm', el).textContent = `Quẻ của ${ev.user?.name || 'thí chủ'}${d.again ? ' · đã xin hôm nay' : ''}`;
    $('.dt', el).textContent = new Date().toLocaleDateString('vi-VN');
    quoteVoice.delete(ev.user?.id);
    el.classList.remove('up', 'open'); el.classList.add('show');
    const ong = $('.ong', el);
    ong.classList.add('shake');
    await later(d.again ? 600 : 1800);
    ong.classList.remove('shake');
    el.classList.add('up');
    K.audio.sfx('chuong', { force: true });
    await later(700);
    el.classList.add('open');
    await waitQuoteVoice(ev.user?.id);
    el.classList.remove('show');
    await later(500);
    nextXam();
  }

  // ---------- Đèn nguyện (hành động "lantern") ----------
  function lantern(person, ev) {
    if (!root || !person) return;
    if (root.querySelectorAll('.cx-den').length >= 6) return;
    const h = K.scene.P.head(person);
    const wish = String(ev.text || '').trim().slice(0, 48);
    const el = document.createElement('div');
    el.className = 'cx-den';
    el.style.left = `${Math.max(Z.side + 130, Math.min(1080 - Z.side - 130, h.x))}px`;
    el.style.top = `${h.y - 70}px`;
    const rise = -(h.y - 70 - (cfg.lanternTop ?? 720)); // bay tới ngang bàn thờ rồi tan, không che tượng
    el.style.setProperty('--rise', `${rise}px`);
    el.style.setProperty('--mid', `${rise * 0.5}px`);
    el.innerHTML = `<div class="lamp"><img src="assets/cdo/fx_lotus.png"></div><div class="wish">${esc(wish)}</div><div class="by">${esc(person.name || '')}</div>`;
    root.appendChild(el);
    setTimeout(() => el.remove(), 8200);
  }

  function toast(text, ms = 3500) {
    const el = root && $('.cx-toast', root);
    if (!el) return;
    el.textContent = text; el.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), ms);
  }

  // nhịp mõ đều (tiếng mõ thật, khoảng 52 nhịp/phút) trong lúc băng thời kinh hiện
  let moTimer = null;
  function moBeat(ms) {
    clearInterval(moTimer);
    const end = performance.now() + ms;
    moTimer = setInterval(() => {
      if (performance.now() > end) return clearInterval(moTimer);
      K.audio.sfx('mo', { cooldown: 0, volume: 0.45, vary: 0.03 });
    }, 1150);
  }

  function periodic(ev) {
    const el = root && $('.cx-kinh', root);
    if (!el || !ev.text) return;
    moBeat(12000);
    $('h4', el).textContent = ev.title || 'THỜI KINH';
    $('p', el).textContent = ev.text;
    el.classList.add('show');
    clearTimeout(periodic.t); periodic.t = setTimeout(() => el.classList.remove('show'), 12000);
  }

  function remember(userId, text) { const t = String(text || '').trim(); if (t.length >= 6) lastWords.set(userId, { text: t.slice(0, 90), at: Date.now() }); }
  function reset() { soQ.length = 0; xamQ.length = 0; }

  K.hud = { init, giftCard, ticker, state, guide, toast, periodic, draw, remember, reset };
  K.action('lantern', (person, ev) => lantern(person, ev));

  // ---------- Hào quang theo danh hiệu (theme.json "titles"[].aura) ----------
  let sparkAt = 0;
  K.on('frame', (t) => {
    const titles = theme.titles || [];
    if (!titles.some((x) => x.aura)) return;
    const spark = t - sparkAt > 900;
    if (spark) sparkAt = t;
    for (const p of K.scene.people()) {
      const lv = titles.find((x) => x.label === p.title)?.aura;
      if (!lv) continue;
      p.aura = Math.max(p.aura, lv);
      if (spark && lv >= 0.8) { const h = K.scene.P.head(p); K.fx.emit('spark', { x: h.x, y: h.y, count: 2, spread: 18 }); }
    }
  });
})();
