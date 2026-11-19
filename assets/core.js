/* ==========================================================
   LỚP HỌC VUI — Core: utils, store, sound, speech, UI
   ========================================================== */
'use strict';

/* ---------------- Utils ---------------- */
const Utils = (() => {
  const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const normalizeName = (s) => String(s || '').trim().replace(/\s+/g, ' ');

  const stripDiacritics = (s) => String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');

  const initials = (name) => {
    const w = normalizeName(name).split(' ').filter(Boolean);
    if (!w.length) return '?';
    if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
    return (w[0][0] + w[w.length - 1][0]).toUpperCase();
  };

  const AVATAR_PALETTE = [
    ['#8b6bff', '#ff5c9d'], ['#35d6e8', '#3b82f6'], ['#ffb020', '#ff6b6b'],
    ['#36d399', '#0ea5e9'], ['#f472b6', '#a855f7'], ['#60a5fa', '#8b5cf6'],
    ['#f59e0b', '#ef4444'], ['#14b8a6', '#22c55e'], ['#e879f9', '#6366f1'],
    ['#fb923c', '#f43f5e']
  ];
  const avatarStyle = (name) => {
    let h = 0;
    for (let i = 0; i < String(name).length; i++) h = (h * 31 + String(name).charCodeAt(i)) >>> 0;
    const [a, b] = AVATAR_PALETTE[h % AVATAR_PALETTE.length];
    return `background:linear-gradient(135deg,${a},${b})`;
  };

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtTime = (ts) => { const d = new Date(ts); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
  const fmtDate = (ts) => { const d = new Date(ts); return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear(); };
  const dayKey = (ts) => { const d = new Date(ts); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  const dayLabel = (ts) => {
    const now = new Date();
    const d = new Date(ts);
    const key = dayKey(ts);
    if (key === dayKey(now.getTime())) return 'Hôm nay';
    const y = new Date(now.getTime() - 86400000);
    if (key === dayKey(y.getTime())) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return 'Chào buổi sáng';
    if (h < 14) return 'Chào buổi trưa';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };
  const longDate = () => new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const download = (filename, content, mime = 'text/plain;charset=utf-8') => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  };

  const csvCell = (v) => {
    const s = String(v == null ? '' : v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const toCSV = (rows) => '\uFEFF' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');

  const splitCSVLine = (line) => {
    const out = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',' || ch === ';' || ch === '\t') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };

  const isHeaderLine = (line) => {
    const l = stripDiacritics(line).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    return /^(stt |tt |so thu tu |)?(ho va ten|ho ten|ten hoc sinh|ten|name|student)( |$)/.test(l) && /(ten|name|student)/.test(l);
  };

  const parseGender = (s) => {
    const t = stripDiacritics(s).toLowerCase().trim();
    if (/^(nu|female|f|gai|nữ)$/.test(t) || /\bnu\b/.test(t)) return 'female';
    return 'male';
  };

  const headerCols = (line) => {
    const cells = splitCSVLine(line);
    const key = (c) => stripDiacritics(c).toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      nameIdx: cells.findIndex(c => /^(hovaten|hoten|tenhocsinh|ten|name|student|studentname)$/.test(key(c))),
      genderIdx: cells.findIndex(c => /^(gioitinh|phai|gender|sex)$/.test(key(c)))
    };
  };

  const parseStudentText = (text) => {
    const lines = String(text || '').split(/\r?\n/);
    const out = [];
    const seen = new Set();
    let cols = null;
    for (let raw of lines) {
      let line = raw.trim();
      if (!line) continue;
      if (isHeaderLine(line)) { cols = headerCols(line); continue; }
      // Bỏ số thứ tự đầu dòng: "1. ", "12) ", "3 - "
      line = line.replace(/^\s*\d{1,3}\s*[.)\-:]\s+/, '').trim();
      if (!line) continue;
      const cells = splitCSVLine(line).map(c => c.trim().replace(/^"|"$/g, ''));
      let name = cols && cols.nameIdx >= 0 ? (cells[cols.nameIdx] || '') : (cells[0] || '');
      // CSV không có tiêu đề nhưng cột đầu là số thứ tự
      if (!cols && cells.length > 1 && /^\d{1,3}$/.test(cells[0]) && /[a-zA-Z\u00C0-\u1EF9]/.test(cells[1])) {
        name = cells[1];
      }
      let gender = 'male';
      const genderCells = cols && cols.genderIdx >= 0 ? [cells[cols.genderIdx] || ''] : cells.slice(1);
      for (const c of genderCells) {
        if (!c) continue;
        if (/(nu|nữ|female|f|gai|gái)/i.test(stripDiacritics(c).trim())) gender = 'female';
      }
      name = normalizeName(name).replace(/^["']|["']$/g, '');
      if (!name || name.length > 80) continue;
      if (/^(gioi tinh|gender|trang thai|status|stt)$/i.test(stripDiacritics(name))) continue;
      const key = stripDiacritics(name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name, gender });
    }
    return out;
  };

  const fileExt = (name) => (String(name).split('.').pop() || '').toLowerCase();

  const readFileText = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsText(file, 'UTF-8');
  });

  return {
    uid, esc, normalizeName, stripDiacritics, initials, avatarStyle,
    shuffle, randInt, sample, clamp, pad2,
    fmtTime, fmtDate, dayKey, dayLabel, greeting, longDate, debounce,
    download, toCSV, parseStudentText, parseGender, fileExt, readFileText, splitCSVLine
  };
})();

