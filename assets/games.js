/* ==========================================================
   LỚP HỌC VUI — Mini game engines
   ========================================================== */
'use strict';

const Games = (() => {
  const META = {
    mosquito: {
      title: 'Đập Muỗi Gọi Tên',
      emoji: '🦟',
      stageClass: 'mosquito-stage',
      desc: 'Thả đàn muỗi bay khắp lớp, đập một cái là gọi được tên.'
    },
    ufo: {
      title: 'UFO Gọi Tên',
      emoji: '🛸',
      stageClass: 'ufo-stage',
      desc: 'UFO quét qua lớp học và bắt lấy những bạn may mắn.'
    },
    duck: {
      title: 'Đua Vịt',
      emoji: '🦆',
      stageClass: 'duck-stage',
      desc: 'Những chú vịt đua về đích, chú nào về nhất sẽ được gọi tên.'
    }
  };

  let activeStop = null;
  let currentKey = null;

  /* ---------------- helpers ---------------- */
  const icon = (name, cls = 'icon') => `<svg class="${cls}"><use href="#${name}"/></svg>`;

  function makeTimers() {
    const ids = [];
    return {
      add(fn, ms) { const id = setTimeout(fn, ms); ids.push(id); return id; },
      clear() { ids.forEach(clearTimeout); ids.length = 0; }
    };
  }

  function duckSVG(color) {
    return `<svg viewBox="0 0 100 82" style="color:${color}" aria-hidden="true">
      <ellipse cx="49" cy="67" rx="30" ry="9" fill="rgba(255,255,255,.22)"/>
      <path d="M18 60c0-13 13-23 30-23 12 0 21 5 25 12l13 2-13 7c-3 9-12 15-24 15H29c-6 0-11-5-11-13z" fill="currentColor"/>
      <path d="M36 51c8-6 20-7 29-2 6 4 8 9 8 14-7 4-16 6-25 6-7 0-12-2-15-5 2-6 0-9 3-13z" fill="rgba(0,0,0,.08)"/>
      <circle cx="68" cy="33" r="12" fill="currentColor"/>
      <path d="M77 30l15 4-15 6z" fill="#ff9f1c"/>
      <circle cx="71" cy="29" r="2.1" fill="#243044"/>
      <circle cx="71.8" cy="28.3" r=".7" fill="#fff"/>
      <path d="M58 22c2-5 7-7 11-5" stroke="rgba(0,0,0,.13)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M34 52c5-3 12-3 16 0" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  /* Học sinh hoạt hình dùng chung cho cả 3 sân khấu */
  const KID_COLORS = {
    shirts: ['#ff8fb1', '#7c9cff', '#46c9a5', '#ffb252', '#b388ff', '#5ac8e8', '#ff7a7a', '#8dd17c'],
    pants: ['#3b4a7a', '#4a4f6a', '#2f6e7a', '#5b4b8a', '#3d5a80', '#6b4f3a'],
    skins: ['#ffd9b8', '#f3c29c', '#e6b088', '#ffcfae'],
    hairs: ['#2b2b35', '#4a2f22', '#1f2937', '#6b4423', '#3a2e4d']
  };

  function kidSVG(v = 0) {
    const C = KID_COLORS;
    const shirt = C.shirts[v % C.shirts.length];
    const pant = C.pants[v % C.pants.length];
    const skin = C.skins[v % C.skins.length];
    const hair = C.hairs[v % C.hairs.length];
    const style = v % 4;
    let hairShapes = `<path d="M22 34c0-10 8-18 18-18s18 8 18 18c-3-4-6-6-9-6-2 3-5 4-9 4s-7-1-9-4c-3 0-6 2-9 6z" fill="${hair}"/>`;
    if (style === 1) hairShapes += `<circle cx="20" cy="34" r="6.2" fill="${hair}"/><circle cx="60" cy="34" r="6.2" fill="${hair}"/>`;
    else if (style === 2) hairShapes = `<circle cx="40" cy="12" r="7" fill="${hair}"/><path d="M22 34c0-9 8-16 18-16s18 7 18 16c-4-4-7-5-10-5-1 2-4 3-8 3s-7-1-8-3c-3 0-6 1-10 5z" fill="${hair}"/>`;
    else if (style === 3) hairShapes = `<path d="M23 31l3-9 5 6 5-10 5 9 5-6 6 10c-9-4-20-4-29 0z" fill="${hair}"/><path d="M22 34c0-9 8-16 18-16s18 7 18 16c-4-4-8-5-11-5-2 2-4 3-7 3s-6-1-8-3c-3 0-6 1-10 5z" fill="${hair}"/>`;
    return `<svg class="kid-svg" viewBox="0 0 80 120" aria-hidden="true">
      <ellipse cx="40" cy="114" rx="18" ry="4" fill="rgba(0,0,0,.18)"/>
      <path d="M33 92v14M47 92v14" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="31" cy="111" rx="8" ry="4" fill="#2b3a5b"/>
      <ellipse cx="49" cy="111" rx="8" ry="4" fill="#2b3a5b"/>
      <path d="M25 86h30v9c0 1.6-1.2 2.8-2.8 2.8H27.8c-1.6 0-2.8-1.2-2.8-2.8z" fill="${pant}"/>
      <path d="M25 60c0-7 6-11 15-11s15 4 15 11v27c0 1.8-1.2 3-3 3H28c-1.8 0-3-1.2-3-3z" fill="${shirt}"/>
      <path d="M35 50l5 6 5-6" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>
      <g class="kid-arm kid-arm-l">
        <path d="M27 62c-6 5-9 12-8 20" fill="none" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>
        <circle cx="19" cy="84" r="4.4" fill="${skin}"/>
      </g>
      <g class="kid-arm kid-arm-r">
        <path d="M53 62c6 5 9 12 8 20" fill="none" stroke="${skin}" stroke-width="7" stroke-linecap="round"/>
        <circle cx="61" cy="84" r="4.4" fill="${skin}"/>
      </g>
      <rect x="36.5" y="49" width="7" height="5" rx="2" fill="${skin}"/>
      <circle cx="40" cy="34" r="18" fill="${skin}"/>
      ${hairShapes}
      <circle cx="33.5" cy="35" r="2.2" fill="#243044"/>
      <circle cx="46.5" cy="35" r="2.2" fill="#243044"/>
      <circle cx="34.2" cy="34.3" r=".8" fill="#fff"/>
      <circle cx="47.2" cy="34.3" r=".8" fill="#fff"/>
      <circle cx="28.5" cy="41" r="3" fill="#ff91a8" opacity=".45"/>
      <circle cx="51.5" cy="41" r="3" fill="#ff91a8" opacity=".45"/>
      <path d="M35.5 43q4.5 4 9 0" stroke="#b5544f" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  function swatSVG() {
    return `<svg viewBox="0 0 120 300" aria-hidden="true">
      <path d="M56 236c3 24 10 44 18 64h30c-16-18-26-40-28-62z" fill="#2b3759"/>
      <path d="M57 236c-3-26 1-46 8-62l16 6c-8 18-11 36-9 56z" fill="#33406b"/>
      <path d="M64 178c-2-8 2-15 9-17 1-4 6-6 10-3l4 3c4 3 5 8 2 12l-4 5z" fill="#f3c29c"/>
      <path d="M52 166l14 8-5 9-14-8z" fill="#ffcfae"/>
      <rect x="56" y="78" width="9" height="88" rx="4" fill="#d79a5c" transform="rotate(8 60 122)"/>
      <g transform="rotate(8 60 122)">
        <ellipse cx="64" cy="52" rx="34" ry="40" fill="#ff5c9d"/>
        <ellipse cx="64" cy="52" rx="26" ry="32" fill="#ffd6e7" opacity=".9"/>
        <path d="M46 34h36M42 46h44M42 58h44M46 70h36M56 20v64M64 16v72M72 20v64" stroke="#ff7fb2" stroke-width="1.6" opacity=".8"/>
      </g>
      <circle cx="73" cy="168" r="7" fill="#f3c29c"/>
    </svg>`;
  }

  function ufoSVG() {
    return `<svg viewBox="0 0 260 150" aria-hidden="true">
      <defs>
        <linearGradient id="ufoBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#d9e4ff"/><stop offset=".5" stop-color="#8ea6ff"/><stop offset="1" stop-color="#5a6ee0"/>
        </linearGradient>
        <linearGradient id="ufoDome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d7ffff" stop-opacity=".95"/><stop offset="1" stop-color="#4de4ff" stop-opacity=".55"/>
        </linearGradient>
        <radialGradient id="ufoGlow"><stop offset="0" stop-color="#7cf7ff" stop-opacity=".6"/><stop offset="1" stop-color="#7cf7ff" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="130" cy="132" rx="118" ry="16" fill="url(#ufoGlow)"/>
      <ellipse cx="130" cy="102" rx="106" ry="22" fill="#3d4b96" opacity=".55"/>
      <ellipse cx="130" cy="88" rx="104" ry="24" fill="url(#ufoBody)"/>
      <ellipse cx="130" cy="80" rx="104" ry="20" fill="#c8d6ff"/>
      <ellipse cx="130" cy="77" rx="95" ry="16" fill="url(#ufoBody)"/>
      <path d="M76 74a54 46 0 0 1 108 0z" fill="url(#ufoDome)" stroke="rgba(255,255,255,.65)" stroke-width="2"/>
      <path d="M95 63a40 34 0 0 1 70 0" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2" stroke-linecap="round"/>
      <g fill="#7cf7ff">
        <circle cx="66" cy="82" r="4"/><circle cx="98" cy="88" r="4"/><circle cx="130" cy="90" r="4"/><circle cx="162" cy="88" r="4"/><circle cx="194" cy="82" r="4"/>
      </g>
      <g fill="#ff8fc4" opacity=".9">
        <circle cx="82" cy="86" r="2.4"/><circle cx="114" cy="90" r="2.4"/><circle cx="146" cy="90" r="2.4"/><circle cx="178" cy="86" r="2.4"/>
      </g>
      <ellipse cx="112" cy="48" rx="17" ry="9" fill="rgba(255,255,255,.45)" transform="rotate(-20 112 48)"/>
    </svg>`;
  }

  /* ==========================================================
     MOSQUITO ENGINE
     ========================================================== */
  function createMosquito(stage, pool, onDone) {
    const layer = stage.querySelector('.mq-layer');
    const hint = stage.querySelector('.mq-hint');
    const reticle = stage.querySelector('.mq-reticle');
    const swat = stage.querySelector('.mq-swat');
    const bang = stage.querySelector('.mq-bang');
    const kids = stage.querySelector('.mq-kids');
    const vignette = stage.querySelector('.mq-vignette');
    const timers = makeTimers();
    let raf = null;
    let bugs = [];
    let playing = false;
    let alive = false;
    let smashLock = false;
    let last = 0;

    const setHint = (text, ready) => {
      hint.textContent = text;
      hint.classList.toggle('ready', !!ready);
      hint.classList.remove('hide');
    };

    /* Chia bầu trời thành lưới: cả danh sách lớp đều xuất hiện, không đè lên nhau */
    function layout() {
      const w = stage.clientWidth, h = stage.clientHeight;
      const top = 10;
      const areaH = Math.max(140, h * 0.60 - top);
      const n = Math.max(1, bugs.length);
      const cellMin = w < 560 ? 44 : 56;
      let rows = Utils.clamp(Math.floor(areaH / cellMin), 1, n);
      let cols = Math.max(1, Math.ceil(n / rows));
      rows = Math.ceil(n / cols);
      const cellW = (w - 24) / cols;
      const cellH = areaH / rows;
      stage.style.setProperty('--mq-cell', Math.round(cellW) + 'px');
      stage.classList.toggle('mq-crowded', n > (w < 560 ? 9 : 14));
      stage.classList.toggle('mq-packed', n > (w < 560 ? 18 : 26));
      bugs.forEach((b, i) => {
        const row = Math.floor(i / cols), col = i % cols;
        const bw = b.el.offsetWidth || 60, bh = b.el.offsetHeight || 48;
        const cx = 12 + col * cellW + cellW / 2;
        const cy = top + row * cellH + cellH / 2;
        b.homeX = Utils.clamp(cx - bw / 2, 4, Math.max(4, w - bw - 4));
        b.homeY = Utils.clamp(cy - bh / 2, 4, Math.max(4, top + areaH - bh));
        b.ampX = Math.min(cellW * 0.13, 15);
        b.ampY = Math.min(cellH * 0.18, 8);
        b.x = b.homeX;
        b.y = b.homeY;
      });
    }

    function bugHTML(student, short) {
      const label = short ? student.name.trim().split(/\s+/).pop() : student.name;
      return `<span class="mq-tag">${Utils.esc(label)}</span>
        <div class="bug">
          <svg viewBox="0 0 60 40">
            <ellipse cx="30" cy="23" rx="13" ry="6.6" fill="#333647"/>
            <circle cx="44" cy="21" r="5" fill="#252836"/>
            <path d="M48 20l9-4M48 22l9 4" stroke="#252836" stroke-width="1.4" stroke-linecap="round"/>
            <ellipse class="wing w1" cx="25" cy="12" rx="11" ry="5.5" fill="rgba(230,245,255,.82)" stroke="rgba(120,130,160,.55)" stroke-width="1"/>
            <ellipse class="wing w2" cx="36" cy="12" rx="11" ry="5.5" fill="rgba(230,245,255,.7)" stroke="rgba(120,130,160,.5)" stroke-width="1"/>
            <path d="M25 28l-5 8M31 29l-2 9M38 28l4 8M20 22l-8 4M20 25l-9 8" stroke="#252836" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </div>`;
    }

    function spawn(winner) {
      layer.innerHTML = '';
      bugs = [];
      alive = true;
      const rest = Utils.shuffle(pool.filter(s => !winner || s.id !== winner.id));
      // Ví trí trong lưới được xáo trộn mỗi lượt nên ai cũng có thể xuất hiện bất cứ đâu
      const list = winner ? Utils.shuffle([winner, ...rest]) : rest;
      const short = stage.clientWidth < 560 && pool.length > 12;
      list.forEach(st => {
        const el = document.createElement('div');
        el.className = 'mosquito';
        el.dataset.id = st.id;
        el.innerHTML = bugHTML(st, short);
        layer.appendChild(el);
        bugs.push({
          student: st,
          el,
          bugEl: el.querySelector('.bug'),
          x: 0, y: 0, homeX: 0, homeY: 0, ampX: 8, ampY: 6,
          phase: Math.random() * Math.PI * 2,
          sx: 0.5 + Math.random() * 0.7,
          sy: 0.7 + Math.random() * 0.9,
          winner: !!winner && st.id === winner.id
        });
      });
      layout();
      bugs.forEach(b => {
        b.el.style.transform = `translate3d(${b.x}px,${b.y}px,0)`;
      });
    }

    function frame(now) {
      if (!alive) return;
      last = now;
      const t = now * 0.001;
      bugs.forEach(b => {
        const x = b.homeX + Math.sin(t * b.sx + b.phase) * b.ampX;
        const y = b.homeY + Math.sin(t * b.sy + b.phase * 1.7) * b.ampY + Math.sin(t * 1.6 + b.phase) * 1.5;
        b.x = x;
        b.y = y;
        b.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
        if (b.bugEl) b.bugEl.style.transform = `rotate(${(Math.cos(t * b.sx + b.phase) * 12).toFixed(1)}deg)`;
      });
      raf = requestAnimationFrame(frame);
    }

    function smash() {
      if (!playing || smashLock) return;
      smashLock = true;
      const b = bugs.find(x => x.winner) || bugs[0];
      if (!b) return;
      playing = false;
      alive = false;
      cancelAnimationFrame(raf);
      Sfx.buzzStop();
      Sfx.swoosh();
      setHint('ĐÃ KHÓA MỤC TIÊU…', false);

      const bw = b.el.offsetWidth, bh = b.el.offsetHeight;
      const px = b.x + bw / 2;
      const py = b.y + bh - (b.bugEl ? b.bugEl.offsetHeight / 2 : 15);
      reticle.style.left = px + 'px';
      reticle.style.top = py + 'px';
      reticle.classList.add('on');
      vignette.classList.add('on');

      // Người cầm vung muỗi lao tới
      swat.style.left = px + 'px';
      swat.style.top = py + 'px';
      swat.classList.remove('hit');
      void swat.offsetWidth;
      swat.classList.add('in');

      timers.add(() => {
        Sfx.heartbeat();
        kids.classList.add('scared');
      }, 230);

      timers.add(() => {
        const splat = document.createElement('div');
        splat.className = 'splat';
        splat.style.left = px + 'px';
        splat.style.top = py + 'px';
        splat.innerHTML = '<div class="splat-core"></div><i></i><i></i><i></i><i></i><i></i>';
        stage.appendChild(splat);
        b.el.classList.add('squashed');
        swat.classList.add('hit');
        bang.style.left = Utils.clamp(px + 96, 86, stage.clientWidth - 86) + 'px';
        bang.style.top = (py + 44) + 'px';
        bang.classList.remove('on');
        void bang.offsetWidth;
        bang.classList.add('on');
        Sfx.splat();
        stage.classList.add('shake');
        timers.add(() => stage.classList.remove('shake'), 420);

        bugs.forEach(other => {
          if (other === b) return;
          other.el.classList.add('flee');
          other.el.style.transform = `translate3d(${other.x + Utils.randInt(-80, 80)}px,${other.y - 280}px,0)`;
        });
        reticle.classList.remove('on');
        kids.classList.remove('scared');
        kids.classList.add('cheer');
        timers.add(() => swat.classList.remove('in', 'hit'), 380);
      }, 660);

      timers.add(() => {
        onDone([b.student]);
      }, 1220);
    }

    const stageClick = (e) => {
      if (!playing) return;
      e.preventDefault();
      smash();
    };
    stage.addEventListener('click', stageClick);

    function play(students) {
      clear();
      spawn(students[0]);
      playing = true;
      smashLock = false;
      last = 0;
      setHint(`CẢ LỚP ${pool.length} BẠN ĐANG BAY · ĐẬP ĐỂ GỌI TÊN!`, true);
      Sfx.buzzStart();
      raf = requestAnimationFrame(frame);
    }

    function idle() {
      clear();
      reticle.classList.remove('on');
      spawn(null);
      setHint(pool.length
        ? `Cả lớp ${pool.length} bạn đã sẵn sàng · Nhấn “Bắt đầu”`
        : 'Nhấn “Bắt đầu” để thả đàn muỗi', false);
      raf = requestAnimationFrame(frame);
    }

    function clear() {
      playing = false;
      alive = false;
      smashLock = false;
      cancelAnimationFrame(raf);
      timers.clear();
      Sfx.buzzStop();
      layer.querySelectorAll('.mosquito').forEach(el => el.remove());
      stage.querySelectorAll('.splat').forEach(el => el.remove());
      stage.classList.remove('shake');
      reticle.classList.remove('on');
      swat.classList.remove('in', 'hit');
      bang.classList.remove('on');
      vignette.classList.remove('on');
      kids.classList.remove('scared', 'cheer');
      bugs = [];
    }

    function stop() {
      clear();
      stage.removeEventListener('click', stageClick);
    }

    function resize() {
      if (!bugs.length) return;
      layout();
      if (playing) bugs.forEach(b => { b.el.style.transform = `translate3d(${b.x}px,${b.y}px,0)`; });
    }

    idle();
    return { play, stop, idle, resize };
  }

  /* ==========================================================
     UFO ENGINE
     ========================================================== */
  function createUfo(stage, pool, onDone) {
    const ship = stage.querySelector('.ufo-ship');
    const beam = stage.querySelector('.ufo-beam');
    const scan = stage.querySelector('.ufo-scan');
    const flash = stage.querySelector('.ufo-flash');
    const hint = stage.querySelector('.ufo-hint');
    const classBox = stage.querySelector('.ufo-class');
    const timers = makeTimers();
    let playing = false;

    hint.innerHTML = 'Nhấn <b>Bắt đầu</b> để UFO quét lớp học';

    function kidHeight(rows, cols) {
      const availH = stage.clientHeight * 0.46;
      const cellW = stage.clientWidth / Math.max(1, cols);
      const byHeight = availH / Math.max(1, rows) - 17;
      const byWidth = cellW * 1.35;
      return Math.round(Utils.clamp(Math.min(byHeight, byWidth), 22, 110));
    }

    /* Cả danh sách lớp đứng dưới sân khấu, xếp thành lưới khi lớp đông */
    function renderClass(students) {
      const list = pool.length ? pool : students;
      const n = Math.max(1, list.length);
      const w = stage.clientWidth;
      const rowLimits = w < 560 ? [8, 16, 24] : [12, 24, 36];
      const rows = n <= rowLimits[0] ? 1 : n <= rowLimits[1] ? 2 : n <= rowLimits[2] ? 3 : 4;
      const cols = Math.max(1, Math.ceil(n / rows));
      const short = w < 560 || n > 20;
      classBox.style.setProperty('--ufo-cols', cols);
      classBox.style.setProperty('--kid-h', kidHeight(Math.ceil(n / cols), cols) + 'px');
      classBox.classList.toggle('ufo-tight', n > 24);
      classBox.innerHTML = list.map((s, i) => {
        const label = short ? s.name.trim().split(/\s+/).pop() : s.name;
        return `<div class="ufo-kid" data-id="${s.id}">
          <div class="uk-body">${kidSVG(i + 2)}</div>
          <span class="uk-tag">${Utils.esc(label)}</span>
        </div>`;
      }).join('');
    }

    function resetScene() {
      ship.classList.remove('in');
      beam.classList.remove('on', 'strong');
      scan.classList.remove('on');
      flash.classList.remove('on');
      hint.classList.remove('hide');
      hint.innerHTML = 'Nhấn <b>Bắt đầu</b> để UFO quét lớp học';
    }

    function play(students) {
      clear();
      resetScene();
      playing = true;
      renderClass(students);
      const ids = new Set(students.map(s => s.id));
      const kids = Array.from(classBox.children);
      const step = Utils.clamp(Math.round(2300 / Math.max(1, kids.length)), 42, 105);
      const lockAt = 760 + kids.length * step;

      Sfx.swoosh();
      ship.classList.add('in');
      hint.innerHTML = `UFO đang quét ${kids.length} bạn trong lớp...`;

      timers.add(() => {
        beam.classList.add('on');
        scan.classList.add('on');
        Sfx.swoosh();
        Sfx.heartbeat();
      }, 520);

      kids.forEach((k, i) => {
        timers.add(() => {
          if (!playing) return;
          kids.forEach(x => x.classList.remove('scanning'));
          k.classList.add('scanning');
          Sfx.tick();
        }, 700 + i * step);
      });

      timers.add(() => {
        kids.forEach(k => {
          k.classList.remove('scanning');
          if (ids.has(k.dataset.id)) k.classList.add('locked');
          else k.classList.add('dim');
        });
        hint.innerHTML = 'ĐÃ KHÓA MỤC TIÊU!';
        beam.classList.add('strong');
        scan.classList.remove('on');
        Sfx.lock();
        Sfx.heartbeat();
      }, lockAt);

      timers.add(() => {
        kids.forEach(k => { if (ids.has(k.dataset.id)) k.classList.add('lifted'); });
        Sfx.swoosh();
      }, lockAt + 540);

      timers.add(() => {
        flash.classList.add('on');
        hint.classList.add('hide');
        Sfx.pop();
      }, lockAt + 1140);

      timers.add(() => {
        onDone(students);
      }, lockAt + 1500);
    }

    function idle() {
      clear();
      resetScene();
      renderClass([]);
    }

    function clear() {
      playing = false;
      timers.clear();
      scan.classList.remove('on');
    }

    function stop() {
      clear();
    }

    resetScene();
    renderClass([]);
    return { play, stop, idle, resize() { if (!playing) renderClass([]); } };
  }

  /* ==========================================================
     DUCK RACE ENGINE
     ========================================================== */
  function createDuck(stage, pool, onDone) {
    const lanes = stage.querySelector('.duck-lanes');
    const countEl = stage.querySelector('.duck-count');
    const crowd = stage.querySelector('.duck-crowd');
    const timers = makeTimers();
    const COLORS = ['#ffd166', '#fff2c2', '#f4a261', '#e9c46a', '#caf0f8', '#ffb4a2', '#a8dadc', '#ffe066'];
    let raf = null;
    let racers = [];
    let playing = false;
    let t0 = 0;
    let base = 6500;
    let doneTimer = null;
    let cols = 1;

    const speedFactor = () => ({ fast: 0.62, normal: 1, slow: 1.42 }[Store.settings.speed] || 1);

    function renderCrowd() {
      const max = stage.clientWidth < 560 ? 7 : 9;
      const people = Utils.shuffle(pool).slice(0, Math.min(max, Math.max(3, pool.length)));
      const sizes = [0, 1, 2, 0, 1, 2, 0, 1, 2];
      crowd.innerHTML = people.map((s, i) => `<div class="dc-kid dc-${sizes[i % sizes.length]}" style="--d:${(i * 0.17).toFixed(2)}s">${kidSVG(i + 1)}</div>`).join('');
    }

    /* Chọn số làn (cột) để cả lớp vừa sân khấu mà tên vẫn đọc được */
    function laneCols(n) {
      const w = stage.clientWidth;
      if (w < 560) return n <= 8 ? 1 : n <= 32 ? 2 : 3;
      if (n <= 10) return 1;
      if (n <= 20) return 2;
      if (n <= 33) return 3;
      return 4;
    }

    function buildLanes(entries) {
      lanes.innerHTML = '';
      racers = [];
      cols = laneCols(entries.length);
      const rows = Math.max(1, Math.ceil(entries.length / cols));
      lanes.style.setProperty('--cols', cols);
      lanes.style.setProperty('--rows', rows);
      const frag = document.createDocumentFragment();

      /* Nhóm về sát nút: vài "đối thủ" bám đuôi để tạo màn rượt đuổi nghẹt thở */
      const losers = entries.filter(e => !e.winner);
      const rivalCount = Math.min(stage.clientWidth < 560 ? 2 : 3, losers.length);
      const rivals = new Set(Utils.shuffle(losers).slice(0, rivalCount).map(e => e.student.id));
      let winnerIdx = 0;

      entries.forEach((entry, i) => {
        const lane = document.createElement('div');
        lane.className = 'duck-lane';
        lane.innerHTML = '<span class="dl-start"></span><span class="dl-finish"></span>';
        const runner = document.createElement('div');
        runner.className = 'duck-runner';
        runner.style.setProperty('--x', '0px');
        runner.innerHTML = `<div class="dr-inner">
          <span class="dr-tag">${Utils.esc(entry.student.name)}</span>
          <span class="dr-wake"></span>
          ${duckSVG(COLORS[i % COLORS.length])}
        </div>`;
        lane.appendChild(runner);
        frag.appendChild(lane);
        /* Các bạn được gọi luôn về trước, nhưng chỉ hơn nhóm bám đuôi khoảng 0,1–0,25 giây */
        let factor;
        if (entry.winner) factor = 1 + winnerIdx++ * 0.003;
        else if (rivals.has(entry.student.id)) factor = 1.028 + Math.random() * 0.022;
        else factor = 1.09 + Math.random() * 0.3;
        const r = {
          ...entry,
          el: runner,
          p: 0,
          done: false,
          phase: Math.random() * Math.PI * 2,
          surge: (Math.random() * 2 - 1) * (0.55 + Math.random() * 0.75),
          factor
        };
        r.tag = runner.querySelector('.dr-tag');
        racers.push(r);
      });
      lanes.appendChild(frag);
      // đo lại sau khi gắn DOM (gọi trực tiếp để không phụ thuộc rAF)
      measure();
    }

    function makePreview() {
      renderCrowd();
      buildLanes(Utils.shuffle(pool).map(s => ({ student: s, winner: false })));
    }

    function buildRace(students) {
      const winnerIds = new Set(students.map(s => s.id));
      buildLanes(Utils.shuffle(pool).map(s => ({ student: s, winner: winnerIds.has(s.id) })));
    }

    function placeTag(r, x) {
      if (!r.tag) return;
      const laneW = r.el.parentElement.clientWidth;
      const center = x + r.runnerW / 2;
      let shift = 0;
      if (center - r.tagHalf < 4) shift = 4 - (center - r.tagHalf);
      else if (center + r.tagHalf > laneW - 4) shift = (laneW - 4) - (center + r.tagHalf);
      r.tag.style.transform = `translateX(calc(-50% + ${shift.toFixed(1)}px))`;
    }

    function measure() {
      const first = lanes.firstElementChild;
      const h = first ? first.clientHeight : 56;
      const laneW = first ? first.clientWidth : 300;
      lanes.style.setProperty('--dl-h', h.toFixed(1) + 'px');
      lanes.style.setProperty('--duck-w', Utils.clamp(Math.min(h * 0.92, laneW * 0.28), 18, 58).toFixed(1) + 'px');
      racers.forEach(r => {
        const lane = r.el.parentElement;
        const max = Math.max(20, lane.clientWidth - r.el.offsetWidth - 6);
        r.maxX = max;
        r.runnerW = r.el.offsetWidth;
        r.tagHalf = r.tag ? r.tag.offsetWidth / 2 : 0;
        placeTag(r, 0);
      });
    }

    function setCount(text, go) {
      countEl.textContent = text;
      countEl.classList.remove('show', 'go');
      void countEl.offsetWidth;
      countEl.classList.add('show');
      if (go) countEl.classList.add('go');
    }

    const callEl = stage.querySelector('.duck-callout');
    function callout(text) {
      if (!callEl) return;
      callEl.textContent = text;
      callEl.classList.remove('show');
      void callEl.offsetWidth;
      callEl.classList.add('show');
    }

    function race() {
      t0 = performance.now();
      base = 6500 * speedFactor();
      measure();
      racers.forEach(r => {
        r.p = 0; r.done = false;
        r.el.classList.remove('winner');
        r.el.parentElement.classList.remove('winner-lane');
      });
      let finished = false;
      const calls = [[0.14, 'Cả lớp bứt tốc!'], [0.38, 'Bám sát nhau quá!'], [0.62, 'Sắp về đích!'], [0.84, 'Ai sẽ về nhất?!']];
      let callIdx = 0;

      const step = (now) => {
        if (!playing) return;
        const elapsed = now - t0;
        let allWinnersDone = true;
        let leaderP = 0;
        racers.forEach(r => {
          const dur = base * r.factor;
          let p = Utils.clamp(elapsed / dur, 0, 1);
          p = 1 - Math.pow(1 - p, 1.6);
          r.p = p;
          if (p > leaderP) leaderP = p;
          /* Nhịp bứt phá giữa đường: con vịt lúc vượt lên, lúc chững lại nhưng về đích đúng thứ tự */
          const surge = r.surge * Math.sin(Math.PI * p) * 0.08;
          const q = Utils.clamp(p + surge, 0, 1);
          const wobble = p > 0 && p < 1 ? Math.sin(elapsed / 150 + r.phase) * 1.6 : 0;
          const x = q * r.maxX + wobble;
          r.el.style.setProperty('--x', x + 'px');
          placeTag(r, x);
          if (r.winner && p < 1) allWinnersDone = false;
          if (p >= 1 && !r.done) {
            r.done = true;
            if (r.winner) {
              r.el.classList.add('winner');
              r.el.parentElement.classList.add('winner-lane');
              const splash = document.createElement('div');
              splash.className = 'duck-splash';
              const laneW = r.el.parentElement.clientWidth;
              splash.style.left = Math.min(r.maxX + 30, laneW - 8) + 'px';
              r.el.parentElement.appendChild(splash);
              Sfx.pop();
              if (!crowd.classList.contains('win')) {
                crowd.classList.remove('cheer');
                crowd.classList.add('win');
                Sfx.cheer();
              }
            }
          }
        });
        while (callIdx < calls.length && leaderP >= calls[callIdx][0]) {
          callout(calls[callIdx][1]);
          if (calls[callIdx][0] >= 0.62) Sfx.heartbeat();
          else Sfx.tick();
          callIdx++;
        }
        if (allWinnersDone && !finished) {
          finished = true;
          cancelAnimationFrame(raf);
          callout('VỀ ĐÍCH!');
          stage.classList.add('race-finish');
          doneTimer = timers.add(() => onDone(racers.filter(r => r.winner).map(r => r.student)), 1000);
          return;
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    function play(students) {
      clear();
      playing = true;
      buildRace(students);
      renderCrowd();
      crowd.classList.add('cheer');
      setCount('3', false); Sfx.countdown();
      timers.add(() => { setCount('2', false); Sfx.countdown(); }, 750);
      timers.add(() => { setCount('1', false); Sfx.countdown(); Sfx.heartbeat(); }, 1500);
      timers.add(() => { Sfx.heartbeat(); }, 1950);
      timers.add(() => { setCount('BẮT ĐẦU!', true); Sfx.go(); }, 2250);
      timers.add(() => { if (playing) race(); }, 2800);
    }

    function idle() {
      clear();
      makePreview();
    }

    function clear() {
      playing = false;
      cancelAnimationFrame(raf);
      timers.clear();
      if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
      countEl.classList.remove('show', 'go');
      countEl.textContent = '';
      stage.classList.remove('race-finish');
      if (callEl) { callEl.classList.remove('show'); callEl.textContent = ''; }
      crowd.classList.remove('cheer', 'win');
    }

    function stop() {
      clear();
    }

    function resize() {
      if (!playing) { makePreview(); return; }
      measure();
    }

    makePreview();
    return { play, stop, idle, resize };
  }

  /* ==========================================================
     SHELL / CONTROLLER
     ========================================================== */
  function shell(key, cls, readyCount) {
    const m = META[key];
    const noStudents = !cls || !readyCount;
    return `<div class="game" data-game="${key}">
      <header class="game-head">
        <button class="icon-btn" type="button" data-back aria-label="Quay lại">${icon('i-arrow-left')}</button>
        <div class="gh-copy">
          <h2><span class="gh-emoji">${m.emoji}</span> ${m.title}</h2>
          <p><strong>${cls ? Utils.esc(cls.name) : 'Chưa có lớp'}</strong> · ${readyCount} bạn sẵn sàng</p>
        </div>
        <div class="gh-actions">
          <button class="icon-btn opt" type="button" data-fullscreen title="Toàn màn hình" aria-label="Toàn màn hình">${icon('i-expand')}</button>
          <button class="icon-btn" type="button" data-sound title="Âm thanh" aria-label="Âm thanh">${icon(Store.settings.sound ? 'i-volume' : 'i-volume-off')}</button>
        </div>
      </header>
      <div class="stage-wrap">
        ${stageHTML(key)}
        ${noStudents ? `<div class="stage-empty">
          <div class="bubble">${cls ? '🪑' : '🏫'}</div>
          <h4>${cls ? 'Chưa có bạn nào có mặt' : 'Chưa có lớp học'}</h4>
          <p>${cls ? 'Hãy đánh dấu ít nhất một bạn là “Có mặt” trong danh sách lớp để bắt đầu gọi tên.' : 'Tạo lớp và thêm danh sách học sinh trước khi chơi nhé.'}</p>
          <div class="row">
            <a class="btn primary sm" href="#/classes">${icon('i-users', 'icon sm')} ${cls ? 'Điểm danh lớp' : 'Tạo lớp học'}</a>
          </div>
        </div>` : ''}
        <div class="result-layer hidden"></div>
      </div>
      <div class="game-dock">
        <div class="dock-count">
          <span class="dock-label">Số bạn gọi</span>
          <div class="stepper">
            <button type="button" data-minus aria-label="Giảm">−</button>
            <span class="val" data-count>${Store.settings.count}</span>
            <button type="button" data-plus aria-label="Tăng">+</button>
          </div>
        </div>
        <label class="switch dock-switch">
          <input type="checkbox" data-norepeat ${Store.settings.noRepeat ? 'checked' : ''} />
          <span class="track"></span>
          <span class="switch-label">Không gọi trùng<small>Trong cùng một vòng</small></span>
        </label>
        <div class="dock-round-info" data-round-info></div>
        <div class="dock-spacer"></div>
        <button class="btn ghost" type="button" data-reset>${icon('i-reset', 'icon sm')}<span class="btn-text">Vòng mới</span></button>
        <button class="btn primary" type="button" data-start ${noStudents ? 'disabled' : ''}>${icon('i-play')}<span>Bắt đầu</span></button>
      </div>
    </div>`;
  }

  function stageHTML(key) {
    if (key === 'mosquito') {
      return `<div class="stage mosquito-stage">
        <div class="scene-sun"></div>
        <div class="scene-cloud c1"></div><div class="scene-cloud c2"></div><div class="scene-cloud c3"></div>
        <div class="mq-hills"><div class="scene-hill h1"></div><div class="scene-hill h2"></div></div>
        <div class="mq-grass"></div>
        <div class="mq-trees"><div class="tree t1"></div><div class="tree t2"></div></div>
        <div class="mq-kids" aria-hidden="true">
          <div class="mq-kid k1">${kidSVG(1)}</div>
          <div class="mq-kid k2">${kidSVG(3)}</div>
          <div class="mq-kid k3">${kidSVG(5)}</div>
        </div>
        <div class="mq-school">
          <div class="flag"></div><div class="roof"></div><div class="bd"></div>
          <div class="win wl"></div><div class="win wr"></div><div class="door"></div>
        </div>
        <div class="mq-layer"></div>
        <div class="mq-reticle"></div>
        <div class="mq-vignette"></div>
        <div class="mq-swat">${swatSVG()}</div>
        <div class="mq-bang" aria-hidden="true">BỐP!</div>
        <div class="mq-hint">Nhấn “Bắt đầu” để thả đàn muỗi</div>
      </div>`;
    }
    if (key === 'ufo') {
      return `<div class="stage ufo-stage">
        <div class="ufo-stars">${Array.from({ length: 52 }).map((_, i) => {
          const size = i % 9 === 0 ? 3 : 2;
          return `<i class="st" style="left:${(i * 37 + 11) % 100}%;top:${(i * 53 + 7) % 62}%;width:${size}px;height:${size}px;animation-delay:${(-(i % 10) * 0.34).toFixed(2)}s;animation-duration:${(2.4 + (i % 5) * 0.5).toFixed(1)}s"></i>`;
        }).join('')}</div>
        <div class="moon"></div>
        <div class="planet"></div>
        <div class="ufo-beam"></div>
        <div class="ufo-ship">${ufoSVG()}</div>
        <div class="ufo-scan"></div>
        <div class="ufo-flash"></div>
        <div class="ufo-hint">Nhấn <b>Bắt đầu</b> để UFO quét lớp học</div>
        <div class="ufo-students"><div class="ufo-class"></div></div>
      </div>`;
    }
    return `<div class="stage duck-stage">
      <div class="scene-sun"></div>
      <div class="scene-cloud c1"></div><div class="scene-cloud c2"></div>
      <div class="duck-skyline"></div>
      <div class="duck-crowd" aria-hidden="true"></div>
      <div class="duck-water"><div class="glow"></div></div>
      <div class="duck-lanes"></div>
      <div class="duck-callout" aria-hidden="true"></div>
      <div class="duck-count"></div>
    </div>`;
  }

  function mount(key, view) {
    destroy();
    currentKey = key;
    document.body.classList.add('game-mode');
    document.body.dataset.game = key;

    const cls = Store.getActiveClass();
    const pool = cls ? cls.students.filter(s => !s.absent) : [];
    view.innerHTML = shell(key, cls, pool.length);

    const layer = view.querySelector('.result-layer');
    const stage = view.querySelector('.stage');
    const startBtn = view.querySelector('[data-start]');
    const soundBtn = view.querySelector('[data-sound]');
    const roundInfo = view.querySelector('[data-round-info]');
    const countEl = view.querySelector('[data-count]');
    const noRepeatEl = view.querySelector('[data-norepeat]');
    const timers = makeTimers();
    let busy = false;
    let lastReset = false;
    let engine = null;

    function updateRoundInfo() {
      if (!cls) { roundInfo.innerHTML = ''; return; }
      const total = pool.length;
      const called = Store.calledCount(cls.id);
      roundInfo.innerHTML = `<span class="dri-pre">Vòng này:</span> <strong>${Math.min(called, total)}/${total}</strong> đã gọi`;
    }

    function updateSoundIcon() {
      soundBtn.innerHTML = icon(Store.settings.sound ? 'i-volume' : 'i-volume-off');
    }

    function hideResult() {
      layer.classList.add('hidden');
      layer.innerHTML = '';
    }

    function showResult(students, resetFlag) {
      busy = false;
      const names = students.map(s => s.name);
      startBtn.disabled = false;
      startBtn.innerHTML = `${icon('i-play')}<span>Chơi lại</span>`;
      const meta = Store.gameLabel(key);
      layer.innerHTML = `<div class="result-card">
        <button class="close-x result-close" type="button" data-close-result aria-label="Đóng">${icon('i-x')}</button>
        <div class="result-badge">${icon('i-sparkles', 'icon xs')} Kết quả gọi tên</div>
        <div class="result-trophy">${key === 'ufo' ? '🛸' : key === 'duck' ? '🏆' : '🦟'}</div>
        <p class="result-kicker">${names.length > 1 ? 'Các bạn được gọi' : 'Học sinh được gọi'}</p>
        <div class="result-names${names.length > 1 ? ' multi' : ''}">${names.map(n => `<span class="result-name">${Utils.esc(n)}</span>`).join('')}</div>
        <div class="result-meta">
          <span class="pill violet">${Utils.esc(cls ? cls.name : '')}</span>
          <span class="pill">${Utils.esc(meta)}</span>
          <span class="pill">${Utils.esc(Utils.fmtTime(Date.now()))}</span>
          ${resetFlag ? '<span class="pill amber">Đã bắt đầu vòng mới</span>' : ''}
        </div>
        <div class="result-actions">
          <button class="btn primary" type="button" data-again>${icon('i-play', 'icon sm')} Gọi tiếp</button>
          <a class="btn" href="#/play">${icon('i-gamepad', 'icon sm')} Đổi trò</a>
          <a class="btn ghost" href="#/dashboard">Về tổng quan</a>
        </div>
        <div class="result-confetti"></div>
      </div>`;
      layer.classList.remove('hidden');
      const confettiBox = layer.querySelector('.result-confetti');
      UI.confetti(confettiBox, students.length > 3 ? 34 : 52);
      Sfx.win();
      const speakText = names.length === 1
        ? `Mời bạn ${names[0]} lên trả bài.`
        : `Mời các bạn ${names.join(', ')} lên trả bài.`;
      timers.add(() => Speech.speak(speakText), 420);

      layer.querySelector('[data-again]').addEventListener('click', () => {
        hideResult();
        startBtn.innerHTML = `${icon('i-play')}<span>Bắt đầu</span>`;
        timers.add(start, 120);
      });
      layer.querySelector('[data-close-result]').addEventListener('click', () => {
        hideResult();
        startBtn.innerHTML = `${icon('i-play')}<span>Bắt đầu</span>`;
        if (engine) engine.idle();
      });
      startBtn.innerHTML = `${icon('i-play')}<span>Chơi lại</span>`;
      updateRoundInfo();
    }

    function start() {
      if (busy || !cls || !pool.length) return;
      UI.closeMenu();
      Sfx.unlock();
      hideResult();
      busy = true;
      startBtn.disabled = true;
      startBtn.innerHTML = `${icon('i-play')}<span>Đang chơi…</span>`;
      const count = key === 'mosquito' ? 1 : Store.settings.count;
      const picked = Store.pickStudents(count, key);
      if (!picked.students.length) {
        busy = false;
        startBtn.disabled = false;
        startBtn.innerHTML = `${icon('i-play')}<span>Bắt đầu</span>`;
        UI.toast('Chưa có bạn nào có mặt để gọi', 'bad');
        return;
      }
      lastReset = picked.reset;
      if (picked.reset) UI.toast('Đã gọi hết lượt — tự động bắt đầu vòng mới', 'info');
      updateRoundInfo();
      if (engine) engine.play(picked.students);
    }

    function initEngine() {
      if (key === 'mosquito') engine = createMosquito(stage, pool, (students) => showResult(students, lastReset));
      else if (key === 'ufo') engine = createUfo(stage, pool, (students) => showResult(students, lastReset));
      else engine = createDuck(stage, pool, (students) => showResult(students, lastReset));
    }

    // ---- events ----
    view.querySelector('[data-back]').addEventListener('click', () => { location.hash = '#/dashboard'; });
    view.querySelector('[data-fullscreen]').addEventListener('click', async () => {
      try {
        const el = view.querySelector('.game');
        if (!document.fullscreenElement) await (el.requestFullscreen ? el.requestFullscreen() : Promise.reject());
        else await document.exitFullscreen();
      } catch (e) { UI.toast('Trình duyệt không cho phép toàn màn hình', 'bad'); }
    });
    soundBtn.addEventListener('click', () => {
      Store.updateSettings({ sound: !Store.settings.sound });
      Sfx.setEnabled(Store.settings.sound);
      updateSoundIcon();
      UI.toast(Store.settings.sound ? 'Đã bật âm thanh' : 'Đã tắt âm thanh', 'info', 1500);
    });

    view.querySelector('[data-minus]').addEventListener('click', () => {
      Store.updateSettings({ count: Utils.clamp(Store.settings.count - 1, 1, 10) });
      countEl.textContent = Store.settings.count;
      Sfx.tick();
    });
    view.querySelector('[data-plus]').addEventListener('click', () => {
      Store.updateSettings({ count: Utils.clamp(Store.settings.count + 1, 1, 10) });
      countEl.textContent = Store.settings.count;
      Sfx.tick();
    });
    noRepeatEl.addEventListener('change', () => {
      Store.updateSettings({ noRepeat: noRepeatEl.checked });
      UI.toast(noRepeatEl.checked ? 'Bật: không gọi trùng trong một vòng' : 'Tắt: có thể gọi trùng', 'info', 1600);
    });
    view.querySelector('[data-reset]').addEventListener('click', async () => {
      if (!cls) return;
      const ok = await UI.confirm({
        title: 'Bắt đầu vòng mới?',
        message: 'Danh sách “đã gọi” của lớp sẽ được xóa. Điểm danh và lịch sử vẫn được giữ lại.',
        confirmText: 'Bắt đầu vòng mới'
      });
      if (!ok) return;
      Store.resetRound(cls.id);
      updateRoundInfo();
      UI.toast('Đã bắt đầu vòng gọi mới', 'good');
      Sfx.pop();
    });

    startBtn.addEventListener('click', start);

    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === 'Escape') {
        if (!layer.classList.contains('hidden')) {
          hideResult();
          startBtn.innerHTML = `${icon('i-play')}<span>Bắt đầu</span>`;
          if (engine) engine.idle();
        }
      }
      if (e.code === 'Space' && layer.classList.contains('hidden')) {
        e.preventDefault();
        if (key === 'mosquito' && busy) {
          stage.click();
        } else if (!busy) {
          start();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const onResize = Utils.debounce(() => { if (engine) engine.resize(); }, 180);
    window.addEventListener('resize', onResize);
    const onFsChange = () => { onResize(); };
    document.addEventListener('fullscreenchange', onFsChange);

    initEngine();
    updateRoundInfo();
    startBtn.innerHTML = `${icon('i-play')}<span>Bắt đầu</span>`;
    soundBtn.innerHTML = icon(Store.settings.sound ? 'i-volume' : 'i-volume-off');
    if (key === 'mosquito') startBtn.innerHTML = `${icon('i-play')}<span>Bắt đầu</span>`;

    activeStop = () => {
      timers.clear();
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onFsChange);
      if (engine) engine.stop();
      Speech.stop();
      Sfx.buzzStop();
    };
  }

  function destroy() {
    if (activeStop) { try { activeStop(); } catch (e) { /* ignore */ } activeStop = null; }
    Sfx.buzzStop();
    Speech.stop();
    document.body.classList.remove('game-mode');
    delete document.body.dataset.game;
    currentKey = null;
  }

  return { mount, destroy, META, get current() { return currentKey; }, stageHTML, duckSVG, kidSVG, swatSVG };
})();
