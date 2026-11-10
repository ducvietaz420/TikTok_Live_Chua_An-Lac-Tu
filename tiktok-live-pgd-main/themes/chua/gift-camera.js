// Camera riêng cho quà tặng của chùa. Gọi ở lúc nhân vật bắt đầu làm lễ,
// để camera theo đúng người dâng thay vì zoom khi người đó đã quay về chỗ.
(function () {
  const K = window.Kit;
  let focused = new WeakSet();
  let celebrated = new WeakSet();

  function giftFocus(person, ev, context = {}) {
    if (!person || person.leaving || ev?.kind !== 'gift') return;
    const grand = ev.big || ev.action === 'grand';
    // Tri ân và đài sen bắt đầu cùng lễ, kể cả khi đã tắt riêng camera.
    if (grand && !celebrated.has(ev)) {
      celebrated.add(ev);
      K.events.emit('grandOffering', { person, event: ev });
    }
    if (context.settings?.cameraFx === false || focused.has(ev)) return;
    focused.add(ev);
    // Quà thường: tiến nhẹ, giữ ngắn. Đại lễ giữ cỡ zoom nổi bật hiện tại.
    K.scene.focus(person, grand
      ? { zoom: 1.6, duration: 3500 }
      : { zoom: 1.25, duration: 2200 });
  }

  K.action('giftFocus', giftFocus);

  // Luật quà có thể được đổi trong bảng điều khiển, kể cả sang hành động
  // chưa khai báo hoặc hành động chat: vẫn có camera khi đó là quà tặng.
  K.on('gift', (ev) => {
    const action = window.Live.theme?.actions?.find((item) => item.id === ev.action);
    if (action?.steps?.some((step) => step.js === 'giftFocus')) return;
    const person = K.scene.person(ev.user?.id);
    if (person) K.scene.P.do(person, (p) => giftFocus(p, ev, {
      settings: window.Live.settings,
    }));
  });

  const reset = () => { focused = new WeakSet(); celebrated = new WeakSet(); };
  window.Live.on('ready', reset);
  window.Live.on('reset', reset);
})();
