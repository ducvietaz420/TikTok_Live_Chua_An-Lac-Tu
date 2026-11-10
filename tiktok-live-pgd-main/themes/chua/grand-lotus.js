// Đài sen cho đại lễ: ảnh sen thật của theme được nhuộm vàng khi vẽ,
// nở chậm trên sàn và luôn nằm sau nhân vật, cùng hệ toạ độ với camera.
(function () {
  const K = window.Kit;
  const active = new Map();
  const DURATION = 4800;
  const MAX_LOTUSES = 6;
  let source = null, golden = null;

  function preload() {
    source ||= K.assets.get('assets/cdo/fx_lotus.png');
  }

  function artwork() {
    preload();
    if (golden || !source.ready) return golden;
    const image = document.createElement('canvas');
    image.width = source.w; image.height = source.h;
    const ctx = image.getContext('2d');
    ctx.filter = 'grayscale(1) sepia(1) saturate(3) hue-rotate(350deg) brightness(1.18)';
    source.draw(ctx, 0, 0, image.width, image.height);
    golden = image;
    return golden;
  }

  function begin({ person, event } = {}) {
    if (!person?.id || person.npc || person.leaving || event?.kind !== 'gift') return;
    if (!event.big && event.action !== 'grand') return;
    // Một đài sen cho mỗi người, làm mới khi dâng liên tiếp; số đài luôn hữu hạn.
    active.delete(person.id);
    if (active.size >= MAX_LOTUSES) active.delete(active.keys().next().value);
    active.set(person.id, { person, born: performance.now() });
    preload();
  }

  function draw(ctx, t) {
    const art = active.size ? artwork() : null;
    for (const [id, effect] of active) {
      const person = K.scene.person(id);
      const age = t - effect.born;
      if (!person || person !== effect.person || person.leaving || age >= DURATION) {
        active.delete(id);
        continue;
      }
      if (age < 0) continue;
      const open = 1 - Math.pow(1 - Math.min(1, age / 750), 3);
      const fade = Math.min(1, age / 380) * Math.min(1, (DURATION - age) / 950);
      const personH = K.scene.height(person);
      const width = personH * 2.6, height = personH * 0.98;
      ctx.save();
      ctx.translate(person.x, person.y + personH * 0.09);

      // Vầng sáng mỏng bám mặt sàn, không che thân người hoặc cả chánh điện.
      ctx.save();
      ctx.scale(1, 0.3);
      const radius = width * (0.6 + open * 0.18);
      const glow = ctx.createRadialGradient(0, 0, width * 0.08, 0, 0, radius);
      glow.addColorStop(0, 'rgba(255,223,126,.31)');
      glow.addColorStop(0.45, 'rgba(255,200,76,.15)');
      glow.addColorStop(1, 'rgba(255,190,60,0)');
      ctx.globalAlpha = fade;
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();

      // Hai vòng sáng lan ra một lần rồi tan, không tạo thêm hạt qua mỗi khung.
      for (const delay of [100, 650]) {
        const progress = (age - delay) / 2100;
        if (progress < 0 || progress > 1) continue;
        const ring = width * (0.4 + progress * 0.56);
        ctx.globalAlpha = fade * Math.sin(Math.PI * progress) * (1 - progress) * 0.4;
        ctx.strokeStyle = '#ffe5a0'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, ring, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();

      if (art) {
        ctx.globalAlpha = fade * 0.94;
        const w = width * (0.38 + open * 0.62);
        const h = height * (0.18 + open * 0.82);
        ctx.drawImage(art, -w / 2, -h * 0.83, w, h);
      }
      ctx.restore();
    }
  }

  const fxDraw = K.fx.draw;
  K.fx.draw = function (ctx, layer, t) {
    const result = fxDraw.call(this, ctx, layer, t);
    if (layer === 'back') draw(ctx, t);
    return result;
  };

  K.on('start', preload);
  K.on('grandOffering', begin);
  window.Live.on('reset', () => active.clear());
  window.Live.on('ready', () => active.clear());
})();
