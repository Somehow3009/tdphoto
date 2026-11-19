# Lớp Học Vui — Super App lớp học

Web tĩnh 100% (HTML/CSS/JS thuần, không build, không backend) để gọi tên học sinh
bằng 3 mini game: **Đập Muỗi**, **UFO**, **Đua Vịt**.

- Dữ liệu lưu bằng `localStorage` trên trình duyệt của từng máy.
- Mỗi lượt chơi hiển thị **toàn bộ danh sách học sinh có mặt** của lớp.
- Nhập danh sách từ TXT / CSV / JSON hoặc dán trực tiếp.
- Sao lưu / khôi phục toàn bộ dữ liệu bằng tệp JSON trong trang Cài đặt.

## Chạy local

Mở trực tiếp `index.html` bằng Chrome/Edge, hoặc:

```bash
python -m http.server 5173
# http://localhost:5173
```

## Deploy (Render — Static Site)

Nhánh này chỉ chứa web tĩnh nên có thể tạo **một Static Site mới**:

- Repository: repo hiện tại
- Branch: `edugame`
- Build Command: (để trống)
- Publish Directory: `.`

Nhánh `main` của repo không bị ảnh hưởng, nên site cũ vẫn chạy bình thường.
