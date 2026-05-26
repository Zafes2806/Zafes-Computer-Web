import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, WidthType, AlignmentType, BorderStyle, HeadingLevel,
  ShadingType, VerticalAlign, TableLayoutType,
} from "docx";
import fs from "fs";

// ============================================================
// HELPER — tạo border cho cell
// ============================================================
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

const headerShading = {
  type: ShadingType.CLEAR,
  fill: "B8CCE4", // xanh nhạt giống mẫu
};

// ============================================================
// HELPER — tạo header cell
// ============================================================
function headerCell(text, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    shading: headerShading,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text, bold: true, size: 26, font: "Times New Roman" })],
      }),
    ],
  });
}

// ============================================================
// HELPER — tạo data cell
// ============================================================
function dataCell(text, widthPct, bold = false) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: String(text), bold, size: 26, font: "Times New Roman" })],
      }),
    ],
  });
}

// ============================================================
// HELPER — tạo bảng danh sách tổng hợp (STT | Tên bảng | Mô tả)
// ============================================================
function createSummaryTable(rows) {
  const headerRow = new TableRow({
    children: [
      headerCell("STT", 10),
      headerCell("Tên bảng", 30),
      headerCell("Mô tả", 60),
    ],
  });
  const dataRows = rows.map(
    (r, i) =>
      new TableRow({
        children: [
          dataCell(i + 1, 10),
          dataCell(r.name, 30, true),
          dataCell(r.desc, 60),
        ],
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

// ============================================================
// HELPER — tạo bảng chi tiết (STT | Tên trường | Kiểu dữ liệu | Ghi chú)
// ============================================================
function createDetailTable(fields) {
  const headerRow = new TableRow({
    children: [
      headerCell("STT", 8),
      headerCell("Tên trường", 27),
      headerCell("Kiểu dữ liệu", 22),
      headerCell("Ghi chú", 43),
    ],
  });
  const dataRows = fields.map(
    (f, i) =>
      new TableRow({
        children: [
          dataCell(i + 1, 8),
          dataCell(f.name, 27, true),
          dataCell(f.type, 22),
          dataCell(f.note, 43),
        ],
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

// ============================================================
// HELPER — tạo bảng FK (STT | Bảng nguồn | Trường | Bảng đích | Trường đích | Loại)
// ============================================================
function createFKTable(fks) {
  const headerRow = new TableRow({
    children: [
      headerCell("STT", 6),
      headerCell("Bảng nguồn", 20),
      headerCell("Trường", 20),
      headerCell("Bảng đích", 20),
      headerCell("Trường đích", 18),
      headerCell("Loại quan hệ", 16),
    ],
  });
  const dataRows = fks.map(
    (f, i) =>
      new TableRow({
        children: [
          dataCell(i + 1, 6),
          dataCell(f.src, 20),
          dataCell(f.field, 20),
          dataCell(f.dst, 20),
          dataCell(f.dstField, 18),
          dataCell(f.rel, 16),
        ],
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

// ============================================================
// Tiện ích tạo paragraph
// ============================================================
function heading(text, level = HeadingLevel.HEADING_2) {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Times New Roman" })],
  });
}

function normalText(text, italic = false) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 26, font: "Times New Roman", italics: italic })],
  });
}

function captionText(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 200 },
    children: [new TextRun({ text, size: 26, font: "Times New Roman", italics: true })],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { before: 40, after: 40 }, children: [] });
}

// ============================================================
// DỮ LIỆU
// ============================================================

const summaryRows = [
  { name: "users", desc: "Lưu thông tin và tài khoản của người dùng." },
  { name: "products", desc: "Lưu thông tin các sản phẩm (linh kiện, PC, phụ kiện)." },
  { name: "categories", desc: "Lưu thông tin các danh mục sản phẩm." },
  { name: "component_types", desc: "Lưu thông tin các loại linh kiện máy tính." },
  { name: "spec_definitions", desc: "Lưu định nghĩa thông số kỹ thuật theo loại linh kiện." },
  { name: "product_specs", desc: "Lưu thông số kỹ thuật chi tiết của từng sản phẩm." },
  { name: "pc_configurations", desc: "Lưu cấu hình chi tiết PC nguyên bộ." },
  { name: "cart_items", desc: "Lưu thông tin giỏ hàng thông thường." },
  { name: "build_pc_cart_items", desc: "Lưu thông tin giỏ hàng Build PC." },
  { name: "orders", desc: "Lưu thông tin đơn hàng." },
  { name: "order_items", desc: "Lưu chi tiết sản phẩm trong đơn hàng." },
  { name: "payment_attempts", desc: "Lưu lịch sử các lần thử thanh toán (VNPAY, MOMO)." },
  { name: "product_reviews", desc: "Lưu các bình luận hoặc đánh giá của khách hàng về sản phẩm." },
  { name: "refresh_tokens", desc: "Lưu thông tin khóa bí mật duy trì phiên đăng nhập." },
  { name: "otp_codes", desc: "Lưu thông tin OTP xác thực tài khoản." },
  { name: "recently_viewed", desc: "Lưu thông tin sản phẩm khách hàng đã xem." },
  { name: "contacts", desc: "Lưu thông tin về liên hệ tư vấn khách hàng." },
  { name: "blog_posts", desc: "Lưu thông tin bài viết blog / tin tức." },
];

const tables = [
  {
    id: "3.2.3.1",
    name: "component_types",
    desc: "Bảng lưu trữ thông tin các loại linh kiện máy tính (CPU, RAM, VGA, Mainboard, SSD...).",
    caption: "Bảng 3.4 Bảng component_types",
    fields: [
      { name: "code", type: "varchar(50)", note: 'Mã loại linh kiện (khóa chính). VD: cpu, ram, vga, ssd' },
      { name: "name", type: "varchar(100)", note: "Tên loại linh kiện" },
      { name: "is_product_type", type: "tinyint(1)", note: "Đánh dấu là loại sản phẩm (mặc định: 1)" },
      { name: "is_build_pc_allowed", type: "tinyint(1)", note: "Cho phép dùng trong Build PC (mặc định: 1)" },
      { name: "status", type: "varchar(20)", note: 'Trạng thái (mặc định: "active")' },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
      { name: "deleted_at", type: "datetime", note: "Thời gian xóa mềm" },
    ],
  },
  {
    id: "3.2.3.2",
    name: "categories",
    desc: "Bảng lưu trữ danh mục sản phẩm (PC Gaming, Linh kiện, Văn phòng...).",
    caption: "Bảng 3.5 Bảng categories",
    fields: [
      { name: "id", type: "char(36)", note: "Mã danh mục (khóa chính, UUID)" },
      { name: "name", type: "varchar(255)", note: "Tên danh mục" },
      { name: "image", type: "varchar(255)", note: "Ảnh danh mục" },
      { name: "status", type: "varchar(20)", note: 'Trạng thái (mặc định: "active")' },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
      { name: "deleted_at", type: "datetime", note: "Thời gian xóa mềm" },
    ],
  },
  {
    id: "3.2.3.3",
    name: "spec_definitions",
    desc: "Bảng định nghĩa thông số kỹ thuật theo loại linh kiện.",
    caption: "Bảng 3.6 Bảng spec_definitions",
    fields: [
      { name: "id", type: "int", note: "Mã định nghĩa thông số (khóa chính, tự tăng)" },
      { name: "component_type", type: "varchar(50)", note: "Mã loại linh kiện (FK → component_types.code)" },
      { name: "spec_key", type: "varchar(100)", note: "Khóa thông số kỹ thuật" },
      { name: "label", type: "varchar(100)", note: "Nhãn hiển thị thông số" },
      { name: "options", type: "json", note: "Danh sách tùy chọn giá trị" },
      { name: "display_order", type: "int", note: "Thứ tự hiển thị (mặc định: 0)" },
      { name: "status", type: "varchar(20)", note: 'Trạng thái (mặc định: "active")' },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
      { name: "deleted_at", type: "datetime", note: "Thời gian xóa mềm" },
    ],
  },
  {
    id: "3.2.3.4",
    name: "users",
    desc: "Bảng lưu trữ thông tin tài khoản người dùng (khách hàng và quản trị viên).",
    caption: "Bảng 3.7 Bảng users",
    fields: [
      { name: "id", type: "char(36)", note: "Mã người dùng (khóa chính, UUID)" },
      { name: "full_name", type: "varchar(255)", note: "Họ tên người dùng" },
      { name: "phone", type: "varchar(255)", note: "Số điện thoại" },
      { name: "address", type: "varchar(255)", note: "Địa chỉ" },
      { name: "email", type: "varchar(255)", note: "Email (duy nhất, UNIQUE)" },
      { name: "password", type: "varchar(255)", note: "Mật khẩu đã mã hóa" },
      { name: "status", type: "varchar(20)", note: 'Trạng thái (mặc định: "active")' },
      { name: "is_admin", type: "tinyint(1)", note: "Đánh dấu quản trị viên (mặc định: 0)" },
      { name: "auth_provider", type: "varchar(20)", note: "Phương thức xác thực (google | email)" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
      { name: "deleted_at", type: "datetime", note: "Thời gian xóa mềm" },
    ],
  },
  {
    id: "3.2.3.5",
    name: "products",
    desc: "Bảng lưu trữ thông tin sản phẩm (linh kiện, PC nguyên bộ, phụ kiện...).",
    caption: "Bảng 3.8 Bảng products",
    fields: [
      { name: "id", type: "char(36)", note: "Mã sản phẩm (khóa chính, UUID)" },
      { name: "name", type: "varchar(255)", note: "Tên sản phẩm" },
      { name: "price", type: "decimal(15,0)", note: "Giá sản phẩm" },
      { name: "description", type: "text", note: "Mô tả sản phẩm" },
      { name: "discount", type: "int", note: "Phần trăm giảm giá (mặc định: 0)" },
      { name: "images", type: "text", note: "Danh sách ảnh sản phẩm" },
      { name: "category_id", type: "char(36)", note: "Mã danh mục (FK → categories.id)" },
      { name: "stock", type: "int", note: "Số lượng tồn kho (mặc định: 0)" },
      { name: "component_type", type: "varchar(50)", note: "Loại linh kiện (FK → component_types.code)" },
      { name: "status", type: "varchar(20)", note: 'Trạng thái (mặc định: "active")' },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
      { name: "deleted_at", type: "datetime", note: "Thời gian xóa mềm" },
    ],
  },
  {
    id: "3.2.3.6",
    name: "refresh_tokens",
    desc: "Bảng lưu trữ JWT Refresh Token để duy trì phiên đăng nhập.",
    caption: "Bảng 3.9 Bảng refresh_tokens",
    fields: [
      { name: "id", type: "char(36)", note: "Mã token (khóa chính, UUID)" },
      { name: "user_id", type: "char(36)", note: "Mã người dùng (FK → users.id)" },
      { name: "token_hash", type: "varchar(64)", note: "Chuỗi hash của token (UNIQUE)" },
      { name: "expires_at", type: "datetime", note: "Thời gian hết hạn" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
    ],
  },
  {
    id: "3.2.3.7",
    name: "otp_codes",
    desc: "Bảng lưu trữ mã OTP gửi qua email (quên mật khẩu, xác thực).",
    caption: "Bảng 3.10 Bảng otp_codes",
    fields: [
      { name: "id", type: "int", note: "Mã OTP (khóa chính, tự tăng)" },
      { name: "email", type: "varchar(255)", note: "Email nhận OTP" },
      { name: "otp", type: "varchar(255)", note: "Mã OTP đã mã hóa" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
    ],
  },
  {
    id: "3.2.3.8",
    name: "cart_items",
    desc: "Bảng lưu trữ giỏ hàng thông thường của người dùng đã đăng nhập.",
    caption: "Bảng 3.11 Bảng cart_items",
    fields: [
      { name: "id", type: "char(36)", note: "Mã giỏ hàng (khóa chính, UUID)" },
      { name: "user_id", type: "char(36)", note: "Mã người dùng (FK → users.id)" },
      { name: "product_id", type: "char(36)", note: "Mã sản phẩm (FK → products.id)" },
      { name: "quantity", type: "int", note: "Số lượng sản phẩm" },
      { name: "total_price", type: "int", note: "Tổng giá" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
    ],
  },
  {
    id: "3.2.3.9",
    name: "build_pc_cart_items",
    desc: "Bảng lưu trữ giỏ hàng Build PC — mỗi slot loại linh kiện cho mỗi người dùng.",
    caption: "Bảng 3.12 Bảng build_pc_cart_items",
    fields: [
      { name: "id", type: "char(36)", note: "Mã mục Build PC (khóa chính, UUID)" },
      { name: "product_id", type: "char(36)", note: "Mã sản phẩm (FK → products.id)" },
      { name: "component_type", type: "varchar(50)", note: "Loại linh kiện (FK → component_types.code)" },
      { name: "user_id", type: "char(36)", note: "Mã người dùng (FK → users.id)" },
      { name: "quantity", type: "int", note: "Số lượng" },
      { name: "total_price", type: "int", note: "Tổng giá" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
    ],
  },
  {
    id: "3.2.3.10",
    name: "recently_viewed",
    desc: "Bảng lưu trữ sản phẩm đã xem gần đây — tối đa 24 sản phẩm, thời gian sống 60 ngày.",
    caption: "Bảng 3.13 Bảng recently_viewed",
    fields: [
      { name: "id", type: "char(36)", note: "Mã bản ghi (khóa chính, UUID)" },
      { name: "user_id", type: "char(36)", note: "Mã người dùng (FK → users.id)" },
      { name: "product_id", type: "char(36)", note: "Mã sản phẩm (FK → products.id)" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
    ],
  },
  {
    id: "3.2.3.11",
    name: "product_specs",
    desc: "Bảng lưu trữ thông số kỹ thuật chi tiết của sản phẩm (brand, socket...).",
    caption: "Bảng 3.14 Bảng product_specs",
    fields: [
      { name: "id", type: "int", note: "Mã thông số (khóa chính, tự tăng)" },
      { name: "product_id", type: "char(36)", note: "Mã sản phẩm (FK → products.id)" },
      { name: "spec_key", type: "varchar(100)", note: "Khóa thông số kỹ thuật" },
      { name: "spec_value", type: "varchar(255)", note: "Giá trị thông số kỹ thuật" },
    ],
  },
  {
    id: "3.2.3.12",
    name: "pc_configurations",
    desc: "Bảng lưu trữ cấu hình chi tiết PC nguyên bộ (quan hệ 1-1 với bảng products).",
    caption: "Bảng 3.15 Bảng pc_configurations",
    fields: [
      { name: "id", type: "char(36)", note: "Mã cấu hình (khóa chính, UUID)" },
      { name: "product_id", type: "char(36)", note: "Mã sản phẩm (FK → products.id, UNIQUE, quan hệ 1-1)" },
      { name: "cpu", type: "text", note: "Thông tin CPU" },
      { name: "motherboard", type: "text", note: "Thông tin Mainboard" },
      { name: "ram", type: "text", note: "Thông tin RAM" },
      { name: "storage", type: "text", note: "Thông tin ổ cứng" },
      { name: "gpu", type: "text", note: "Thông tin Card đồ họa" },
      { name: "power", type: "text", note: "Thông tin Nguồn" },
      { name: "computer_case", type: "text", note: "Thông tin Vỏ case" },
      { name: "cooler", type: "text", note: "Thông tin Tản nhiệt" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
    ],
  },
  {
    id: "3.2.3.13",
    name: "orders",
    desc: "Bảng lưu trữ đơn hàng — hỗ trợ cả khách đã đăng nhập và khách vãng lai.",
    caption: "Bảng 3.16 Bảng orders",
    fields: [
      { name: "id", type: "char(36)", note: "Mã đơn hàng (khóa chính, UUID)" },
      { name: "order_code", type: "varchar(255)", note: "Mã đơn hàng hiển thị (UNIQUE)" },
      { name: "user_id", type: "char(36)", note: "Mã người dùng (FK → users.id, NULL = khách vãng lai)" },
      { name: "full_name", type: "varchar(255)", note: "Họ tên người đặt hàng" },
      { name: "phone", type: "varchar(255)", note: "Số điện thoại" },
      { name: "address", type: "varchar(255)", note: "Địa chỉ giao hàng" },
      { name: "email", type: "varchar(255)", note: "Email người đặt hàng" },
      { name: "total_price", type: "int", note: "Tổng giá đơn hàng" },
      { name: "status", type: "varchar(50)", note: 'Trạng thái đơn hàng (mặc định: "pending")' },
      { name: "return_reason", type: "text", note: "Lý do trả hàng" },
      { name: "admin_note", type: "text", note: "Ghi chú của quản trị viên" },
      { name: "delivered_at", type: "datetime", note: "Thời gian giao hàng" },
      { name: "completed_at", type: "datetime", note: "Thời gian hoàn thành" },
      { name: "cancelled_at", type: "datetime", note: "Thời gian hủy" },
      { name: "return_requested_at", type: "datetime", note: "Thời gian yêu cầu trả hàng" },
      { name: "return_rejected_at", type: "datetime", note: "Thời gian từ chối trả hàng" },
      { name: "returned_at", type: "datetime", note: "Thời gian đã trả hàng" },
      { name: "refunded_at", type: "datetime", note: "Thời gian hoàn tiền" },
      { name: "payment_method", type: "varchar(255)", note: "Phương thức thanh toán" },
      { name: "guest_access_token_hash", type: "varchar(255)", note: "Hash token truy cập cho khách vãng lai" },
      { name: "guest_access_token_expires_at", type: "datetime", note: "Thời gian hết hạn token khách vãng lai" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
    ],
  },
  {
    id: "3.2.3.14",
    name: "order_items",
    desc: "Bảng lưu trữ chi tiết sản phẩm trong đơn hàng (lưu snapshot sản phẩm tại thời điểm đặt).",
    caption: "Bảng 3.17 Bảng order_items",
    fields: [
      { name: "id", type: "char(36)", note: "Mã chi tiết đơn hàng (khóa chính, UUID)" },
      { name: "order_id", type: "char(36)", note: "Mã đơn hàng (FK → orders.id)" },
      { name: "product_id", type: "char(36)", note: "Mã sản phẩm (FK → products.id)" },
      { name: "product_name", type: "varchar(255)", note: "Tên sản phẩm tại thời điểm đặt" },
      { name: "product_images", type: "text", note: "Ảnh sản phẩm tại thời điểm đặt" },
      { name: "product_snapshot", type: "json", note: "Snapshot toàn bộ thông tin sản phẩm" },
      { name: "unit_price", type: "int", note: "Đơn giá" },
      { name: "discount", type: "int", note: "Phần trăm giảm giá (mặc định: 0)" },
      { name: "quantity", type: "int", note: "Số lượng" },
      { name: "line_total", type: "int", note: "Thành tiền" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
    ],
  },
  {
    id: "3.2.3.15",
    name: "payment_attempts",
    desc: "Bảng lưu trữ lịch sử các lần thử thanh toán (VNPAY, MOMO).",
    caption: "Bảng 3.18 Bảng payment_attempts",
    fields: [
      { name: "id", type: "char(36)", note: "Mã lần thanh toán (khóa chính, UUID)" },
      { name: "order_id", type: "char(36)", note: "Mã đơn hàng (FK → orders.id)" },
      { name: "order_code", type: "varchar(255)", note: "Mã đơn hàng tham chiếu" },
      { name: "provider", type: "varchar(10)", note: "Nhà cung cấp thanh toán (MOMO | VNPAY)" },
      { name: "amount", type: "int", note: "Số tiền thanh toán" },
      { name: "status", type: "varchar(20)", note: 'Trạng thái (mặc định: "pending")' },
      { name: "gateway_request_id", type: "varchar(255)", note: "Mã yêu cầu từ cổng thanh toán" },
      { name: "gateway_transaction_id", type: "varchar(255)", note: "Mã giao dịch từ cổng thanh toán" },
      { name: "payment_url", type: "text", note: "URL trang thanh toán" },
      { name: "failure_reason", type: "text", note: "Lý do thất bại" },
      { name: "refund_note", type: "text", note: "Ghi chú hoàn tiền" },
      { name: "refunded_at", type: "datetime", note: "Thời gian hoàn tiền" },
      { name: "raw_request", type: "json", note: "Dữ liệu yêu cầu gốc" },
      { name: "raw_response", type: "json", note: "Dữ liệu phản hồi gốc" },
      { name: "raw_callback", type: "json", note: "Dữ liệu callback gốc" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
    ],
  },
  {
    id: "3.2.3.16",
    name: "product_reviews",
    desc: "Bảng lưu trữ đánh giá sản phẩm — người dùng phải mua hàng mới được đánh giá.",
    caption: "Bảng 3.19 Bảng product_reviews",
    fields: [
      { name: "id", type: "char(36)", note: "Mã đánh giá (khóa chính, UUID)" },
      { name: "user_id", type: "char(36)", note: "Mã người dùng (FK → users.id)" },
      { name: "product_id", type: "char(36)", note: "Mã sản phẩm (FK → products.id)" },
      { name: "order_id", type: "char(36)", note: "Mã đơn hàng (FK → orders.id, có thể NULL)" },
      { name: "rating", type: "int", note: "Điểm đánh giá" },
      { name: "content", type: "text", note: "Nội dung đánh giá" },
      { name: "status", type: "varchar(20)", note: 'Trạng thái duyệt (mặc định: "pending")' },
      { name: "reviewed_at", type: "datetime", note: "Thời gian duyệt" },
      { name: "reviewed_by_user_id", type: "char(36)", note: "Mã admin đã duyệt" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
      { name: "deleted_at", type: "datetime", note: "Thời gian xóa mềm" },
    ],
  },
  {
    id: "3.2.3.17",
    name: "contacts",
    desc: "Bảng lưu trữ form tư vấn từ khách hàng — không liên kết tài khoản.",
    caption: "Bảng 3.20 Bảng contacts",
    fields: [
      { name: "id", type: "char(36)", note: "Mã liên hệ (khóa chính, UUID)" },
      { name: "full_name", type: "varchar(255)", note: "Họ tên khách hàng" },
      { name: "phone", type: "varchar(255)", note: "Số điện thoại" },
      { name: "purchase_intent", type: "text", note: "Nhu cầu mua hàng" },
      { name: "purpose", type: "text", note: "Mục đích sử dụng" },
      { name: "budget", type: "text", note: "Ngân sách" },
      { name: "delivery_option", type: "text", note: "Hình thức nhận hàng" },
      { name: "status", type: "varchar(20)", note: 'Trạng thái (mặc định: "new")' },
      { name: "admin_note", type: "text", note: "Ghi chú của quản trị viên" },
      { name: "handled_at", type: "datetime", note: "Thời gian xử lý" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
      { name: "deleted_at", type: "datetime", note: "Thời gian xóa mềm" },
    ],
  },
  {
    id: "3.2.3.18",
    name: "blog_posts",
    desc: "Bảng lưu trữ bài viết blog / tin tức.",
    caption: "Bảng 3.21 Bảng blog_posts",
    fields: [
      { name: "id", type: "char(36)", note: "Mã bài viết (khóa chính, UUID)" },
      { name: "title", type: "varchar(255)", note: "Tiêu đề bài viết" },
      { name: "content", type: "text", note: "Nội dung bài viết" },
      { name: "cover_image", type: "varchar(255)", note: "Ảnh bìa bài viết" },
      { name: "status", type: "varchar(20)", note: 'Trạng thái (mặc định: "draft")' },
      { name: "published_at", type: "datetime", note: "Thời gian xuất bản" },
      { name: "created_at", type: "datetime", note: "Thời gian tạo" },
      { name: "updated_at", type: "datetime", note: "Thời gian cập nhật" },
      { name: "deleted_at", type: "datetime", note: "Thời gian xóa mềm" },
    ],
  },
];

const fkData = [
  { src: "spec_definitions", field: "component_type", dst: "component_types", dstField: "code", rel: "N - 1" },
  { src: "products", field: "category_id", dst: "categories", dstField: "id", rel: "N - 1" },
  { src: "products", field: "component_type", dst: "component_types", dstField: "code", rel: "N - 1" },
  { src: "refresh_tokens", field: "user_id", dst: "users", dstField: "id", rel: "N - 1" },
  { src: "cart_items", field: "user_id", dst: "users", dstField: "id", rel: "N - 1" },
  { src: "cart_items", field: "product_id", dst: "products", dstField: "id", rel: "N - 1" },
  { src: "build_pc_cart_items", field: "user_id", dst: "users", dstField: "id", rel: "N - 1" },
  { src: "build_pc_cart_items", field: "product_id", dst: "products", dstField: "id", rel: "N - 1" },
  { src: "build_pc_cart_items", field: "component_type", dst: "component_types", dstField: "code", rel: "N - 1" },
  { src: "recently_viewed", field: "user_id", dst: "users", dstField: "id", rel: "N - 1" },
  { src: "recently_viewed", field: "product_id", dst: "products", dstField: "id", rel: "N - 1" },
  { src: "product_specs", field: "product_id", dst: "products", dstField: "id", rel: "N - 1" },
  { src: "pc_configurations", field: "product_id", dst: "products", dstField: "id", rel: "1 - 1" },
  { src: "orders", field: "user_id", dst: "users", dstField: "id", rel: "N - 1" },
  { src: "order_items", field: "order_id", dst: "orders", dstField: "id", rel: "N - 1" },
  { src: "order_items", field: "product_id", dst: "products", dstField: "id", rel: "N - 1" },
  { src: "payment_attempts", field: "order_id", dst: "orders", dstField: "id", rel: "N - 1" },
  { src: "product_reviews", field: "user_id", dst: "users", dstField: "id", rel: "N - 1" },
  { src: "product_reviews", field: "product_id", dst: "products", dstField: "id", rel: "N - 1" },
  { src: "product_reviews", field: "order_id", dst: "orders", dstField: "id", rel: "N - 1" },
];

// ============================================================
// BUILD DOCUMENT
// ============================================================
const children = [];

// --- 3.2.2 Danh sách các bảng ---
children.push(heading("3.2.2. Danh sách các bảng", HeadingLevel.HEADING_1));
children.push(normalText("Hệ thống Zafes Computer sử dụng cơ sở dữ liệu MySQL với 18 bảng dữ liệu. Bảng dưới đây liệt kê tổng quan các bảng trong hệ thống:"));
children.push(emptyLine());
children.push(createSummaryTable(summaryRows));
children.push(captionText("Bảng 3.3 Danh sách các bảng dữ liệu"));

// --- 3.2.3 Mô tả chi tiết ---
children.push(heading("3.2.3. Mô tả chi tiết các bảng trong cơ sở dữ liệu", HeadingLevel.HEADING_1));

for (const t of tables) {
  children.push(heading(`${t.id}. Bảng ${t.name}`, HeadingLevel.HEADING_2));
  children.push(normalText(t.desc, true));
  children.push(emptyLine());
  children.push(createDetailTable(t.fields));
  children.push(captionText(t.caption));
}

// --- 3.2.4 Foreign Keys ---
children.push(heading("3.2.4. Các mối quan hệ giữa các bảng (Foreign Keys)", HeadingLevel.HEADING_1));
children.push(emptyLine());
children.push(createFKTable(fkData));
children.push(captionText("Bảng 3.22 Các mối quan hệ Foreign Key trong cơ sở dữ liệu"));

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Times New Roman", size: 26 },
      },
    },
  },
  sections: [{ children }],
});

// ============================================================
// WRITE FILE
// ============================================================
const outputPath = "f:\\GTVT\\HocKy_2025-2026_2\\DoAnTotNghiep\\Zafes-Computer-web\\BaoCao_CoSoDuLieu.docx";
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buffer);
console.log(`✅ Đã xuất file Word thành công: ${outputPath}`);