/* ---------------- Store ---------------- */
const DEFAULT_SETTINGS = {
  sound: true,
  voice: true,
  volume: 0.6,
  count: 1,
  noRepeat: true,
  speed: 'normal', // fast | normal | slow
  theme: 'dark'
};

const Store = (() => {
  const KEY = 'lophocvui_v1';

  const emptyState = () => ({
    version: 1,
    classes: [],
    activeClassId: null,
    history: [],
    rounds: {},
    settings: { ...DEFAULT_SETTINGS }
  });

  let state = emptyState();

  const cleanStudent = (s) => ({
    id: s && s.id ? String(s.id) : Utils.uid('std'),
    name: Utils.normalizeName(s && s.name ? s.name : ''),
    gender: s && s.gender === 'female' ? 'female' : 'male',
    absent: !!(s && s.absent),
    addedAt: s && s.addedAt ? s.addedAt : Date.now()
  });

  const cleanClass = (c) => ({
    id: c && c.id ? String(c.id) : Utils.uid('cls'),
    name: Utils.normalizeName(c && c.name ? c.name : 'Lớp mới'),
    students: Array.isArray(c && c.students) ? c.students.map(cleanStudent).filter(s => s.name) : [],
    createdAt: c && c.createdAt ? c.createdAt : Date.now()
  });

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!raw || !Array.isArray(raw.classes)) return;
      state = {
        version: 1,
        classes: raw.classes.map(cleanClass),
        activeClassId: raw.activeClassId || (raw.classes[0] && raw.classes[0].id) || null,
        history: Array.isArray(raw.history) ? raw.history.filter(h => h && Array.isArray(h.names)).slice(0, 800) : [],
        rounds: raw.rounds && typeof raw.rounds === 'object' ? raw.rounds : {},
        settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) }
      };
      if (!state.classes.some(c => c.id === state.activeClassId)) {
        state.activeClassId = state.classes[0] ? state.classes[0].id : null;
      }
    } catch (e) {
      console.warn('Không đọc được dữ liệu đã lưu', e);
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      if (window.UI && UI.toast) UI.toast('Không lưu được dữ liệu trên trình duyệt', 'bad');
      console.warn('Lưu dữ liệu thất bại', e);
    }
  }

  const getClass = (id) => state.classes.find(c => c.id === id) || null;
  const getActiveClass = () => getClass(state.activeClassId) || state.classes[0] || null;

  function setActiveClass(id) {
    if (getClass(id)) { state.activeClassId = id; save(); return true; }
    return false;
  }

  function createClass(name, students) {
    const cls = cleanClass({ name: Utils.normalizeName(name) || 'Lớp mới', students: students || [] });
    state.classes.push(cls);
    state.activeClassId = cls.id;
    state.rounds[cls.id] = [];
    save();
    return cls;
  }

  function renameClass(id, name) {
    const c = getClass(id); if (!c) return false;
    const n = Utils.normalizeName(name);
    if (!n) return false;
    c.name = n; save();
    // cập nhật tên lớp trong lịch sử
    state.history.forEach(h => { if (h.classId === id) h.className = n; });
    return true;
  }

  function deleteClass(id) {
    const i = state.classes.findIndex(c => c.id === id);
    if (i < 0) return false;
    state.classes.splice(i, 1);
    state.history = state.history.filter(h => h.classId !== id);
    delete state.rounds[id];
    if (state.activeClassId === id) state.activeClassId = state.classes[0] ? state.classes[0].id : null;
    save();
    return true;
  }

  function duplicateClass(id) {
    const c = getClass(id); if (!c) return null;
    const copy = cleanClass({
      name: c.name + ' (bản sao)',
      students: c.students.map(s => ({ ...s, id: Utils.uid('std') }))
    });
    state.classes.push(copy);
    state.activeClassId = copy.id;
    state.rounds[copy.id] = [];
    save();
    return copy;
  }

  function addStudents(classId, list) {
    const c = getClass(classId) || getActiveClass();
    if (!c) return { added: 0, skipped: 0 };
    const existing = new Set(c.students.map(s => Utils.stripDiacritics(s.name).toLowerCase()));
    let added = 0, skipped = 0;
    (list || []).forEach(item => {
      const name = Utils.normalizeName(typeof item === 'string' ? item : item.name);
      if (!name) return;
      const key = Utils.stripDiacritics(name).toLowerCase();
      if (existing.has(key)) { skipped++; return; }
      existing.add(key);
      c.students.push({
        id: Utils.uid('std'), name,
        gender: (item && item.gender) === 'female' ? 'female' : 'male',
        absent: false, addedAt: Date.now()
      });
      added++;
    });
    if (added) save();
    return { added, skipped };
  }

  function addStudent(classId, name, gender) {
    return addStudents(classId, [{ name, gender }]);
  }

  function updateStudent(classId, studentId, patch) {
    const c = getClass(classId); if (!c) return false;
    const s = c.students.find(x => x.id === studentId); if (!s) return false;
    if (patch.name != null) {
      const n = Utils.normalizeName(patch.name);
      if (!n) return false;
      const dup = c.students.some(x => x.id !== studentId && Utils.stripDiacritics(x.name).toLowerCase() === Utils.stripDiacritics(n).toLowerCase());
      if (dup) return false;
      s.name = n;
    }
    if (patch.gender === 'male' || patch.gender === 'female') s.gender = patch.gender;
    if (typeof patch.absent === 'boolean') s.absent = patch.absent;
    save();
    return true;
  }

  function removeStudent(classId, studentId) {
    const c = getClass(classId); if (!c) return false;
    const i = c.students.findIndex(s => s.id === studentId);
    if (i < 0) return false;
    c.students.splice(i, 1);
    if (state.rounds[classId]) state.rounds[classId] = state.rounds[classId].filter(id => id !== studentId);
    save();
    return true;
  }

  function setAttendance(classId, studentId, absent) {
    const c = getClass(classId); if (!c) return;
    const s = c.students.find(x => x.id === studentId); if (!s) return;
    s.absent = !!absent;
    save();
  }

  function setAllAttendance(classId, absent) {
    const c = getClass(classId); if (!c) return;
    c.students.forEach(s => { s.absent = !!absent; });
    save();
  }

  function resetRound(classId) {
    const id = classId || (getActiveClass() && getActiveClass().id);
    if (!id) return;
    state.rounds[id] = [];
    save();
  }

  function resetAllRounds() {
    state.rounds = {};
    save();
  }

  const calledIds = (classId) => (state.rounds[classId] || []).slice();
  const calledCount = (classId) => (state.rounds[classId] || []).length;

  function pickStudents(count = 1, game = 'quick') {
    const cls = getActiveClass();
    if (!cls) return { students: [], reset: false, empty: true };
    count = Utils.clamp(parseInt(count, 10) || 1, 1, 10);
    const pool = cls.students.filter(s => !s.absent);
    if (!pool.length) return { students: [], reset: false, empty: true };

    let reset = false;
    let source = pool;
    if (state.settings.noRepeat) {
      const called = new Set((state.rounds[cls.id] || []));
      let available = pool.filter(s => !called.has(s.id));
      if (!available.length) {
        state.rounds[cls.id] = [];
        available = pool;
        reset = true;
      }
      source = available;
    }
    const n = Math.min(count, source.length);
    const picked = Utils.shuffle(source).slice(0, n);
    const round = new Set(state.rounds[cls.id] || []);
    picked.forEach(s => round.add(s.id));
    state.rounds[cls.id] = Array.from(round);
    save();
    if (game) logCall(game, picked, cls);
    return { students: picked, reset, empty: false };
  }

  function logCall(game, students, cls) {
    if (!students || !students.length) return;
    const c = cls || getActiveClass();
    state.history.unshift({
      id: Utils.uid('log'),
      game, // mosquito | ufo | duck | quick
      classId: c ? c.id : null,
      className: c ? c.name : '—',
      studentIds: students.map(s => s.id),
      names: students.map(s => s.name),
      at: Date.now()
    });
    if (state.history.length > 600) state.history.length = 600;
    save();
  }

  function getHistory(classId) {
    return state.history.filter(h => !classId || h.classId === classId);
  }

  function deleteHistory(id) {
    state.history = state.history.filter(h => h.id !== id);
    save();
  }

  function clearHistory(classId) {
    state.history = classId ? state.history.filter(h => h.classId !== classId) : [];
    save();
  }

  function updateSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    save();
  }

  function exportClassCSV(cls) {
    const c = cls || getActiveClass();
    if (!c) return null;
    const rows = [['STT', 'Họ và tên', 'Giới tính', 'Trạng thái', 'Lớp']];
    c.students.forEach((s, i) => {
      rows.push([i + 1, s.name, s.gender === 'female' ? 'Nữ' : 'Nam', s.absent ? 'Vắng' : 'Có mặt', c.name]);
    });
    return { filename: 'danh-sach-' + safeFile(c.name) + '.csv', content: Utils.toCSV(rows) };
  }

  function exportHistoryCSV(classId) {
    const rows = [['Thời gian', 'Lớp', 'Trò chơi', 'Học sinh được gọi']];
    getHistory(classId).forEach(h => {
      rows.push([Utils.fmtTime(h.at) + ' ' + Utils.fmtDate(h.at), h.className, gameLabel(h.game), h.names.join(', ')]);
    });
    return { filename: 'lich-su-goi-ten.csv', content: Utils.toCSV(rows) };
  }

  function safeFile(s) {
    return Utils.stripDiacritics(s).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'lop';
  }

  function gameLabel(game) {
    return ({ mosquito: 'Đập Muỗi', ufo: 'UFO Gọi Tên', duck: 'Đua Vịt', quick: 'Gọi ngẫu nhiên' })[game] || 'Gọi tên';
  }

  function backup() {
    return JSON.stringify({ ...state, exportedAt: new Date().toISOString(), app: 'LopHocVui' }, null, 2);
  }

  function restore(json) {
    let raw;
    try { raw = JSON.parse(json); } catch (e) { return { ok: false, error: 'Tệp JSON không hợp lệ.' }; }
    if (!raw || !Array.isArray(raw.classes)) return { ok: false, error: 'Tệp sao lưu không đúng định dạng.' };
    const classes = raw.classes.map(cleanClass).filter(c => c.name);
    if (!classes.length) return { ok: false, error: 'Tệp sao lưu không có lớp nào.' };
    state = {
      version: 1,
      classes,
      activeClassId: classes[0].id,
      history: Array.isArray(raw.history) ? raw.history.filter(h => h && Array.isArray(h.names)).slice(0, 800) : [],
      rounds: raw.rounds && typeof raw.rounds === 'object' ? raw.rounds : {},
      settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) }
    };
    save();
    return { ok: true, classes: classes.length, students: classes.reduce((n, c) => n + c.students.length, 0) };
  }

  function resetAll() {
    state = emptyState();
    save();
  }

  function loadSample() {
    const names = [
      ['Nguyễn Minh Anh', 'female'], ['Trần Quốc Bảo', 'male'], ['Lê Hoàng Bảo', 'male'], ['Phạm Ngọc Diệp', 'female'],
      ['Vũ Tiến Dũng', 'male'], ['Đặng Thu Hà', 'female'], ['Bùi Hải Đăng', 'male'], ['Ngô Phương Hạnh', 'female'],
      ['Đỗ Trung Hiếu', 'male'], ['Hoàng Gia Huy', 'male'], ['Lý Khánh Linh', 'female'], ['Trịnh Văn Long', 'male'],
      ['Phan Thanh Mai', 'female'], ['Võ Minh Nam', 'male'], ['Dương Yến Nhi', 'female'], ['Lưu Hoàng Oanh', 'female'],
      ['Nguyễn Hồng Phúc', 'male'], ['Trần Thảo Quyên', 'female'], ['Lê Anh Sơn', 'male'], ['Phạm Gia Tâm', 'female'],
      ['Hoàng Minh Thư', 'female'], ['Vũ Đức Thịnh', 'male'], ['Đặng Quốc Toàn', 'male'], ['Ngô Thu Trang', 'female'],
      ['Bùi Thanh Tú', 'female'], ['Đỗ Anh Tuấn', 'male'], ['Trịnh Bảo Vy', 'female'], ['Phan Nhật Vũ', 'male'],
      ['Lý Hải Yến', 'female'], ['Võ Thành Công', 'male'], ['Trần Mỹ Duyên', 'female'], ['Nguyễn Đức Anh', 'male']
    ];
    const cls = cleanClass({ name: 'Lớp 8A', students: names.map(([name, gender]) => ({ name, gender })) });
    state.classes.push(cls);
    state.activeClassId = cls.id;
    state.rounds[cls.id] = [];
    save();
    return cls;
  }

  load();

  return {
    KEY,
    get state() { return state; },
    get settings() { return state.settings; },
    save,
    getClass, getActiveClass, setActiveClass,
    get classes() { return state.classes; },
    createClass, renameClass, deleteClass, duplicateClass,
    addStudents, addStudent, updateStudent, removeStudent,
    setAttendance, setAllAttendance, resetRound, resetAllRounds,
    calledIds, calledCount, pickStudents, logCall,
    getHistory, deleteHistory, clearHistory,
    updateSettings,
    exportClassCSV, exportHistoryCSV,
    backup, restore, resetAll, loadSample,
    gameLabel
  };
})();

