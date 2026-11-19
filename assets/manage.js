/* ==========================================================
   LỚP HỌC VUI — Manage views: classes, history, settings
   ========================================================== */
'use strict';

const Manage = (() => {
  const icon = (name, cls = 'icon') => `<svg class="${cls}"><use href="#${name}"/></svg>`;
  const gameEmoji = (g) => ({ mosquito: '🦟', ufo: '🛸', duck: '🦆', quick: '🎲' }[g] || '🎲');

  /* ==========================================================
     CLASS FORM
     ========================================================== */
  function openClassForm(editId) {
    const editing = editId ? Store.getClass(editId) : null;
    UI.modal({
      title: editing ? 'Đổi tên lớp' : 'Tạo lớp mới',
      subtitle: editing ? 'Tên lớp sẽ được cập nhật trong toàn bộ ứng dụng.' : 'Đặt tên dễ nhớ, ví dụ “Lớp 8A” hoặc “Ca 2 – Tin học”.',
      size: 'slim',
      body: `<div class="field">
          <label for="className">Tên lớp</label>
          <input class="input" id="className" data-name data-autofocus maxlength="48" placeholder="Ví dụ: Lớp 8A" value="${editing ? Utils.esc(editing.name) : ''}" />
          <span class="hint">Bạn có thể tạo nhiều lớp và chuyển qua lại bất cứ lúc nào.</span>
        </div>`,
      footer: `<div class="spacer"></div>
        <button class="btn ghost" type="button" data-cancel>Hủy</button>
        <button class="btn primary" type="button" data-save>${editing ? 'Lưu tên lớp' : 'Tạo lớp'}</button>`,
      onMount(back, close) {
        const input = back.querySelector('[data-name]');
        const save = () => {
          const name = Utils.normalizeName(input.value);
          if (!name) { input.focus(); UI.toast('Vui lòng nhập tên lớp', 'bad'); return; }
          if (editing) {
            Store.renameClass(editing.id, name);
            UI.toast('Đã đổi tên lớp', 'good');
          } else {
            Store.createClass(name);
            UI.toast('Đã tạo lớp “' + name + '”', 'good');
          }
          close();
          App.updateShell();
          App.refresh();
        };
        back.querySelector('[data-save]').addEventListener('click', save);
        back.querySelector('[data-cancel]').addEventListener('click', close);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save(); } });
      }
    });
  }

  /* ==========================================================
     STUDENT FORM
     ========================================================== */
  function openStudentForm(classId, studentId) {
    const cls = Store.getClass(classId) || Store.getActiveClass();
    if (!cls) return;
    const editing = studentId ? cls.students.find(s => s.id === studentId) : null;
    UI.modal({
      title: editing ? 'Sửa thông tin học sinh' : 'Thêm học sinh',
      subtitle: editing ? 'Chỉnh sửa tên hoặc giới tính của bạn này.' : 'Có thể thêm nhanh nhiều bạn cùng lúc, mỗi dòng một tên.',
      body: `${editing ? `
        <div class="field">
          <label for="stName">Họ và tên</label>
          <input class="input" id="stName" data-name data-autofocus maxlength="60" value="${Utils.esc(editing.name)}" />
        </div>
        <div class="field">
          <label>Giới tính</label>
          <select class="select" data-gender>
            <option value="male" ${editing.gender === 'male' ? 'selected' : ''}>Nam</option>
            <option value="female" ${editing.gender === 'female' ? 'selected' : ''}>Nữ</option>
          </select>
        </div>` : `
        <div class="field">
          <label for="stNames">Danh sách tên</label>
          <textarea class="textarea" id="stNames" data-names data-autofocus placeholder="Nguyễn Văn An&#10;Trần Thị Bình, nữ&#10;Lê Hoàng Cường"></textarea>
          <span class="hint">Mỗi dòng một bạn. Thêm <b>, nữ</b> sau tên để đánh dấu giới tính (mặc định là nam).</span>
        </div>`}`,
      footer: `<div class="spacer"></div>
        <button class="btn ghost" type="button" data-cancel>Hủy</button>
        <button class="btn primary" type="button" data-save>${editing ? 'Lưu thay đổi' : 'Thêm vào lớp'}</button>`,
      onMount(back, close) {
        const save = () => {
          if (editing) {
            const name = Utils.normalizeName(back.querySelector('[data-name]').value);
            const gender = back.querySelector('[data-gender]').value;
            if (!name) { UI.toast('Vui lòng nhập tên học sinh', 'bad'); return; }
            const ok = Store.updateStudent(cls.id, editing.id, { name, gender });
            if (!ok) { UI.toast('Tên này đã có trong lớp', 'bad'); return; }
            UI.toast('Đã cập nhật thông tin', 'good');
            close(); App.refresh();
          } else {
            const raw = back.querySelector('[data-names]').value;
            const list = Utils.parseStudentText(raw);
            if (!list.length) { UI.toast('Chưa nhận diện được tên nào', 'bad'); return; }
            const res = Store.addStudents(cls.id, list);
            if (!res.added) { UI.toast('Các tên này đã có trong lớp', 'bad'); return; }
            UI.toast(`Đã thêm ${res.added} học sinh${res.skipped ? `, bỏ qua ${res.skipped} tên trùng` : ''}`, 'good');
            close(); App.updateShell(); App.refresh();
          }
        };
        back.querySelector('[data-save]').addEventListener('click', save);
        back.querySelector('[data-cancel]').addEventListener('click', close);
        const first = back.querySelector('input, textarea');
        if (first) first.addEventListener('keydown', e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); }
        });
      }
    });
  }

  /* ==========================================================
     IMPORT
     ========================================================== */
  function openImport(classId) {
    let cls = classId ? Store.getClass(classId) : Store.getActiveClass();
    const needsClass = !cls;
    let parsed = [];

    const updatePreview = (back) => {
      const text = back.querySelector('[data-text]').value;
      parsed = Utils.parseStudentText(text);
      const box = back.querySelector('[data-preview]');
      if (!parsed.length) {
        box.innerHTML = `<span class="faint">Chưa nhận diện được tên nào. Mỗi dòng một học sinh.</span>`;
      } else {
        box.innerHTML = `<div class="row wrap" style="gap:5px">${parsed.slice(0, 12).map(p => `<span class="pill">${Utils.esc(p.name)}${p.gender === 'female' ? ' · nữ' : ''}</span>`).join('')}${parsed.length > 12 ? `<span class="pill violet">+${parsed.length - 12} bạn</span>` : ''}</div>
          <div class="import-count">Nhận diện <strong>${parsed.length}</strong> học sinh</div>`;
      }
      return parsed;
    };

    UI.modal({
      title: 'Nhập danh sách học sinh',
      subtitle: 'Thêm nhanh cả lớp từ tệp TXT / CSV hoặc dán trực tiếp danh sách.',
      size: 'wide',
      body: `
        ${needsClass ? `<div class="field"><label for="impClass">Tên lớp mới</label><input class="input" id="impClass" data-classname data-autofocus maxlength="48" placeholder="Ví dụ: Lớp 10B" /></div>` : `<div class="row wrap"><span class="pill violet">${icon('i-users', 'icon xs')} ${Utils.esc(cls.name)}</span><span class="faint" style="font-size:11px">${cls.students.length} học sinh hiện có</span></div>`}
        <div class="import-drop" data-drop>
          <div class="imp-ico">${icon('i-upload', 'icon lg')}</div>
          <div><strong>Kéo thả tệp vào đây</strong><span>hoặc</span></div>
          <button class="btn soft sm" type="button" data-pick>${icon('i-file', 'icon sm')} Chọn tệp TXT / CSV</button>
          <input type="file" accept=".txt,.csv,.json,text/plain,text/csv,application/json" hidden data-file />
          <small>Hỗ trợ .txt, .csv (UTF-8). Mỗi dòng một học sinh.</small>
        </div>
        <div class="field">
          <label for="impText">Hoặc dán danh sách</label>
          <textarea class="textarea" id="impText" data-text placeholder="Nguyễn Minh Anh, nữ&#10;Trần Quốc Bảo&#10;1. Lê Hoàng Bảo&#10;Phạm Ngọc Diệp, nữ"></textarea>
          <span class="hint">Mỗi dòng một bạn. Có thể thêm <b>, nữ</b> hoặc <b>, nam</b>. Số thứ tự đầu dòng sẽ tự bỏ.</span>
        </div>
        <div class="import-preview" data-preview><span class="faint">Chưa nhận diện được tên nào. Mỗi dòng một học sinh.</span></div>
        <label class="switch import-replace">
          <input type="checkbox" data-replace />
          <span class="track"></span>
          <span class="switch-label">Thay thế danh sách hiện tại<small>Xóa toàn bộ học sinh cũ của lớp rồi nhập danh sách mới.</small></span>
        </label>`,
      footer: `<a class="btn ghost sm" href="mau-danh-sach-hoc-sinh.csv" download>${icon('i-download', 'icon sm')} Tải tệp mẫu</a>
        <div class="spacer"></div>
        <button class="btn ghost" type="button" data-cancel>Hủy</button>
        <button class="btn primary" type="button" data-save>${icon('i-upload', 'icon sm')} Nhập danh sách</button>`,
      onMount(back, close) {
        const textEl = back.querySelector('[data-text]');
        const fileEl = back.querySelector('[data-file]');
        const replaceEl = back.querySelector('[data-replace]');
        const saveBtn = back.querySelector('[data-save]');
        updatePreview(back);

        const onChange = Utils.debounce(() => {
          updatePreview(back);
          if (replaceEl.checked) saveBtn.classList.add('danger');
          else saveBtn.classList.remove('danger');
        }, 120);
        textEl.addEventListener('input', onChange);
        replaceEl.addEventListener('change', onChange);

        back.querySelector('[data-pick]').addEventListener('click', () => fileEl.click());
        const drop = back.querySelector('[data-drop]');
        drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('over'));
        drop.addEventListener('drop', async e => {
          e.preventDefault(); drop.classList.remove('over');
          const f = e.dataTransfer.files && e.dataTransfer.files[0];
          if (f) loadFile(f);
        });

        async function loadFile(file) {
          const ext = Utils.fileExt(file.name);
          try {
            const text = await Utils.readFileText(file);
            if (ext === 'json') {
              try {
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                  const lines = data.map(x => {
                    if (typeof x === 'string') return x;
                    if (x && x.name) return x.name + (x.gender === 'female' ? ', nữ' : '');
                    return '';
                  }).filter(Boolean);
                  textEl.value = lines.join('\n');
                } else {
                  UI.toast('Tệp JSON cần là một mảng tên học sinh', 'bad');
                  return;
                }
              } catch (err) {
                UI.toast('Tệp JSON không hợp lệ', 'bad');
                return;
              }
            } else {
              textEl.value = text;
            }
            updatePreview(back);
            UI.toast('Đã đọc tệp ' + file.name, 'good');
          } catch (err) {
            UI.toast('Không đọc được tệp', 'bad');
          }
        }

        fileEl.addEventListener('change', () => {
          if (fileEl.files && fileEl.files[0]) loadFile(fileEl.files[0]);
        });

        back.querySelector('[data-cancel]').addEventListener('click', close);

        // Cho phép kéo thả ở toàn bộ modal
        back.addEventListener('dragover', e => { if (e.dataTransfer && e.dataTransfer.types.includes('Files')) e.preventDefault(); });
        back.addEventListener('drop', e => {
          if (e.target.closest('[data-drop]')) return;
          e.preventDefault();
          const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
          if (f) loadFile(f);
        });

        saveBtn.addEventListener('click', () => {
          const list = updatePreview(back);
          if (!list.length) { UI.toast('Chưa có tên nào để nhập', 'bad'); return; }

          let target = cls;
          if (needsClass) {
            const nameInput = back.querySelector('[data-classname]');
            const name = Utils.normalizeName(nameInput ? nameInput.value : '') || 'Lớp mới';
            target = Store.createClass(name);
            cls = target;
          }

          const replace = replaceEl.checked && !needsClass;
          if (replace) {
            target.students = [];
            Store.resetRound(target.id);
          }
          const res = Store.addStudents(target.id, list);
          if (!res.added) {
            UI.toast('Tất cả tên trong danh sách đã có trong lớp', 'bad');
            return;
          }
          close();
          App.updateShell();
          App.refresh();
          UI.toast(`Đã nhập ${res.added} học sinh vào ${target.name}${res.skipped ? ` · bỏ qua ${res.skipped} tên trùng` : ''}`, 'good', 3600);
        });
      }
    });
  }

  /* ==========================================================
     CLASSES VIEW
     ========================================================== */
  function renderClasses(view) {
    const classes = Store.classes;
    if (!classes.length) {
      view.innerHTML = `<div class="classes-page">
        <section class="panel">
          ${UI.empty('🏫', 'Chưa có lớp học nào',
        'Tạo lớp đầu tiên, nhập danh sách học sinh từ tệp hoặc dùng dữ liệu mẫu để trải nghiệm ngay.',
        `<div class="row wrap" style="justify-content:center">
              <button class="btn primary" data-new-class>${icon('i-plus', 'icon sm')} Tạo lớp mới</button>
              <button class="btn soft" data-import>${icon('i-upload', 'icon sm')} Nhập từ tệp</button>
              <button class="btn ghost" data-sample>Dùng dữ liệu mẫu</button>
            </div>`)}
        </section>
      </div>`;
      view.querySelector('[data-new-class]').addEventListener('click', () => openClassForm());
      view.querySelector('[data-import]').addEventListener('click', () => openImport());
      view.querySelector('[data-sample]').addEventListener('click', () => {
        Store.loadSample(); App.updateShell(); App.refresh(); UI.toast('Đã thêm lớp mẫu 8A', 'good');
      });
      return;
    }

    let active = Store.getActiveClass();
    if (!active) { active = classes[0]; Store.setActiveClass(active.id); }
    let search = '';
    let filter = 'all';

    // map số lần đã gọi từ lịch sử
    const calledMap = {};
    Store.state.history.forEach(h => {
      if (h.classId !== active.id) return;
      (h.studentIds || []).forEach(id => { calledMap[id] = (calledMap[id] || 0) + 1; });
    });

    const classItems = classes.map(c => {
      const present = c.students.filter(s => !s.absent).length;
      return `<button class="class-item ${c.id === active.id ? 'active' : ''}" type="button" data-class-id="${c.id}">
        <span class="avatar sm" style="${Utils.avatarStyle(c.name)}">${Utils.initials(c.name)}</span>
        <span class="ci-copy"><strong>${Utils.esc(c.name)}</strong><small>${c.students.length} học sinh · ${present} có mặt</small></span>
        <span class="ci-count">${c.students.length}</span>
      </button>`;
    }).join('');

    view.innerHTML = `<div class="classes-page">
      <div class="class-layout">
        <aside class="panel class-list-panel">
          <div class="panel-head"><h3>Lớp của bạn</h3><span class="pill">${classes.length}</span></div>
          <div class="class-list">${classItems}</div>
          <button class="btn soft block" type="button" data-new-class>${icon('i-plus', 'icon sm')} Tạo lớp mới</button>
        </aside>

        <section class="panel class-detail" data-detail>
          <header class="cd-head">
            <span class="avatar lg" style="${Utils.avatarStyle(active.name)}">${Utils.initials(active.name)}</span>
            <div class="cd-title">
              <h2>${Utils.esc(active.name)}</h2>
              <div class="cd-meta" data-meta></div>
            </div>
            <div class="cd-actions">
              <button class="icon-btn" type="button" data-class-menu aria-label="Tùy chọn lớp">${icon('i-more')}</button>
            </div>
          </header>

          <div class="cd-toolbar">
            <div class="search-box">
              ${icon('i-search')}
              <input class="input" data-search placeholder="Tìm học sinh…" autocomplete="off" />
            </div>
            <div class="segmented" data-filter>
              <button type="button" data-f="all" class="active">Tất cả <span class="count" data-c="all">0</span></button>
              <button type="button" data-f="present">Có mặt <span class="count" data-c="present">0</span></button>
              <button type="button" data-f="absent">Vắng <span class="count" data-c="absent">0</span></button>
            </div>
            <button class="btn soft sm" type="button" data-import>${icon('i-upload', 'icon sm')} Nhập</button>
            <button class="btn sm" type="button" data-export>${icon('i-download', 'icon sm')} Xuất</button>
            <button class="btn primary sm" type="button" data-add>${icon('i-plus', 'icon sm')} Thêm</button>
          </div>

          <form class="cd-quickadd" data-quickadd>
            <input class="input" data-quick-name placeholder="Nhập tên rồi nhấn Enter…" autocomplete="off" maxlength="60" />
            <select class="select" data-quick-gender><option value="male">Nam</option><option value="female">Nữ</option></select>
            <button class="btn sm" type="submit">${icon('i-plus', 'icon sm')} Thêm nhanh</button>
          </form>

          <div class="students-wrap">
            <div class="students-head"><span class="sh-name">Học sinh</span><span class="sh-status">Điểm danh</span><span class="sh-menu"></span></div>
            <div data-student-list></div>
          </div>

          <footer class="cd-foot" data-foot></footer>
        </section>
      </div>
    </div>`;

    /* ---- helpers ---- */
    const listEl = view.querySelector('[data-student-list]');
    const metaEl = view.querySelector('[data-meta]');
    const footEl = view.querySelector('[data-foot]');
    const searchEl = view.querySelector('[data-search]');

    function stats() {
      const total = active.students.length;
      const absent = active.students.filter(s => s.absent).length;
      return { total, absent, present: total - absent };
    }

    function updateMeta() {
      const st = stats();
      const called = Store.calledCount(active.id);
      metaEl.innerHTML = `
        <span class="pill violet">${icon('i-users', 'icon xs')} ${st.total} học sinh</span>
        <span class="pill green">${st.present} có mặt</span>
        ${st.absent ? `<span class="pill red">${st.absent} vắng</span>` : ''}
        <span class="pill">Vòng này ${Math.min(called, st.present)}/${st.present}</span>`;
      footEl.innerHTML = `
        <span>Đang dùng <strong>${Utils.esc(active.name)}</strong> · ${st.present} bạn sẵn sàng được gọi</span>
        <span class="spacer"></span>
        <button class="btn ghost sm" type="button" data-reset-round>${icon('i-reset', 'icon sm')} Vòng mới</button>`;
      footEl.querySelector('[data-reset-round]').addEventListener('click', async () => {
        const ok = await UI.confirm({
          title: 'Bắt đầu vòng mới?',
          message: 'Xóa danh sách đã gọi trong vòng này. Điểm danh và lịch sử vẫn giữ nguyên.',
          confirmText: 'Bắt đầu vòng mới'
        });
        if (ok) {
          Store.resetRound(active.id);
          updateMeta();
          UI.toast('Đã bắt đầu vòng gọi mới', 'good');
        }
      });
    }

    function filtered() {
      const q = Utils.stripDiacritics(search.toLowerCase());
      return active.students.filter(s => {
        if (filter === 'present' && s.absent) return false;
        if (filter === 'absent' && !s.absent) return false;
        if (q && !Utils.stripDiacritics(s.name).toLowerCase().includes(q)) return false;
        return true;
      });
    }

    function renderRows() {
      const rows = filtered();
      if (!active.students.length) {
        listEl.innerHTML = UI.empty('👋', 'Lớp chưa có học sinh',
          'Thêm từng bạn bằng ô nhập nhanh, hoặc nhập cả danh sách từ tệp TXT / CSV.',
          `<button class="btn primary sm" data-empty-add>${icon('i-plus', 'icon sm')} Thêm học sinh</button>`);
        const b = listEl.querySelector('[data-empty-add]');
        if (b) b.addEventListener('click', () => openStudentForm(active.id));
        return;
      }
      if (!rows.length) {
        listEl.innerHTML = `<div class="empty compact"><h4>Không tìm thấy học sinh</h4><p>Thử từ khóa khác hoặc chọn bộ lọc “Tất cả”.</p></div>`;
        return;
      }
      listEl.innerHTML = rows.map((s, i) => {
        const calls = calledMap[s.id] || 0;
        return `<div class="student-row ${s.absent ? 'is-absent' : ''}" data-row="${s.id}">
          <span class="idx">${String(i + 1).padStart(2, '0')}</span>
          <span class="avatar sm" style="${Utils.avatarStyle(s.name)}">${Utils.initials(s.name)}</span>
          <div class="s-info">
            <strong>${Utils.esc(s.name)}</strong>
            <small>${s.gender === 'female' ? 'Nữ' : 'Nam'}${calls ? ` · đã gọi ${calls} lần` : ' · chưa gọi lần nào'}</small>
          </div>
          <button class="status-pill ${s.absent ? 'absent' : 'present'}" type="button" data-att="${s.id}" title="Bấm để đổi trạng thái">
            <span class="dot"></span><span>${s.absent ? 'Vắng' : 'Có mặt'}</span>
          </button>
          <button class="icon-btn sm" type="button" data-student-menu="${s.id}" aria-label="Tùy chọn">${icon('i-more')}</button>
        </div>`;
      }).join('');
    }

    function updateCounts() {
      const st = stats();
      view.querySelector('[data-c="all"]').textContent = st.total;
      view.querySelector('[data-c="present"]').textContent = st.present;
      view.querySelector('[data-c="absent"]').textContent = st.absent;
    }

    function refresh() {
      updateCounts();
      updateMeta();
      renderRows();
      // cập nhật số đếm ở danh sách lớp
      view.querySelectorAll('[data-class-id]').forEach(el => {
        const c = Store.getClass(el.dataset.classId);
        if (!c) return;
        const present = c.students.filter(s => !s.absent).length;
        el.querySelector('.ci-copy small').textContent = `${c.students.length} học sinh · ${present} có mặt`;
        el.querySelector('.ci-count').textContent = c.students.length;
      });
    }

    /* ---- events ---- */
    view.querySelectorAll('[data-class-id]').forEach(el => {
      el.addEventListener('click', () => {
        Store.setActiveClass(el.dataset.classId);
        App.updateShell();
        App.refresh();
      });
    });

    view.querySelector('[data-new-class]').addEventListener('click', () => openClassForm());

    searchEl.addEventListener('input', Utils.debounce(() => {
      search = searchEl.value;
      renderRows();
    }, 120));

    view.querySelectorAll('[data-f]').forEach(b => {
      b.addEventListener('click', () => {
        filter = b.dataset.f;
        view.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('active', x === b));
        renderRows();
      });
    });

    listEl.addEventListener('click', (e) => {
      const att = e.target.closest('[data-att]');
      if (att) {
        const s = active.students.find(x => x.id === att.dataset.att);
        if (!s) return;
        Store.setAttendance(active.id, s.id, !s.absent);
        Sfx.pop();
        if (s.absent) UI.toast(s.name + ' đã được đánh dấu vắng', 'info', 1500);
        refresh();
        return;
      }
      const menuBtn = e.target.closest('[data-student-menu]');
      if (menuBtn) {
        const s = active.students.find(x => x.id === menuBtn.dataset.studentMenu);
        if (!s) return;
        UI.menu(menuBtn, [
          { label: 'Sửa thông tin', icon: 'i-edit', onClick: () => openStudentForm(active.id, s.id) },
          {
            label: s.absent ? 'Đánh dấu có mặt' : 'Đánh dấu vắng',
            icon: s.absent ? 'i-check' : 'i-user-x',
            onClick: () => { Store.setAttendance(active.id, s.id, !s.absent); refresh(); }
          },
          { sep: true },
          {
            label: 'Xóa học sinh', icon: 'i-trash', danger: true, onClick: async () => {
              const ok = await UI.confirm({
                title: 'Xóa học sinh?',
                message: `“${s.name}” sẽ bị xóa khỏi ${active.name}. Lịch sử gọi tên vẫn được giữ.`,
                confirmText: 'Xóa', danger: true
              });
              if (!ok) return;
              Store.removeStudent(active.id, s.id);
              UI.toast('Đã xóa học sinh', 'good');
              App.refresh();
            }
          }
        ]);
      }
    });

    view.querySelector('[data-add]').addEventListener('click', () => openStudentForm(active.id));
    view.querySelector('[data-import]').addEventListener('click', () => openImport(active.id));

    view.querySelector('[data-export]').addEventListener('click', (e) => {
      UI.menu(e.currentTarget, [
        {
          label: 'Xuất CSV (mở bằng Excel)', icon: 'i-file', onClick: () => {
            const file = Store.exportClassCSV(active);
            Utils.download(file.filename, file.content, 'text/csv;charset=utf-8');
            UI.toast('Đã xuất danh sách lớp', 'good');
          }
        },
        {
          label: 'Sao lưu toàn bộ dữ liệu', icon: 'i-download', onClick: () => {
            Utils.download('lop-hoc-vui-backup-' + Utils.dayKey(Date.now()) + '.json', Store.backup(), 'application/json');
            UI.toast('Đã tải bản sao lưu', 'good');
          }
        }
      ]);
    });

    view.querySelector('[data-class-menu]').addEventListener('click', (e) => {
      UI.menu(e.currentTarget, [
        { label: 'Đổi tên lớp', icon: 'i-edit', onClick: () => openClassForm(active.id) },
        {
          label: 'Nhân bản lớp', icon: 'i-copy', onClick: () => {
            const copy = Store.duplicateClass(active.id);
            if (copy) { App.updateShell(); App.refresh(); UI.toast('Đã nhân bản lớp', 'good'); }
          }
        },
        {
          label: 'Đánh dấu tất cả có mặt', icon: 'i-check', onClick: () => {
            Store.setAllAttendance(active.id, false); refresh(); UI.toast('Cả lớp đã được đánh dấu có mặt', 'good');
          }
        },
        {
          label: 'Đánh dấu tất cả vắng', icon: 'i-user-x', onClick: async () => {
            const ok = await UI.confirm({
              title: 'Đánh dấu cả lớp vắng?',
              message: 'Tất cả học sinh sẽ bị đánh dấu vắng. Bạn có thể bật lại từng bạn sau.',
              confirmText: 'Đánh dấu vắng'
            });
            if (!ok) return;
            Store.setAllAttendance(active.id, true); refresh();
          }
        },
        { sep: true },
        {
          label: 'Xóa lớp này', icon: 'i-trash', danger: true, onClick: async () => {
            const ok = await UI.confirm({
              title: 'Xóa lớp “' + active.name + '”?',
              message: `Toàn bộ ${active.students.length} học sinh và lịch sử gọi của lớp sẽ bị xóa. Hành động này không thể hoàn tác.`,
              confirmText: 'Xóa lớp', danger: true
            });
            if (!ok) return;
            Store.deleteClass(active.id);
            App.updateShell();
            App.refresh();
            UI.toast('Đã xóa lớp', 'good');
          }
        }
      ]);
    });

    const quickForm = view.querySelector('[data-quickadd]');
    quickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = view.querySelector('[data-quick-name]');
      const gender = view.querySelector('[data-quick-gender]').value;
      const names = Utils.parseStudentText(input.value);
      if (!names.length) { input.focus(); return; }
      const list = names.map(n => ({ name: n.name, gender: n.gender === 'female' ? 'female' : gender }));
      const res = Store.addStudents(active.id, list);
      if (!res.added) { UI.toast('Tên này đã có trong lớp', 'bad'); input.select(); return; }
      input.value = '';
      input.focus();
      Sfx.tick();
      UI.toast(`Đã thêm ${res.added} học sinh`, 'good', 1600);
      App.updateShell();
      refresh();
    });

    refresh();
  }

  /* ==========================================================
     HISTORY VIEW
     ========================================================== */
  function renderHistory(view) {
    const classes = Store.classes;
    let filterClass = '';
    let filterGame = '';

    if (!Store.state.history.length) {
      view.innerHTML = `<div class="history-page">
        <section class="panel">
          ${UI.empty('🕘', 'Chưa có lượt gọi nào',
        'Khi bạn gọi học sinh bằng mini game hoặc nút “Gọi ngẫu nhiên”, kết quả sẽ được lưu tại đây.',
        `<a class="btn primary" href="#/play">${icon('i-gamepad', 'icon sm')} Vào phòng chơi</a>`)}
        </section>
      </div>`;
      return;
    }

    function renderList() {
      let list = Store.state.history.slice();
      if (filterClass) list = list.filter(h => h.classId === filterClass);
      if (filterGame) list = list.filter(h => h.game === filterGame);
      const box = view.querySelector('[data-history-list]');
      const count = view.querySelector('[data-history-count]');
      if (count) count.textContent = list.length + ' lượt';
      if (!list.length) {
        box.innerHTML = `<div class="empty"><div class="bubble">🔎</div><h4>Không có kết quả phù hợp</h4><p>Thử chọn lớp hoặc trò chơi khác.</p></div>`;
        return;
      }
      let html = '';
      let lastDay = '';
      list.forEach(h => {
        const day = Utils.dayKey(h.at);
        if (day !== lastDay) {
          lastDay = day;
          html += `<div class="history-date">${Utils.esc(Utils.dayLabel(h.at))}</div>`;
        }
        html += `<div class="history-row" data-log="${h.id}">
          <span class="recent-ico ${h.game}">${gameEmoji(h.game)}</span>
          <div class="history-main">
            <div class="hm-names">${h.names.map(n => `<span>${Utils.esc(n)}</span>`).join('')}</div>
            <div class="hm-meta"><span>${Utils.esc(Store.gameLabel(h.game))}</span><span>·</span><span>${Utils.esc(h.className)}</span></div>
          </div>
          <span class="history-time">${Utils.fmtTime(h.at)}</span>
          <button class="icon-btn sm danger" type="button" data-del="${h.id}" title="Xóa lượt này">${icon('i-trash')}</button>
        </div>`;
      });
      box.innerHTML = html;
    }

    view.innerHTML = `<div class="history-page">
      <div class="panel history-toolbar">
        <select class="select" data-filter-class>
          <option value="">Tất cả lớp</option>
          ${classes.map(c => `<option value="${c.id}">${Utils.esc(c.name)}</option>`).join('')}
        </select>
        <select class="select" data-filter-game>
          <option value="">Tất cả trò chơi</option>
          <option value="mosquito">Đập Muỗi</option>
          <option value="ufo">UFO Gọi Tên</option>
          <option value="duck">Đua Vịt</option>
          <option value="quick">Gọi ngẫu nhiên</option>
        </select>
        <span class="pill" data-history-count></span>
        <span class="spacer"></span>
        <button class="btn sm" data-export>${icon('i-download', 'icon sm')} Xuất CSV</button>
        <button class="btn ghost sm" data-clear>${icon('i-trash', 'icon sm')} Xóa lịch sử</button>
      </div>
      <section class="panel history-panel">
        <div class="history-list" data-history-list></div>
      </section>
    </div>`;

    view.querySelector('[data-filter-class]').addEventListener('change', (e) => { filterClass = e.target.value; renderList(); });
    view.querySelector('[data-filter-game]').addEventListener('change', (e) => { filterGame = e.target.value; renderList(); });
    view.querySelector('[data-export]').addEventListener('click', () => {
      const file = Store.exportHistoryCSV(filterClass);
      Utils.download(file.filename, file.content, 'text/csv;charset=utf-8');
      UI.toast('Đã xuất lịch sử gọi tên', 'good');
    });
    view.querySelector('[data-clear]').addEventListener('click', async () => {
      const ok = await UI.confirm({
        title: 'Xóa toàn bộ lịch sử?',
        message: filterClass ? 'Lịch sử của lớp đang chọn sẽ bị xóa.' : 'Toàn bộ lịch sử gọi tên sẽ bị xóa. Hành động này không thể hoàn tác.',
        confirmText: 'Xóa lịch sử', danger: true
      });
      if (!ok) return;
      Store.clearHistory(filterClass);
      App.refresh();
      UI.toast('Đã xóa lịch sử', 'good');
    });
    view.querySelector('[data-history-list]').addEventListener('click', (e) => {
      const del = e.target.closest('[data-del]');
      if (!del) return;
      Store.deleteHistory(del.dataset.del);
      renderList();
      UI.toast('Đã xóa lượt gọi', 'info', 1600);
    });
    renderList();
  }

  /* ==========================================================
     SETTINGS VIEW
     ========================================================== */
  function renderSettings(view) {
    const s = Store.settings;
    view.innerHTML = `<div class="settings-page">
      <div class="settings-grid">

        <section class="panel settings-card">
          <div class="panel-head"><span class="sc-ico">${icon('i-volume')}</span><h3>Âm thanh &amp; giọng nói</h3></div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Hiệu ứng âm thanh</strong><small>Tiếng muỗi vo ve, tiếng reo mừng khi có kết quả…</small></div>
            <div class="setting-ctrl"><label class="switch"><input type="checkbox" data-set="sound" ${s.sound ? 'checked' : ''}/><span class="track"></span></label></div>
          </div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Đọc tên bằng giọng nói</strong><small>Máy đọc tên học sinh sau khi có kết quả.</small></div>
            <div class="setting-ctrl"><label class="switch"><input type="checkbox" data-set="voice" ${s.voice ? 'checked' : ''}/><span class="track"></span></label></div>
          </div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Âm lượng</strong><small>Áp dụng cho hiệu ứng và giọng đọc.</small></div>
            <div class="setting-ctrl" style="min-width:150px">
              <input class="range" type="range" min="0" max="100" value="${Math.round((s.volume || 0) * 100)}" data-volume />
              <span class="range-val" data-volume-val>${Math.round((s.volume || 0) * 100)}%</span>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Nghe thử giọng đọc</strong><small>Kiểm tra loa và giọng tiếng Việt trên thiết bị.</small></div>
            <div class="setting-ctrl"><button class="btn sm soft" data-test-voice>${icon('i-play', 'icon sm')} Nghe thử</button></div>
          </div>
        </section>

        <section class="panel settings-card">
          <div class="panel-head"><span class="sc-ico">${icon('i-shuffle')}</span><h3>Cách gọi tên</h3></div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Số bạn gọi mỗi lượt</strong><small>Áp dụng cho UFO và Đua Vịt (Đập Muỗi gọi 1 bạn).</small></div>
            <div class="setting-ctrl">
              <div class="stepper">
                <button type="button" data-count-minus>−</button>
                <span class="val" data-count-val>${s.count}</span>
                <button type="button" data-count-plus>+</button>
              </div>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Không gọi trùng</strong><small>Trong một vòng, mỗi học sinh chỉ được gọi một lần.</small></div>
            <div class="setting-ctrl"><label class="switch"><input type="checkbox" data-set="noRepeat" ${s.noRepeat ? 'checked' : ''}/><span class="track"></span></label></div>
          </div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Tốc độ trò chơi</strong><small>Tốc độ chạy của Đua Vịt và hiệu ứng gọi tên.</small></div>
            <div class="setting-ctrl">
              <select class="select" data-speed>
                <option value="fast" ${s.speed === 'fast' ? 'selected' : ''}>Nhanh</option>
                <option value="normal" ${s.speed === 'normal' ? 'selected' : ''}>Vừa</option>
                <option value="slow" ${s.speed === 'slow' ? 'selected' : ''}>Thong thả</option>
              </select>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Đặt lại vòng gọi</strong><small>Xóa danh sách đã gọi của tất cả các lớp.</small></div>
            <div class="setting-ctrl"><button class="btn sm ghost" data-reset-rounds>${icon('i-reset', 'icon sm')} Đặt lại</button></div>
          </div>
        </section>

        <section class="panel settings-card">
          <div class="panel-head"><span class="sc-ico">${icon('i-sun')}</span><h3>Giao diện</h3></div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Chế độ hiển thị</strong><small>Chọn giao diện tối hoặc sáng theo sở thích.</small></div>
            <div class="setting-ctrl">
              <div class="segmented" data-theme-choice>
                <button type="button" data-theme="dark" class="${s.theme === 'dark' ? 'active' : ''}">Tối</button>
                <button type="button" data-theme="light" class="${s.theme === 'light' ? 'active' : ''}">Sáng</button>
              </div>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Trải nghiệm toàn màn hình</strong><small>Dùng nút toàn màn hình trong mỗi mini game khi chiếu lên tivi / máy chiếu.</small></div>
            <div class="setting-ctrl"><span class="pill cyan">${icon('i-expand', 'icon xs')} Có sẵn</span></div>
          </div>
        </section>

        <section class="panel settings-card">
          <div class="panel-head"><span class="sc-ico">${icon('i-download')}</span><h3>Dữ liệu của bạn</h3></div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Sao lưu toàn bộ dữ liệu</strong><small>Tải về tệp JSON gồm lớp, học sinh, điểm danh và lịch sử.</small></div>
            <div class="setting-ctrl"><button class="btn sm soft" data-backup>${icon('i-download', 'icon sm')} Tải bản sao lưu</button></div>
          </div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Khôi phục từ bản sao lưu</strong><small>Chọn tệp JSON đã tải trước đó để phục hồi.</small></div>
            <div class="setting-ctrl"><button class="btn sm" data-restore>${icon('i-upload', 'icon sm')} Chọn tệp</button><input type="file" accept=".json,application/json" hidden data-restore-file /></div>
          </div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Dùng dữ liệu mẫu</strong><small>Thêm lớp 8A với 32 học sinh để trải nghiệm nhanh.</small></div>
            <div class="setting-ctrl"><button class="btn sm ghost" data-sample>Thêm lớp mẫu</button></div>
          </div>
          <div class="setting-row">
            <div class="setting-copy"><strong>Xóa toàn bộ dữ liệu</strong><small>Xóa tất cả lớp, học sinh và lịch sử trên trình duyệt này.</small></div>
            <div class="setting-ctrl"><button class="btn sm danger" data-reset-all>${icon('i-trash', 'icon sm')} Xóa hết</button></div>
          </div>
        </section>

        <section class="panel about-card">
          <span class="brand-mark"><svg viewBox="0 0 48 48"><rect x="3" y="3" width="42" height="42" rx="14" fill="url(#brandGrad)"/><path d="m24 11 3.6 7.5 8.4 1.2-6.1 5.9 1.5 8.3-7.4-4-7.4 4 1.5-8.3-6.1-5.9 8.4-1.2z" fill="#fff"/></svg></span>
          <div>
            <h3>Lớp Học Vui · Super App lớp học</h3>
            <p>Bộ ba mini game gọi học sinh trả bài cùng hệ thống quản lý lớp, điểm danh, nhập danh sách từ tệp và lịch sử gọi tên. Toàn bộ dữ liệu được lưu ngay trên trình duyệt của bạn — không cần đăng nhập, không gửi lên máy chủ.</p>
            <div class="about-tips">
              <span class="pill">Phiên bản 1.0</span>
              <span class="pill green">Hoạt động offline</span>
              <span class="pill violet">3 mini game</span>
              <span class="pill amber">Dữ liệu trên máy</span>
            </div>
          </div>
        </section>
      </div>
    </div>`;

    const applyToggle = (key, val) => {
      Store.updateSettings({ [key]: val });
      if (key === 'sound') { Sfx.setEnabled(val); App.updateShell(); }
      if (key === 'voice' && !val) Speech.stop();
    };
    view.querySelectorAll('[data-set]').forEach(el => {
      el.addEventListener('change', () => applyToggle(el.dataset.set, el.checked));
    });

    const vol = view.querySelector('[data-volume]');
    vol.addEventListener('input', () => {
      Store.updateSettings({ volume: Number(vol.value) / 100 });
      view.querySelector('[data-volume-val]').textContent = vol.value + '%';
    });
    vol.addEventListener('change', () => Sfx.tick());

    view.querySelector('[data-test-voice]').addEventListener('click', () => {
      Speech.speak('Xin chào, đây là giọng đọc của Lớp Học Vui. Chúc thầy cô một giờ học vui vẻ.');
      if (!Store.settings.voice) UI.toast('Đang tắt đọc tên — hãy bật “Đọc tên bằng giọng nói”', 'info');
    });

    const countVal = view.querySelector('[data-count-val]');
    view.querySelector('[data-count-minus]').addEventListener('click', () => {
      Store.updateSettings({ count: Utils.clamp(Store.settings.count - 1, 1, 10) });
      countVal.textContent = Store.settings.count; Sfx.tick();
    });
    view.querySelector('[data-count-plus]').addEventListener('click', () => {
      Store.updateSettings({ count: Utils.clamp(Store.settings.count + 1, 1, 10) });
      countVal.textContent = Store.settings.count; Sfx.tick();
    });
    view.querySelector('[data-speed]').addEventListener('change', (e) => Store.updateSettings({ speed: e.target.value }));

    view.querySelector('[data-reset-rounds]').addEventListener('click', async () => {
      const ok = await UI.confirm({ title: 'Đặt lại tất cả vòng gọi?', message: 'Mọi lớp sẽ bắt đầu vòng mới. Điểm danh và lịch sử không thay đổi.', confirmText: 'Đặt lại' });
      if (!ok) return;
      Store.resetAllRounds();
      App.refresh();
      UI.toast('Đã đặt lại vòng gọi cho tất cả lớp', 'good');
    });

    view.querySelectorAll('[data-theme-choice] [data-theme]').forEach(b => {
      b.addEventListener('click', () => {
        Store.updateSettings({ theme: b.dataset.theme });
        App.applyTheme(b.dataset.theme);
        view.querySelectorAll('[data-theme-choice] [data-theme]').forEach(x => x.classList.toggle('active', x === b));
      });
    });

    view.querySelector('[data-backup]').addEventListener('click', () => {
      Utils.download('lop-hoc-vui-backup-' + Utils.dayKey(Date.now()) + '.json', Store.backup(), 'application/json');
      UI.toast('Đã tải bản sao lưu dữ liệu', 'good');
    });

    const restoreFile = view.querySelector('[data-restore-file]');
    view.querySelector('[data-restore]').addEventListener('click', () => restoreFile.click());
    restoreFile.addEventListener('change', async () => {
      const f = restoreFile.files && restoreFile.files[0];
      if (!f) return;
      try {
        const text = await Utils.readFileText(f);
        const ok = await UI.confirm({
          title: 'Khôi phục dữ liệu?',
          message: 'Dữ liệu hiện tại sẽ được thay thế hoàn toàn bằng nội dung trong tệp sao lưu.',
          confirmText: 'Khôi phục', danger: true
        });
        if (!ok) { restoreFile.value = ''; return; }
        const res = Store.restore(text);
        if (!res.ok) { UI.toast(res.error || 'Khôi phục thất bại', 'bad'); restoreFile.value = ''; return; }
        App.applyTheme(Store.settings.theme);
        App.updateShell();
        App.refresh();
        UI.toast(`Đã khôi phục ${res.classes} lớp và ${res.students} học sinh`, 'good', 3600);
      } catch (e) {
        UI.toast('Không đọc được tệp sao lưu', 'bad');
      }
      restoreFile.value = '';
    });

    view.querySelector('[data-sample]').addEventListener('click', () => {
      Store.loadSample();
      App.updateShell();
      App.refresh();
      UI.toast('Đã thêm lớp mẫu 8A', 'good');
    });

    view.querySelector('[data-reset-all]').addEventListener('click', async () => {
      const ok = await UI.confirm({
        title: 'Xóa toàn bộ dữ liệu?',
        message: 'Tất cả lớp học, học sinh, điểm danh và lịch sử sẽ bị xóa vĩnh viễn khỏi trình duyệt này. Hãy sao lưu trước nếu cần.',
        confirmText: 'Xóa tất cả', danger: true
      });
      if (!ok) return;
      Store.resetAll();
      App.updateShell();
      location.hash = '#/dashboard';
      App.refresh();
      UI.toast('Đã xóa toàn bộ dữ liệu', 'good');
    });
  }

  return { openClassForm, openStudentForm, openImport, renderClasses, renderHistory, renderSettings };
})();
