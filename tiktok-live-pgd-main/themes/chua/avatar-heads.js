// Phần riêng của chùa: vẽ avatar cùng lớp với từng nhân vật, trước nhãn tên.
// Tâm đầu (x, y, đường kính) đo trên từng ô 195 × 296 của devotee.png.
// Dùng toạ độ ảnh gốc để cả khung đứng, quỳ và đi ngang đều bám đúng đầu.
(function () {
  const K = window.Kit;
  const scene = K.scene;
  const heads = [
    [97, 34, 44], [98, 33, 44], [97, 32, 44], [97, 34, 44],
    [97, 30, 44], [97, 30, 44], [98, 32, 44], [98, 32, 44],
    [97, 34, 44], [97, 34, 44], [97, 34, 44], [97, 34, 44],
    [99, 101, 44], [98, 100, 44], [100, 99, 44], [99, 100, 44],
    [98, 130, 44], [97, 142, 44], [65, 155, 44], [51, 176, 44],
    [152, 179, 44], [35, 258, 44], [161, 258, 44], [101, 135, 44],
    [96, 106, 44], [109, 129, 44], [86, 107, 44], [84, 107, 44],
    [96, 118, 44], [98, 137, 44], [101, 137, 44], [108, 143, 44],
  ];
  const decorated = new WeakSet();
  const tags = new WeakMap();
  const viewerHeads = new Map();
  const isViewer = (person) => !person.npc && person.char?.sheet === 'assets/chars/devotee.png';
  const isTop = (person) => !person.leaving && isViewer(person) && person.slot?.vip && person.rank >= 1 && person.rank <= 3;
  const bubbles = K.makeLabels({ head: scene.P.head, color: (key, fallback) => window.Live?.theme?.colors?.[key] || fallback });

  function customTag(person) {
    if (tags.has(person)) return;
    const tag = { picked: person.showTag };
    // Giữ nguyên lựa chọn/tối đa nhãn của kit, chỉ thay cách vẽ tên để chữ
    // luôn ở tâm đầu, không bị phần ảnh đại diện trong nhãn đẩy sang bên.
    Object.defineProperty(person, 'showTag', {
      configurable: true,
      get() { return isViewer(person) ? false : tag.picked; },
      set(value) { tag.picked = value; },
    });
    tags.set(person, tag);
  }

  // Ba tia sao nhỏ cho mỗi người top, vẽ lại theo thời gian; không tạo hạt
  // lưu trong bộ nhớ và không ảnh hưởng nhãn của người xem phía dưới.
  function drawSparkles(ctx, x, bottom, width, t, rank, color) {
    const points = [[x - width / 2 - 5, bottom - 26], [x + width / 2 + 6, bottom - 23], [x + width * 0.18, bottom + 3]];
    ctx.save();
    for (let i = 0; i < points.length; i++) {
      const [sx, sy] = points[i];
      const pulse = (1 + Math.sin(t / 380 + rank * 1.3 + i * 2.1)) / 2;
      const radius = 1.6 + pulse * 1.8;
      ctx.globalAlpha = 0.3 + pulse * 0.7;
      ctx.fillStyle = '#fffcec';
      ctx.shadowColor = color;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.moveTo(sx, sy - radius * 1.6);
      ctx.lineTo(sx + radius * 0.28, sy - radius * 0.28);
      ctx.lineTo(sx + radius, sy);
      ctx.lineTo(sx + radius * 0.28, sy + radius * 0.28);
      ctx.lineTo(sx, sy + radius * 1.6);
      ctx.lineTo(sx - radius * 0.28, sy + radius * 0.28);
      ctx.lineTo(sx - radius, sy);
      ctx.lineTo(sx - radius * 0.28, sy - radius * 0.28);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawViewerNames(t) {
    const all = [...viewerHeads.values()].filter(({ person }) => !person.leaving && (isTop(person) || tags.get(person)?.picked));
    const top = all.filter(({ person }) => isTop(person));
    // Nhãn top vẽ cuối để vẫn rõ khi có người đi ngang phía trước.
    all.sort((a, b) => Number(isTop(a.person)) - Number(isTop(b.person)));
    for (const entry of all) {
      const { person, ctx, matrix, x, y, radius } = entry;
      const ranked = isTop(person);
      const nearest = ranked ? top.reduce((gap, other) => other === entry ? gap : Math.min(gap, Math.abs(other.x - x)), Infinity) : Infinity;
      const bottom = y - radius - 10;
      ctx.save();
      ctx.setTransform(matrix);
      ctx.globalAlpha = 1;
      ctx.font = `700 ${ranked ? 22 : 24}px "Be Vietnam Pro", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const medal = ranked ? ['', '🥇', '🥈', '🥉'][person.rank] : '';
      let medalBox = null;
      if (ranked) {
        ctx.save();
        ctx.font = '40px system-ui, sans-serif';
        ctx.textAlign = 'right';
        medalBox = ctx.measureText(medal);
        ctx.restore();
      }
      const medalWidth = medalBox ? medalBox.actualBoundingBoxLeft + medalBox.actualBoundingBoxRight : 0;
      const width = ranked ? Math.max(70, Math.min(150, nearest - medalWidth - 4)) : 220;
      let name = String(person.name || 'Khách');
      const letters = Array.from(name);
      const textWidth = () => {
        const box = ctx.measureText(name);
        return ranked ? box.actualBoundingBoxLeft + box.actualBoundingBoxRight : box.width;
      };
      while (letters.length && textWidth() > width) {
        letters.pop();
        name = letters.join('') + '…';
      }
      if (person.bubble) {
        ctx.save();
        bubbles.bubble(ctx, x, bottom - 36, person.bubble.text);
        ctx.restore();
      }
      const nameBox = ctx.measureText(name);
      const nameWidth = nameBox.width;
      if (!ranked) {
        ctx.fillStyle = 'rgba(25,14,10,.8)';
        ctx.strokeStyle = 'rgba(214,168,82,.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - nameWidth / 2 - 12, bottom - 28, nameWidth + 24, 34, 7);
        ctx.fill();
        ctx.stroke();
      }
      // Chữ được căn giữa theo tâm đầu; huy chương nằm riêng bên trái.
      ctx.strokeStyle = 'rgba(32,15,6,.95)';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0,0,0,.85)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#fff4d6';
      ctx.strokeText(name, x, bottom);
      if (ranked) {
        const light = ['', '#ffd770', '#e5f0ff', '#ffc18a'][person.rank];
        ctx.strokeStyle = light;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = light;
        ctx.shadowBlur = 9 + 5 * (1 + Math.sin(t / 620 + person.rank)) / 2;
        ctx.strokeText(name, x, bottom);
      }
      ctx.fillText(name, x, bottom);
      if (ranked) {
        const light = ['', '#ffd770', '#e5f0ff', '#ffc18a'][person.rank];
        drawSparkles(ctx, x, bottom, nameWidth, t, person.rank, light);
        ctx.font = '40px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.shadowBlur = 6;
        // Cách đúng mép chữ 2px và cùng tâm chiều cao, không đẩy huy chương
        // lên xa tên khi ba người top ngồi cạnh nhau.
        const medalX = x - nameBox.actualBoundingBoxLeft - 2 - medalBox.actualBoundingBoxRight;
        const nameCenterY = bottom + (nameBox.actualBoundingBoxDescent - nameBox.actualBoundingBoxAscent) / 2;
        const medalY = nameCenterY + (medalBox.actualBoundingBoxAscent - medalBox.actualBoundingBoxDescent) / 2;
        ctx.fillText(medal, medalX, medalY);
      }
      ctx.restore();
    }
  }

  function attach(person) {
    customTag(person);
    const character = person.char;
    if (decorated.has(character) || character?.sheet !== 'assets/chars/devotee.png') return;
    const sheet = character.sheetD;
    if (!sheet) return;
    // Mỗi người có lớp vẽ riêng, vẫn dùng chung ảnh/boxes đã tải trong bộ nhớ.
    const personalSheet = Object.create(sheet);
    personalSheet.drawFrame = function (ctx, index, cx, baseY, height, opts = {}) {
      const drawn = sheet.drawFrame(ctx, index, cx, baseY, height, opts);
      const avatar = person.avatar;
      if (!drawn) return drawn;
      const i = Math.max(0, Math.min(sheet.frames - 1, index | 0));
      const head = heads[i], box = sheet.boxes[i];
      if (!head || !box) return drawn;
      const scale = height / (opts.refH || box.h);
      const dx = (head[0] - (box.x - i * sheet.frameW) - box.w / 2) * scale;
      const x = cx + (opts.flip ? -dx : dx);
      const y = baseY - box.h * scale + (head[1] - box.y) * scale;
      const hasAvatar = avatar?.complete && avatar.naturalWidth && avatar.naturalHeight;
      const diameter = head[2] * scale * (hasAvatar ? 1.7 : 1); // avatar lớn hơn đầu hiện tại 70%
      if (!person.leaving) viewerHeads.set(person.id, { person, ctx, matrix: ctx.getTransform(), x, y, radius: diameter / 2 });
      if (!hasAvatar) return drawn;
      const crop = Math.min(avatar.naturalWidth, avatar.naturalHeight);
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, diameter / 2, 0, Math.PI * 2);
      ctx.clip();
      // Cắt vuông ở giữa để avatar không méo; không lật chữ/ảnh khi người quay trái.
      ctx.drawImage(avatar, (avatar.naturalWidth - crop) / 2, (avatar.naturalHeight - crop) / 2,
        crop, crop, x - diameter / 2, y - diameter / 2, diameter, diameter);
      ctx.restore();
      return drawn;
    };
    person.char = { ...character, sheetD: personalSheet };
    decorated.add(person.char);
  }

  const frame = scene.frame;
  scene.frame = function (t, dt) {
    viewerHeads.clear();
    // Kiểm tra cả người vừa khôi phục từ phiên live và người mới được xếp ghế.
    for (const person of scene.people()) attach(person);
    const result = frame.call(scene, t, dt);
    drawViewerNames(t);
    return result;
  };
})();
