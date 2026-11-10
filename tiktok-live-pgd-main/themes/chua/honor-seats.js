// Ghế danh dự của chùa luôn theo đúng thứ tự bảng vàng:
// ghế 0 ở giữa (hạng 1), ghế 1 bên trái (hạng 2), ghế 2 bên phải (hạng 3).
// Chỉ đổi đích về chỗ; giữ nguyên hành động tặng quà và đường đi đang chạy.
(function () {
  const K = window.Kit;
  const scene = K.scene;
  let latestTop = [];
  let retryAt = 0;
  let needsRetry = false;
  const arrivals = new Map();

  function release(person) {
    if (person.slot?.taken === person.id) person.slot.taken = null;
  }

  // Cùng chính sách với đám đông của kit: chỗ trống trước, rồi người rảnh lâu nhất.
  function freeHome() {
    const open = scene.layout.slots.find((slot) => !slot.taken);
    if (open) return open;
    let oldest = null;
    for (const person of scene.people()) {
      if (!person.slot || person.slot.vip || person.task || person.tasks.length) continue;
      if (!oldest || person.lastActive < oldest.lastActive) oldest = person;
    }
    if (!oldest?.slot) return null;
    const home = oldest.slot;
    scene.leave(oldest.id);
    return home;
  }

  function reconcile() {
    const seats = scene.seats;
    const desired = latestTop.slice(0, seats.length);
    const targets = new Map(desired.map((user, i) => [user.id, seats[i]]));
    const ranks = new Map(desired.map((user, i) => [user.id, i + 1]));
    const demoted = [];
    needsRetry = false;

    // Nhả các chỗ đổi chủ trước khi gán lại, kể cả khi hai người đổi hạng cho nhau.
    for (const person of scene.people()) {
      person.rank = ranks.get(person.id) || 0;
      const target = targets.get(person.id);
      if (target && person.slot !== target) release(person);
      if (!target && person.slot?.vip) {
        release(person);
        person.slot = null;
        demoted.push(person);
        arrivals.delete(person.id);
      }
    }
    // Giữ đúng ghế cho từng hạng dù người đó vẫn đang đi hoặc đang làm lễ.
    seats.forEach((seat, i) => { seat.taken = desired[i]?.id ?? null; });

    const assign = (person, user, seat, rank) => {
      if (!person || person.leaving) { needsRetry = true; return; }
      const changed = person.slot !== seat;
      const wasVip = person.slot?.vip;
      release(person);
      person.slot = seat;
      seat.taken = person.id;
      person.rank = rank;
      person.coins = user.coins;
      if (changed && (!wasVip || arrivals.has(person.id))) arrivals.set(person.id, seat);
      // Khi hết hàng việc, engine tự đưa người về person.slot mới; không thêm việc
      // ở mỗi lần cập nhật bảng vàng, tránh kéo dài hoặc ngắt hoạt cảnh đang chạy.
    };

    // Gán người đã có trước: ensure() có thể giãn đám đông khi tạo người mới.
    desired.forEach((user, i) => {
      const person = scene.person(user.id);
      if (person) assign(person, user, seats[i], i + 1);
    });
    desired.forEach((user, i) => {
      if (!scene.person(user.id)) assign(scene.ensure(user), user, seats[i], i + 1);
    });

    for (const person of demoted) {
      // ensure() có thể đã giãn lại sàn và cấp chỗ mới cho người vừa rời ghế.
      if (person.slot && !person.slot.vip && person.slot.taken === person.id) continue;
      const home = freeHome();
      if (!home) { scene.leave(person.id); continue; }
      person.slot = home;
      home.taken = person.id;
    }
  }

  scene.seatTop = function (top = []) {
    const seen = new Set();
    latestTop = top.filter((user) => {
      if (!user?.id || seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    });
    reconcile();
  };

  const frame = scene.frame;
  scene.frame = function (t, dt) {
    if (needsRetry && t >= retryAt) {
      retryAt = t + 800;
      reconcile();
    }
    const result = frame.call(scene, t, dt);
    for (const [id, seat] of arrivals) {
      const person = scene.person(id);
      if (!person || person.leaving || person.slot !== seat || seat.taken !== id) {
        arrivals.delete(id);
        continue;
      }
      if (person.walking || Math.hypot(person.x - seat.x, person.y - seat.y) >= 3) continue;
      arrivals.delete(id);
      person.aura = 1;
      K.fx.pillar(person.x, person.y, { height: scene.height(person) * 6 });
      K.events?.emit('seated', person);
    }
    return result;
  };

  const reset = scene.reset;
  scene.reset = function () {
    latestTop = [];
    needsRetry = false;
    retryAt = 0;
    arrivals.clear();
    return reset.call(scene);
  };
})();