/* ---------------- Sound ---------------- */
const Sfx = (() => {
  let ctx = null;
  let master = null;
  let buzz = null;
  let enabled = true;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function volume() {
    const v = Store.settings.volume;
    return typeof v === 'number' ? Utils.clamp(v, 0, 1) : 0.6;
  }

  function canPlay() {
    return enabled && Store.settings.sound && volume() > 0;
  }

  function tone(freq, dur, opts = {}) {
    if (!canPlay()) return;
    const c = ensure(); if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.to), c.currentTime + dur);
    const vol = (opts.vol == null ? 0.16 : opts.vol) * volume();
    g.gain.setValueAtTime(0.0001, c.currentTime + (opts.delay || 0));
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), c.currentTime + (opts.delay || 0) + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (opts.delay || 0) + dur);
    osc.connect(g); g.connect(master);
    osc.start(c.currentTime + (opts.delay || 0));
    osc.stop(c.currentTime + (opts.delay || 0) + dur + 0.03);
  }

  function noise(dur, opts = {}) {
    if (!canPlay()) return;
    const c = ensure(); if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = opts.filter || 'lowpass';
    filter.frequency.setValueAtTime(opts.freq || 1200, c.currentTime);
    if (opts.to) filter.frequency.exponentialRampToValueAtTime(opts.to, c.currentTime + dur);
    const g = c.createGain();
    g.gain.setValueAtTime((opts.vol == null ? 0.2 : opts.vol) * volume(), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.connect(filter); filter.connect(g); g.connect(master);
    src.start();
  }

  const api = {
    setEnabled(v) { enabled = !!v; if (!v) api.buzzStop(); },
    isEnabled() { return enabled; },
    unlock() { ensure(); },
    tick() { tone(760, 0.05, { type: 'square', vol: 0.055 }); },
    click() { tone(420, 0.06, { type: 'triangle', vol: 0.06 }); },
    pop() { tone(520, 0.09, { type: 'sine', vol: 0.12, to: 880 }); },
    swoosh() { noise(0.5, { filter: 'bandpass', freq: 400, to: 2400, vol: 0.16 }); },
    splat() {
      noise(0.22, { filter: 'lowpass', freq: 2400, to: 180, vol: 0.42 });
      tone(150, 0.16, { type: 'triangle', vol: 0.22, to: 60 });
    },
    heartbeat() {
      tone(74, 0.15, { type: 'sine', vol: 0.3, to: 46 });
      tone(62, 0.2, { type: 'sine', vol: 0.22, to: 40, delay: 0.18 });
    },
    lock() {
      tone(740, 0.07, { type: 'square', vol: 0.07 });
      tone(1108, 0.09, { type: 'square', vol: 0.06, delay: 0.07 });
      tone(1480, 0.22, { type: 'sine', vol: 0.1, delay: 0.14 });
    },
    cheer() {
      noise(0.85, { filter: 'bandpass', freq: 650, to: 2400, vol: 0.17 });
      [660, 880, 990].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.07, delay: i * 0.09 }));
      tone(1320, 0.32, { type: 'sine', vol: 0.05, delay: 0.28 });
    },
    quack() {
      tone(520, 0.1, { type: 'sawtooth', vol: 0.1, to: 260 });
      tone(440, 0.08, { type: 'sawtooth', vol: 0.08, to: 240, delay: 0.1 });
    },
    countdown() { tone(660, 0.12, { type: 'square', vol: 0.09 }); },
    go() { tone(880, 0.35, { type: 'triangle', vol: 0.14 }); tone(1320, 0.35, { type: 'sine', vol: 0.07, delay: 0.04 }); },
    win() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => tone(f, 0.32, { type: 'triangle', vol: 0.13, delay: i * 0.11 }));
      tone(1568, 0.5, { type: 'sine', vol: 0.06, delay: 0.44 });
    },
    buzzStart() {
      if (!canPlay() || buzz) return;
      const c = ensure(); if (!c) return;
      const osc = c.createOscillator();
      const g = c.createGain();
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 155;
      lfo.type = 'sine';
      lfo.frequency.value = 7.5;
      lfoGain.gain.value = 38;
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.045 * volume(), c.currentTime + 0.5);
      osc.connect(g); g.connect(master);
      osc.start(); lfo.start();
      buzz = { osc, lfo, g };
    },
    buzzStop() {
      if (!buzz || !ctx) { buzz = null; return; }
      const b = buzz; buzz = null;
      try {
        b.g.gain.cancelScheduledValues(ctx.currentTime);
        b.g.gain.setValueAtTime(b.g.gain.value, ctx.currentTime);
        b.g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        b.osc.stop(ctx.currentTime + 0.16);
        b.lfo.stop(ctx.currentTime + 0.16);
      } catch (e) { /* ignore */ }
    }
  };
  return api;
})();

