/* ==========================================================
   LỚP HỌC VUI — App shell, router, dashboard, quick picker
   ========================================================== */
'use strict';

const App = (() => {
  const icon = (name, cls = 'icon') => `<svg class="${cls}"><use href="#${name}"/></svg>`;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const GAME_ROUTES = ['mosquito', 'ufo', 'duck'];
  const TITLES = {
    dashboard: ['Tổng quan', 'Chào mừng đến với lớp học vui vẻ'],
    classes: ['Lớp & Học sinh', 'Quản lý danh sách, điểm danh và nhập từ tệp'],
    play: ['Phòng chơi', 'Chọn một mini game để gọi học sinh trả bài'],
    history: ['Lịch sử gọi', 'Xem lại những bạn đã được gọi và thời gian gọi'],
    settings: ['Cài đặt', 'Tùy chỉnh âm thanh, cách gọi và dữ liệu'],
    mosquito: ['Đập Muỗi Gọi Tên', 'Đập muỗi để gọi học sinh trả bài'],
    ufo: ['UFO Gọi Tên', 'UFO quét lớp và bắt lấy bạn may mắn'],
    duck: ['Đua Vịt', 'Chú vịt về đích đầu tiên sẽ được gọi tên']
  };

  const gameEmoji = (g) => ({ mosquito: '🦟', ufo: '🛸', duck: '🦆', quick: '🎲' }[g] || '🎲');

  /* ---------------- theme & shell ---------------- */
  function applyTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f2f4ff' : '#080b18');
    const btn = $('#themeBtn');
    if (btn) btn.innerHTML = icon(t === 'dark' ? 'i-sun' : 'i-moon');
  }

  function updateShell() {
    const cls = Store.getActiveClass();
    const chipName = $('#chipClassName');
    const chipAvatar = $('#chipAvatar');
    const topLabel = $('#topClassLabel');
    if (chipName) chipName.textContent = cls ? cls.name : 'Chưa có lớp';
    if (topLabel) topLabel.textContent = cls ? cls.name : 'Chọn lớp';
    if (chipAvatar) {
      chipAvatar.textContent = cls ? Utils.initials(cls.name) : '?';
      chipAvatar.setAttribute('style', cls ? Utils.avatarStyle(cls.name) : '');
    }
    const soundBtn = $('#soundBtn');
    if (soundBtn) soundBtn.innerHTML = icon(Store.settings.sound ? 'i-volume' : 'i-volume-off');
    applyTheme(Store.settings.theme);
  }

  /* ---------------- router ---------------- */
  function currentRoute() {
    const raw = (location.hash || '').replace(/^#\/?/, '').split('?')[0].trim();
    if (!raw) return 'dashboard';
    return raw;
  }

  function isGame(route) { return GAME_ROUTES.includes(route); }

  function renderRoute(keepScroll = false) {
    const route = currentRoute();
    const known = ['dashboard', 'classes', 'play', 'history', 'settings', ...GAME_ROUTES];
    if (!known.includes(route)) {
      location.hash = '#/dashboard';
      return;
    }

    Games.destroy();
    UI.closeMenu();
    UI.closeModal();
    document.getElementById('app').classList.remove('nav-open');

    const view = $('#view');
    document.body.dataset.route = route;
    const inGame = isGame(route);

    // nav active states
    $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.route === route));
    $$('.bottom-nav a').forEach(el => el.classList.toggle('active', el.dataset.route === route));

    // headings
    let title = TITLES[route] ? TITLES[route][0] : 'Lớp Học Vui';
    let sub = TITLES[route] ? TITLES[route][1] : '';
    const cls = Store.getActiveClass();
    if (inGame) {
      sub = cls ? `${cls.name} · ${cls.students.filter(s => !s.absent).length} bạn sẵn sàng` : 'Chưa có lớp học';
    }
    if (route === 'dashboard') {
      sub = `${Utils.greeting()}, chúc thầy/cô một ngày dạy học vui vẻ`;
    }
    if (route === 'classes') {
      sub = cls ? `${Store.classes.length} lớp · đang dùng ${cls.name}` : 'Tạo lớp và thêm học sinh để bắt đầu';
    }
    const pageTitle = $('#pageTitle');
    const pageSub = $('#pageSub');
    if (pageTitle) pageTitle.textContent = title;
    if (pageSub) pageSub.textContent = sub;
    document.title = title + ' · Lớp Học Vui';

    // render
    if (route === 'dashboard') renderDashboard(view);
    else if (route === 'classes') Manage.renderClasses(view);
    else if (route === 'play') renderPlay(view);
    else if (route === 'history') Manage.renderHistory(view);
    else if (route === 'settings') Manage.renderSettings(view);
    else if (inGame) Games.mount(route, view);

    updateShell();
    if (!keepScroll) view.scrollTop = 0;
  }

  function refresh(keepScroll = true) {
    renderRoute(keepScroll);
  }

  /* ---------------- dashboard ---------------- */
  function gameArt(key) {
    if (key === 'mosquito') {
      const bug = `<svg viewBox="0 0 60 40" aria-hidden="true">
        <ellipse cx="30" cy="23" rx="13" ry="6.6" fill="#333647"/>
        <circle cx="44" cy="21" r="5" fill="#252836"/>
        <path d="M48 20l9-4M48 22l9 4" stroke="#252836" stroke-width="1.4" stroke-linecap="round"/>
        <ellipse class="wing" cx="25" cy="12" rx="11" ry="5.5" fill="rgba(235,248,255,.9)" stroke="rgba(120,130,160,.6)" stroke-width="1"/>
        <ellipse class="wing" cx="36" cy="12" rx="11" ry="5.5" fill="rgba(235,248,255,.75)" stroke="rgba(120,130,160,.5)" stroke-width="1"/>
        <path d="M25 28l-5 8M31 29l-2 9M38 28l4 8M20 22l-8 4M20 25l-9 8" stroke="#252836" stroke-width="1.2" stroke-linecap="round"/>
      </svg>`;
      return `<div class="gc-art art-mq"><div class="art-scene">
        <div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div>
        <div class="hill h1"></div><div class="hill h2"></div>
        <div class="school"></div>
        <div class="mg m1">${bug}</div><div class="mg m2">${bug}</div><div class="mg m3">${bug}</div>
      </div></div>`;
    }
    if (key === 'ufo') {
      return `<div class="gc-art art-ufo"><div class="art-scene">
        <i class="star s1"></i><i class="star s2"></i><i class="star s3"></i><i class="star s4"></i><i class="star s5"></i>
        <div class="planet"></div><div class="beam"></div>
        <svg class="ship" viewBox="0 0 120 72" aria-hidden="true">
          <ellipse cx="60" cy="58" rx="44" ry="8" fill="rgba(124,247,255,.22)"/>
          <ellipse cx="60" cy="42" rx="48" ry="10" fill="#5a6ee0"/>
          <ellipse cx="60" cy="38" rx="45" ry="8" fill="#c9d6ff"/>
          <path d="M30 36a30 25 0 0 1 60 0z" fill="rgba(124,247,255,.6)" stroke="rgba(255,255,255,.8)" stroke-width="1.6"/>
          <circle cx="25" cy="40" r="2.4" fill="#7cf7ff"/><circle cx="42" cy="43" r="2.4" fill="#7cf7ff"/>
          <circle cx="78" cy="43" r="2.4" fill="#ff8fc4"/><circle cx="95" cy="40" r="2.4" fill="#7cf7ff"/>
        </svg>
      </div></div>`;
    }
    return `<div class="gc-art art-duck"><div class="art-scene">
      <div class="sun"></div><div class="cloud"></div>
      <div class="wave w1"></div><div class="wave w2"></div>
      <div class="finish"></div>
      <div class="duck small">${Games.duckSVG('#fff2c2')}</div>
      <div class="duck">${Games.duckSVG('#ffd166')}</div>
    </div></div>`;
  }

  function gameCard(key) {
    const m = Games.META[key];
    const count = key === 'mosquito' ? '1 bạn / lượt' : '1–10 bạn / lượt';
    return `<a class="game-card" href="#/${key}">
      ${gameArt(key)}
      <div class="gc-body">
        <div class="gc-title-row"><h3>${m.title}</h3><span class="pill ${key === 'mosquito' ? 'green' : key === 'ufo' ? 'cyan' : 'amber'}">Nổi bật</span></div>
        <p>${m.desc}</p>
        <div class="gc-tags"><span class="gc-tag">${count}</span><span class="gc-tag">${key === 'mosquito' ? 'Phản xạ nhanh' : key === 'ufo' ? 'Hiệu ứng không gian' : 'Đua tốc độ'}</span></div>
        <div class="gc-foot">
          <span class="pill">${icon('i-play', 'icon xs')} Chơi ngay</span>
          <span class="spacer"></span>
          <span class="gc-play">${icon('i-arrow-right')}</span>
        </div>
      </div>
    </a>`;
  }

  function renderDashboard(view) {
    const cls = Store.getActiveClass();
    const students = cls ? cls.students : [];
    const present = students.filter(s => !s.absent);
    const absent = students.length - present.length;
    const called = cls ? Store.calledCount(cls.id) : 0;
    const history = Store.state.history;
    const today = Utils.dayKey(Date.now());
    const todayCalls = history.filter(h => Utils.dayKey(h.at) === today).length;

    let hero;
    if (!cls) {
      hero = `<section class="hero no-class">
        <div class="hero-copy">
          <span class="hero-badge">${icon('i-sparkles', 'icon xs')} Super App lớp học</span>
          <h2>Bắt đầu lớp học đầu tiên<br><em>thật dễ dàng!</em></h2>
          <p>Tạo lớp, nhập danh sách học sinh từ tệp TXT / CSV rồi gọi tên bằng 3 mini game: Đập Muỗi, UFO và Đua Vịt. Mọi thứ được lưu ngay trên trình duyệt của bạn.</p>
          <div class="hero-actions">
            <button class="btn primary lg" type="button" data-create-class>${icon('i-plus')} Tạo lớp học</button>
            <button class="btn ghost lg" type="button" data-import>${icon('i-upload')} Nhập từ tệp</button>
            <button class="btn ghost lg" type="button" data-sample>Dùng dữ liệu mẫu</button>
          </div>
          <div class="hero-meta">
            <span><span class="dot"></span> Không cần đăng nhập</span>
            <span>${icon('i-book', 'icon xs')} Hoạt động offline</span>
            <span>${icon('i-users', 'icon xs')} Quản lý nhiều lớp</span>
          </div>
        </div>
      </section>`;
    } else {
      const showcase = Utils.sample(present, Math.min(2, present.length));
      const pct = students.length ? Math.round(present.length / students.length * 100) : 0;
      hero = `<section class="hero">
        <div class="hero-copy">
          <span class="hero-badge">${icon('i-sparkles', 'icon xs')} ${Utils.longDate()}</span>
          <h2>Hôm nay, gọi ai<br><em>lên trả bài?</em></h2>
          <p><b>${Utils.esc(cls.name)}</b> đang có <b>${present.length}</b> bạn sẵn sàng. Chọn một mini game hoặc để hệ thống gọi ngẫu nhiên thật công bằng.</p>
          <div class="hero-actions">
            <button class="btn primary lg" type="button" data-quick>${icon('i-shuffle')} Gọi ngẫu nhiên</button>
            <a class="btn ghost lg" href="#/play">${icon('i-gamepad')} Vào phòng chơi</a>
          </div>
          <div class="hero-meta">
            <span><span class="dot"></span> ${present.length}/${students.length} bạn có mặt</span>
            <span>${icon('i-clock', 'icon xs')} Vòng này đã gọi ${Math.min(called, present.length)} bạn</span>
          </div>
        </div>
        <div class="hero-art">
          <div class="hero-orb"></div>
          <span class="float-chip">${pct}% lớp có mặt</span>
          ${showcase[0] ? `<div class="float-card fc1"><span class="avatar" style="${Utils.avatarStyle(showcase[0].name)}">${Utils.initials(showcase[0].name)}</span><span class="fc-copy"><small>Học sinh</small><strong>${Utils.esc(showcase[0].name)}</strong></span></div>` : ''}
          ${showcase[1] ? `<div class="float-card fc2"><span class="avatar" style="${Utils.avatarStyle(showcase[1].name)}">${Utils.initials(showcase[1].name)}</span><span class="fc-copy"><small>Có mặt</small><strong>${Utils.esc(showcase[1].name)}</strong></span></div>` : ''}
          <div class="float-card fc3"><span style="font-size:20px">🦆</span><span class="fc-copy"><small>Mini game</small><strong>Đua Vịt</strong></span></div>
        </div>
      </section>`;
    }

    const stats = `<div class="stat-grid">
      <div class="stat-card"><span class="stat-ico violet">${icon('i-users')}</span><div class="stat-copy"><strong>${students.length}</strong><span>Học sinh trong lớp</span></div></div>
      <div class="stat-card"><span class="stat-ico green">${icon('i-check')}</span><div class="stat-copy"><strong>${present.length}</strong><span>Có mặt hôm nay</span></div></div>
      <div class="stat-card"><span class="stat-ico amber">${icon('i-user-x')}</span><div class="stat-copy"><strong>${absent}</strong><span>Đang đánh dấu vắng</span></div></div>
      <div class="stat-card"><span class="stat-ico cyan">${icon('i-shuffle')}</span><div class="stat-copy"><strong>${todayCalls}</strong><span>Lượt gọi hôm nay</span></div></div>
    </div>`;

    const welcome = !cls ? `<div class="welcome-grid">
      <div class="welcome-card">
        <span class="wc-ico">${icon('i-plus')}</span>
        <h4>Tạo lớp mới</h4>
        <p>Đặt tên lớp, sau đó thêm học sinh bằng ô nhập nhanh hoặc nhập cả danh sách.</p>
        <button class="btn soft sm" type="button" data-create-class>${icon('i-plus', 'icon sm')} Tạo lớp</button>
      </div>
      <div class="welcome-card">
        <span class="wc-ico">${icon('i-upload')}</span>
        <h4>Nhập danh sách từ tệp</h4>
        <p>Hỗ trợ TXT, CSV UTF-8. Mỗi dòng một tên, có thể ghi “, nữ” để đánh dấu giới tính.</p>
        <button class="btn soft sm" type="button" data-import>${icon('i-upload', 'icon sm')} Chọn tệp</button>
      </div>
      <div class="welcome-card">
        <span class="wc-ico">${icon('i-wand')}</span>
        <h4>Trải nghiệm ngay</h4>
        <p>Thêm lớp 8A với 32 học sinh mẫu để thử cả 3 mini game và toàn bộ tính năng.</p>
        <button class="btn soft sm" type="button" data-sample>Dùng dữ liệu mẫu</button>
      </div>
    </div>` : '';

    let lower = '';
    if (cls) {
      const pct = students.length ? Math.round(present.length / students.length * 100) : 0;
      const recent = history.slice(0, 5);
      lower = `<div class="dash-grid">
        <section class="panel class-snapshot">
          <div class="panel-head">
            <h3>Lớp đang dùng</h3>
            <a class="btn ghost sm" href="#/classes">Quản lý ${icon('i-arrow-right', 'icon xs')}</a>
          </div>
          <div class="cs-body">
            <div class="ring-wrap">
              <div class="ring" style="--p:${pct}"></div>
              <div class="ring-val"><strong>${present.length}</strong><small>Có mặt</small></div>
            </div>
            <div class="cs-info">
              <h3>${Utils.esc(cls.name)}</h3>
              <div class="cs-meta">
                <span class="pill violet">${students.length} học sinh</span>
                <span class="pill green">${present.length} có mặt</span>
                ${absent ? `<span class="pill red">${absent} vắng</span>` : ''}
              </div>
              <div class="cs-list">
                ${students.slice(0, 5).map(s => `<div class="cs-student ${s.absent ? 'absent' : ''}"><span class="s-dot"></span><span>${Utils.esc(s.name)}</span></div>`).join('')}
                ${students.length > 5 ? `<div class="cs-student"><span class="s-dot" style="background:var(--faint)"></span><span>và ${students.length - 5} bạn khác…</span></div>` : ''}
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h3>Hoạt động gần đây</h3>
            <a class="btn ghost sm" href="#/history">Tất cả ${icon('i-arrow-right', 'icon xs')}</a>
          </div>
          ${recent.length ? `<div class="recent-list">
            ${recent.map(h => `<div class="recent-item">
              <span class="recent-ico ${h.game}">${gameEmoji(h.game)}</span>
              <div class="recent-copy"><strong>${Utils.esc(h.names.join(', '))}</strong><small>${Utils.esc(Store.gameLabel(h.game))} · ${Utils.esc(h.className)}</small></div>
              <span class="recent-time">${Utils.fmtTime(h.at)}</span>
            </div>`).join('')}
          </div>` : `<div class="empty compact"><div class="bubble">🎈</div><h4>Chưa có lượt gọi nào</h4><p>Thử “Gọi ngẫu nhiên” hoặc vào một mini game để bắt đầu.</p></div>`}
        </section>
      </div>`;
    }

    view.innerHTML = `<div class="dash">
      ${hero}
      ${welcome}
      ${cls ? stats : ''}
      <div class="section-head">
        <div><h2>Mini game gọi tên</h2><p>Ba cách gọi học sinh thật vui, phù hợp mọi lớp học</p></div>
        <span class="spacer"></span>
        <a class="btn ghost sm" href="#/play">Xem tất cả ${icon('i-arrow-right', 'icon xs')}</a>
      </div>
      <div class="game-grid">${gameCard('mosquito')}${gameCard('ufo')}${gameCard('duck')}</div>
      ${lower}
    </div>`;

    view.querySelectorAll('[data-create-class]').forEach(b => b.addEventListener('click', () => Manage.openClassForm()));
    view.querySelectorAll('[data-import]').forEach(b => b.addEventListener('click', () => Manage.openImport()));
    view.querySelectorAll('[data-sample]').forEach(b => b.addEventListener('click', useSample));
    view.querySelectorAll('[data-quick]').forEach(b => b.addEventListener('click', openQuickPick));
  }

  function useSample() {
    Store.loadSample();
    updateShell();
    refresh(false);
    UI.toast('Đã thêm lớp mẫu 8A với 32 học sinh', 'good');
  }

  /* ---------------- play hub ---------------- */
  function renderPlay(view) {
    const cls = Store.getActiveClass();
    const present = cls ? cls.students.filter(s => !s.absent).length : 0;
    const called = cls ? Store.calledCount(cls.id) : 0;
    view.innerHTML = `<div class="play-page">
      <div class="play-banner">
        <div>
          <span class="eyebrow">${icon('i-gamepad', 'icon xs')} Phòng chơi</span>
          <h2>Chọn một trò chơi<br><em>và gọi tên thôi!</em></h2>
          <p>${cls ? `<b>${Utils.esc(cls.name)}</b> · ${present} bạn sẵn sàng · ${Math.min(called, present)} bạn đã gọi trong vòng này.` : 'Bạn chưa có lớp học. Hãy tạo lớp và thêm học sinh để bắt đầu.'}</p>
          <div class="row wrap" style="margin-top:14px">
            ${cls ? `<a class="btn primary" href="#/mosquito">${icon('i-play', 'icon sm')} Chơi Đập Muỗi</a>
              <a class="btn soft" href="#/classes">${icon('i-users', 'icon sm')} Điểm danh</a>`
        : `<button class="btn primary" type="button" data-create-class>${icon('i-plus', 'icon sm')} Tạo lớp học</button>
               <button class="btn ghost" type="button" data-sample>Dùng dữ liệu mẫu</button>`}
          </div>
        </div>
        <div class="pb-art">🦟<span>🛸</span>🦆</div>
      </div>
      <div class="section-head"><div><h2>3 mini game</h2><p>Mỗi trò có cách chơi và hiệu ứng riêng, đều đảm bảo gọi ngẫu nhiên công bằng</p></div></div>
      <div class="game-grid">${gameCard('mosquito')}${gameCard('ufo')}${gameCard('duck')}</div>
      <div class="dash-grid">
        <section class="panel panel-pad">
          <h3 style="font-family:var(--font-display);font-size:18px;margin-bottom:8px">Mẹo dùng nhanh cho lớp đông</h3>
          <ul class="tips-list">
            <li><b>Không gọi trùng:</b> bật sẵn trong mini game để mỗi bạn chỉ bị gọi một lần trong vòng.</li>
            <li><b>Điểm danh trước:</b> đánh dấu bạn vắng trong “Lớp & Học sinh” để không gọi nhầm.</li>
            <li><b>Gọi nhiều bạn:</b> tăng “Số bạn gọi” lên tới 10 ở UFO hoặc Đua Vịt cho hoạt động nhóm.</li>
            <li><b>Máy chiếu:</b> bấm nút toàn màn hình trong game để cả lớp cùng theo dõi.</li>
          </ul>
        </section>
        <section class="panel panel-pad">
          <h3 style="font-family:var(--font-display);font-size:18px;margin-bottom:8px">Vòng gọi hiện tại</h3>
          <p class="muted" style="font-size:12.5px">${cls ? `Đã gọi <b>${Math.min(called, present)}</b> trên <b>${present}</b> bạn có mặt trong lớp ${Utils.esc(cls.name)}.` : 'Chưa có dữ liệu lớp học.'}</p>
          <div class="round-bar"><span style="width:${present ? Math.min(100, called / present * 100) : 0}%"></span></div>
          <div class="row wrap" style="margin-top:14px">
            <a class="btn sm" href="#/history">${icon('i-history', 'icon sm')} Lịch sử</a>
            <a class="btn sm ghost" href="#/settings">${icon('i-settings', 'icon sm')} Cài đặt</a>
          </div>
        </section>
      </div>
    </div>`;
    view.querySelectorAll('[data-create-class]').forEach(b => b.addEventListener('click', () => Manage.openClassForm()));
    view.querySelectorAll('[data-sample]').forEach(b => b.addEventListener('click', useSample));
  }

  /* ---------------- quick picker ---------------- */
  function openQuickPick() {
    const cls = Store.getActiveClass();
    if (!cls) {
      UI.toast('Hãy tạo lớp và thêm học sinh trước', 'bad');
      return;
    }
    const present = cls.students.filter(s => !s.absent);
    if (!present.length) {
      UI.toast('Cả lớp đang được đánh dấu vắng', 'bad');
      return;
    }
    Sfx.unlock();
    let alive = true;
    let rollTimer = null;
    let revealTimer = null;
    let rolling = false;
    let picked = null;

    const close = UI.modal({
      bare: true,
      className: 'quick-modal',
      title: 'Gọi ngẫu nhiên',
      body: `<div class="qp-card">
        <div class="qp-top">
          <span class="pill">${icon('i-users', 'icon xs')} ${Utils.esc(cls.name)}</span>
          <span class="pill" data-qp-remain>${present.length} bạn sẵn sàng</span>
          <button class="qp-close" type="button" data-qp-close aria-label="Đóng">${icon('i-x')}</button>
        </div>
        <div class="qp-stage">
          <div class="qp-orbit"></div>
          <div class="qp-label" data-qp-label>Đang chọn bạn may mắn</div>
          <div class="qp-name rolling" data-qp-name>Chuẩn bị…</div>
          <div class="qp-sub" data-qp-sub>Danh sách lớp đang được xáo trộn</div>
          <div class="qp-confetti"></div>
        </div>
        <div class="qp-actions">
          <button class="btn primary" type="button" data-qp-again>${icon('i-shuffle', 'icon sm')} Gọi bạn khác</button>
          <button class="btn" type="button" data-qp-close>Đóng</button>
        </div>
      </div>`,
      onMount(back, closeModal) {
        const nameEl = back.querySelector('[data-qp-name]');
        const labelEl = back.querySelector('[data-qp-label]');
        const subEl = back.querySelector('[data-qp-sub]');
        const remainEl = back.querySelector('[data-qp-remain]');
        const againBtn = back.querySelector('[data-qp-again]');
        const confettiBox = back.querySelector('.qp-confetti');

        function updateRemain() {
          const called = Store.calledCount(cls.id);
          const left = Math.max(0, present.length - Math.min(called, present.length));
          remainEl.textContent = `${left} bạn chưa gọi trong vòng`;
        }

        function roll() {
          if (rolling || !alive) return;
          rolling = true;
          picked = null;
          againBtn.disabled = true;
          nameEl.classList.remove('reveal');
          nameEl.classList.add('rolling');
          labelEl.textContent = 'Đang chọn bạn may mắn';
          subEl.textContent = 'Danh sách lớp đang được xáo trộn…';
          confettiBox.innerHTML = '';
          let i = Utils.randInt(0, present.length - 1);
          nameEl.textContent = present[i].name;
          rollTimer = setInterval(() => {
            i = (i + Utils.randInt(1, 4)) % present.length;
            nameEl.textContent = present[i].name;
            Sfx.tick();
          }, 75);
          revealTimer = setTimeout(() => {
            if (!alive) return;
            clearInterval(rollTimer);
            const res = Store.pickStudents(1, 'quick');
            if (!res.students.length) {
              rolling = false;
              againBtn.disabled = false;
              nameEl.textContent = 'Không còn bạn nào';
              subEl.textContent = 'Hãy kiểm tra điểm danh của lớp.';
              return;
            }
            picked = res.students[0];
            nameEl.textContent = picked.name;
            nameEl.classList.remove('rolling');
            nameEl.classList.add('reveal');
            labelEl.textContent = 'Học sinh được gọi';
            subEl.textContent = `${cls.name} · ${res.reset ? 'Đã bắt đầu vòng mới' : 'Chúc bạn trả bài thật tốt!'}`;
            UI.confetti(confettiBox, 54);
            Sfx.win();
            Speech.speak(`Mời bạn ${picked.name} lên trả bài.`);
            rolling = false;
            againBtn.disabled = false;
            againBtn.innerHTML = `${icon('i-play', 'icon sm')} Gọi tiếp`;
            updateRemain();
          }, 1600);
        }

        roll();
        againBtn.addEventListener('click', roll);
        back.querySelectorAll('[data-qp-close]').forEach(b => b.addEventListener('click', () => { alive = false; closeModal(); }));

        // Cho phép đóng bằng phím Esc qua UI.modal, dọn timer
        back.addEventListener('click', (e) => {
          if (e.target === back) { alive = false; }
        });
      },
      onClose() {
        alive = false;
        clearInterval(rollTimer);
        clearTimeout(revealTimer);
        Speech.stop();
      }
    });
    void close;
  }

  /* ---------------- class picker ---------------- */
  function openClassPicker() {
    const classes = Store.classes;
    const active = Store.getActiveClass();
    UI.modal({
      title: 'Lớp đang dùng',
      subtitle: 'Chọn lớp để gọi tên, điểm danh và xem lịch sử riêng.',
      size: 'slim',
      body: classes.length ? `<div class="picker-list">
        ${classes.map(c => {
          const present = c.students.filter(s => !s.absent).length;
          return `<button class="class-item ${active && c.id === active.id ? 'active' : ''}" type="button" data-pick-class="${c.id}">
            <span class="avatar sm" style="${Utils.avatarStyle(c.name)}">${Utils.initials(c.name)}</span>
            <span class="ci-copy"><strong>${Utils.esc(c.name)}</strong><small>${c.students.length} học sinh · ${present} có mặt</small></span>
            ${active && c.id === active.id ? `<span class="pill green">${icon('i-check', 'icon xs')} Đang dùng</span>` : `<span class="ci-count">${c.students.length}</span>`}
          </button>`;
        }).join('')}
      </div>` : UI.empty('🏫', 'Chưa có lớp nào', 'Tạo lớp đầu tiên để bắt đầu gọi học sinh trả bài.'),
      footer: `<button class="btn ghost sm" type="button" data-manage>${icon('i-settings', 'icon sm')} Quản lý lớp</button>
        <div class="spacer"></div>
        <button class="btn primary sm" type="button" data-new-class>${icon('i-plus', 'icon sm')} Tạo lớp mới</button>`,
      onMount(back, close) {
        back.querySelectorAll('[data-pick-class]').forEach(b => {
          b.addEventListener('click', () => {
            Store.setActiveClass(b.dataset.pickClass);
            updateShell();
            close();
            refresh(false);
            const c = Store.getActiveClass();
            if (c) UI.toast('Đang dùng lớp ' + c.name, 'good', 1600);
          });
        });
        back.querySelector('[data-manage]').addEventListener('click', () => {
          close();
          location.hash = '#/classes';
        });
        back.querySelector('[data-new-class]').addEventListener('click', () => {
          close();
          setTimeout(() => Manage.openClassForm(), 80);
        });
      }
    });
  }

  /* ---------------- boot ---------------- */
  function bindShell() {
    const app = document.getElementById('app');
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => app.classList.toggle('nav-open'));
    }
    document.addEventListener('click', (e) => {
      if (!app.classList.contains('nav-open')) return;
      const sidebar = document.getElementById('sidebar');
      if (sidebar.contains(e.target) || (menuBtn && menuBtn.contains(e.target))) return;
      app.classList.remove('nav-open');
    });
    $$('.nav-item, .bottom-nav a').forEach(a => a.addEventListener('click', () => app.classList.remove('nav-open')));

    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = Store.settings.theme === 'dark' ? 'light' : 'dark';
        Store.updateSettings({ theme: next });
        applyTheme(next);
        Sfx.tick();
        UI.toast(next === 'dark' ? 'Đã chuyển sang giao diện tối' : 'Đã chuyển sang giao diện sáng', 'info', 1500);
      });
    }

    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const on = !Store.settings.sound;
        Store.updateSettings({ sound: on });
        Sfx.setEnabled(on);
        updateShell();
        Sfx.tick();
        UI.toast(on ? 'Đã bật âm thanh' : 'Đã tắt âm thanh', 'info', 1500);
      });
    }

    document.getElementById('quickPickBtn').addEventListener('click', openQuickPick);
    document.getElementById('topClassSwitch').addEventListener('click', openClassPicker);
    document.getElementById('sidebarClassChip').addEventListener('click', openClassPicker);

    window.addEventListener('hashchange', () => renderRoute(false));
    window.addEventListener('beforeunload', () => Speech.stop());
    document.addEventListener('visibilitychange', () => { if (document.hidden) { Speech.stop(); Sfx.buzzStop(); } });

    // Cho phép mở nhanh bằng bàn phím: G = gọi ngẫu nhiên
    document.addEventListener('keydown', (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (document.querySelector('.modal-backdrop')) return;
      if ((e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!document.body.classList.contains('game-mode')) {
          e.preventDefault();
          openQuickPick();
        }
      }
    });
  }

  function init() {
    applyTheme(Store.settings.theme);
    Sfx.setEnabled(Store.settings.sound);
    bindShell();
    if (!location.hash) {
      try { history.replaceState(null, '', '#/dashboard'); } catch (e) { location.hash = '#/dashboard'; }
    }
    renderRoute(false);
    // Hiển thị gợi ý nhỏ trong lần đầu sử dụng
    if (!Store.classes.length && !localStorage.getItem('lophocvui_seen')) {
      try { localStorage.setItem('lophocvui_seen', '1'); } catch (e) { /* ignore */ }
    }
  }

  return {
    init, applyTheme, updateShell, refresh, openQuickPick, openClassPicker,
    renderRoute, currentRoute, isGame
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