/* ---------------- Speech ---------------- */
const Speech = (() => {
  let voices = [];
  const loadVoices = () => {
    if (!('speechSynthesis' in window)) return;
    voices = window.speechSynthesis.getVoices() || [];
  };
  if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  function speak(text) {
    if (!Store.settings.voice || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'vi-VN';
      u.rate = 0.95;
      u.pitch = 1.04;
      u.volume = Utils.clamp(Store.settings.volume, 0, 1);
      const vi = voices.find(v => /vi[-_]VN/i.test(v.lang)) || voices.find(v => /^vi/i.test(v.lang));
      if (vi) u.voice = vi;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  function stop() {
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
  }
  return { speak, stop };
})();

/* ---------------- UI helpers ---------------- */
const UI = (() => {
  const modalRoot = () => document.getElementById('modalRoot');
  const toastRoot = () => document.getElementById('toastRoot');
  let openModalClose = null;
  let menuClose = null;

  const ICONS = { good: 'i-check', bad: 'i-x', info: 'i-sparkles' };

  function toast(message, type = 'info', ms = 2800) {
    const root = toastRoot(); if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (type === 'good' ? 'good' : type === 'bad' ? 'bad' : '');
    el.innerHTML = `<span class="toast-ico"><svg class="icon sm"><use href="#${ICONS[type] || ICONS.info}"/></svg></span><span>${Utils.esc(message)}</span>`;
    root.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }, ms);
  }

  function closeModal() {
    if (openModalClose) openModalClose();
    openModalClose = null;
  }

  function modal(opts = {}) {
    // Đóng modal đang mở trước khi mở modal mới
    if (openModalClose) openModalClose();
    const root = modalRoot();
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    const size = opts.size === 'wide' ? ' wide' : opts.size === 'slim' ? ' slim' : '';
    const extra = opts.className ? ' ' + opts.className : '';
    const inner = opts.bare ? (opts.body || '') : `
        <div class="modal-head">
          <div class="mh-copy">
            <h3>${opts.title || ''}</h3>
            ${opts.subtitle ? `<p>${opts.subtitle}</p>` : ''}
          </div>
          <button class="close-x" type="button" data-modal-close aria-label="Đóng"><svg class="icon"><use href="#i-x"/></svg></button>
        </div>
        <div class="modal-body">${opts.body || ''}</div>
        ${opts.footer ? `<div class="modal-foot">${opts.footer}</div>` : ''}`;
    back.innerHTML = `
      <div class="modal${size}${extra}" role="dialog" aria-modal="true" aria-label="${Utils.esc(opts.title || 'Hộp thoại')}">
        ${inner}
      </div>`;
    root.appendChild(back);

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey);
      back.remove();
      if (openModalClose === close) openModalClose = null;
      if (opts.onClose) opts.onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') {
        const focusables = back.querySelectorAll('button, input, textarea, select, a[href]');
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
    back.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', onKey);
    openModalClose = close;
    if (opts.onMount) {
      try { opts.onMount(back, close); } catch (e) { console.error(e); }
    }
    setTimeout(() => {
      const auto = back.querySelector('[data-autofocus]');
      const first = auto || back.querySelector('input, textarea, select, button:not(.close-x)');
      if (first) first.focus();
    }, 60);
    return close;
  }

  function confirm(opts = {}) {
    return new Promise(resolve => {
      let settled = false;
      const done = (v) => { if (settled) return; settled = true; if (openModalClose) openModalClose(); resolve(v); };
      const close = UI.modal({
        title: opts.title || 'Xác nhận',
        subtitle: opts.message ? Utils.esc(opts.message) : '',
        size: 'slim',
        body: opts.body || '',
        footer: `
          <div class="spacer"></div>
          <button class="btn ghost" data-cancel>${Utils.esc(opts.cancelText || 'Hủy')}</button>
          <button class="btn ${opts.danger ? 'danger' : 'primary'}" data-ok>${Utils.esc(opts.confirmText || 'Đồng ý')}</button>`,
        onMount(back) {
          back.querySelector('[data-cancel]').addEventListener('click', () => done(false));
          back.querySelector('[data-ok]').addEventListener('click', () => done(true));
        },
        onClose() { if (!settled) { settled = true; resolve(false); } }
      });
      void close;
    });
  }

  function menu(anchor, items) {
    if (menuClose) { menuClose(); menuClose = null; }
    const rect = anchor.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'menu-pop';
    el.innerHTML = items.map((it, i) => it.sep
      ? '<div class="menu-sep"></div>'
      : `<button class="menu-item${it.danger ? ' danger' : ''}" data-i="${i}">
          ${it.icon ? `<svg class="icon sm"><use href="#${it.icon}"/></svg>` : ''}
          <span>${Utils.esc(it.label)}</span></button>`).join('');
    document.body.appendChild(el);

    const w = el.offsetWidth, h = el.offsetHeight;
    let left = rect.right - w;
    let top = rect.bottom + 6;
    left = Utils.clamp(left, 8, window.innerWidth - w - 8);
    if (top + h > window.innerHeight - 8) top = Math.max(8, rect.top - h - 6);
    el.style.left = left + 'px';
    el.style.top = top + 'px';

    const close = () => {
      el.remove();
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      if (menuClose === close) menuClose = null;
    };
    const onDown = (e) => { if (!el.contains(e.target) && !anchor.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);

    el.querySelectorAll('[data-i]').forEach(b => {
      b.addEventListener('click', () => {
        const it = items[Number(b.dataset.i)];
        close();
        if (it && it.onClick) setTimeout(() => it.onClick(), 0);
      });
    });
    menuClose = close;
    return close;
  }

  function closeMenu() { if (menuClose) menuClose(); }

  function confetti(container, count = 46) {
    if (!container) return;
    const colors = ['#8b6bff', '#ff5c9d', '#ffd166', '#35d6e8', '#36d399', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = 'confetti-piece';
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      p.style.width = (5 + Math.random() * 6) + 'px';
      p.style.height = (8 + Math.random() * 9) + 'px';
      p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(p);
    }
  }

  function empty(icon, title, text, action = '') {
    return `<div class="empty">
      <div class="bubble">${icon}</div>
      <h4>${Utils.esc(title)}</h4>
      <p>${text || ''}</p>
      ${action}
    </div>`;
  }

  return { toast, modal, confirm, menu, closeMenu, closeModal, confetti, empty };
})();
