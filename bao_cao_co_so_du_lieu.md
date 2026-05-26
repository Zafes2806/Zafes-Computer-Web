# 3.2.2. Danh sách các bảng

Hệ thống Zafes Computer sử dụng cơ sở dữ liệu MySQL với 18 bảng dữ liệu. Bảng dưới đây liệt kê tổng quan các bảng trong hệ thống:

| STT | Tên bảng | Mô tả |
|-----|---------|-------|
| 1 | users | Lưu thông tin và tài khoản của người dùng. |
| 2 | products | Lưu thông tin các sản phẩm (linh kiện, PC, phụ kiện). |
| 3 | categories | Lưu thông tin các danh mục sản phẩm. |
| 4 | component_types | Lưu thông tin các loại linh kiện máy tính. |
| 5 | spec_definitions | Lưu định nghĩa thông số kỹ thuật theo loại linh kiện. |
| 6 | product_specs | Lưu thông số kỹ thuật chi tiết của từng sản phẩm. |
| 7 | pc_configurations | Lưu cấu hình chi tiết PC nguyên bộ. |
| 8 | cart_items | Lưu thông tin giỏ hàng thông thường. |
| 9 | build_pc_cart_items | Lưu thông tin giỏ hàng Build PC. |
| 10 | orders | Lưu thông tin đơn hàng. |
| 11 | order_items | Lưu chi tiết sản phẩm trong đơn hàng. |
| 12 | payment_attempts | Lưu lịch sử các lần thử thanh toán (VNPAY, MOMO). |
| 13 | product_reviews | Lưu các bình luận hoặc đánh giá của khách hàng về sản phẩm. |
| 14 | refresh_tokens | Lưu thông tin khóa bí mật duy trì phiên đăng nhập. |
| 15 | otp_codes | Lưu thông tin OTP xác thực tài khoản. |
| 16 | recently_viewed | Lưu thông tin sản phẩm khách hàng đã xem. |
| 17 | contacts | Lưu thông tin về liên hệ tư vấn khách hàng. |
| 18 | blog_posts | Lưu thông tin bài viết blog / tin tức. |

*Bảng 3.3 Danh sách các bảng dữ liệu*

---

# 3.2.3. Mô tả chi tiết các bảng trong cơ sở dữ liệu

---

## 3.2.3.1. Bảng component_types

Bảng lưu trữ thông tin các loại linh kiện máy tính (CPU, RAM, VGA, Mainboard, SSD...).

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | code | varchar(50) | Mã loại linh kiện (khóa chính). VD: cpu, ram, vga, ssd |
| 2 | name | varchar(100) | Tên loại linh kiện |
| 3 | is_product_type | tinyint(1) | Đánh dấu là loại sản phẩm (mặc định: 1) |
| 4 | is_build_pc_allowed | tinyint(1) | Cho phép dùng trong Build PC (mặc định: 1) |
| 5 | status | varchar(20) | Trạng thái (mặc định: "active") |
| 6 | created_at | datetime | Thời gian tạo |
| 7 | updated_at | datetime | Thời gian cập nhật |
| 8 | deleted_at | datetime | Thời gian xóa mềm |

*Bảng 3.1 Bảng component_types*

---

## 3.2.3.2. Bảng categories

Bảng lưu trữ danh mục sản phẩm (PC Gaming, Linh kiện, Văn phòng...).

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã danh mục (khóa chính, UUID) |
| 2 | name | varchar(255) | Tên danh mục |
| 3 | image | varchar(255) | Ảnh danh mục |
| 4 | status | varchar(20) | Trạng thái (mặc định: "active") |
| 5 | created_at | datetime | Thời gian tạo |
| 6 | updated_at | datetime | Thời gian cập nhật |
| 7 | deleted_at | datetime | Thời gian xóa mềm |

*Bảng 3.2 Bảng categories*

---

## 3.2.3.3. Bảng spec_definitions

Bảng định nghĩa thông số kỹ thuật theo loại linh kiện.

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | int | Mã định nghĩa thông số (khóa chính, tự tăng) |
| 2 | component_type | varchar(50) | Mã loại linh kiện (FK → component_types.code) |
| 3 | spec_key | varchar(100) | Khóa thông số kỹ thuật |
| 4 | label | varchar(100) | Nhãn hiển thị thông số |
| 5 | options | json | Danh sách tùy chọn giá trị |
| 6 | display_order | int | Thứ tự hiển thị (mặc định: 0) |
| 7 | status | varchar(20) | Trạng thái (mặc định: "active") |
| 8 | created_at | datetime | Thời gian tạo |
| 9 | updated_at | datetime | Thời gian cập nhật |
| 10 | deleted_at | datetime | Thời gian xóa mềm |

*Bảng 3.3 Bảng spec_definitions*

> [!NOTE]
> Ràng buộc UNIQUE: (component_type, spec_key) — mỗi loại linh kiện chỉ có một spec_key duy nhất.

---

## 3.2.3.4. Bảng users

Bảng lưu trữ thông tin tài khoản người dùng (khách hàng và quản trị viên).

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã người dùng (khóa chính, UUID) |
| 2 | full_name | varchar(255) | Họ tên người dùng |
| 3 | phone | varchar(255) | Số điện thoại |
| 4 | address | varchar(255) | Địa chỉ |
| 5 | email | varchar(255) | Email (duy nhất, UNIQUE) |
| 6 | password | varchar(255) | Mật khẩu đã mã hóa |
| 7 | status | varchar(20) | Trạng thái (mặc định: "active") |
| 8 | is_admin | tinyint(1) | Đánh dấu quản trị viên (mặc định: 0) |
| 9 | auth_provider | varchar(20) | Phương thức xác thực (google \| email) |
| 10 | created_at | datetime | Thời gian tạo |
| 11 | updated_at | datetime | Thời gian cập nhật |
| 12 | deleted_at | datetime | Thời gian xóa mềm |

*Bảng 3.4 Bảng users*

---

## 3.2.3.5. Bảng products

Bảng lưu trữ thông tin sản phẩm (linh kiện, PC nguyên bộ, phụ kiện...).

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã sản phẩm (khóa chính, UUID) |
| 2 | name | varchar(255) | Tên sản phẩm |
| 3 | price | decimal(15,0) | Giá sản phẩm |
| 4 | description | text | Mô tả sản phẩm |
| 5 | discount | int | Phần trăm giảm giá (mặc định: 0) |
| 6 | images | text | Danh sách ảnh sản phẩm |
| 7 | category_id | char(36) | Mã danh mục (FK → categories.id) |
| 8 | stock | int | Số lượng tồn kho (mặc định: 0) |
| 9 | component_type | varchar(50) | Loại linh kiện (FK → component_types.code) |
| 10 | status | varchar(20) | Trạng thái (mặc định: "active") |
| 11 | created_at | datetime | Thời gian tạo |
| 12 | updated_at | datetime | Thời gian cập nhật |
| 13 | deleted_at | datetime | Thời gian xóa mềm |

*Bảng 3.5 Bảng products*

---

## 3.2.3.6. Bảng refresh_tokens

Bảng lưu trữ JWT Refresh Token để duy trì phiên đăng nhập.

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã token (khóa chính, UUID) |
| 2 | user_id | char(36) | Mã người dùng (FK → users.id) |
| 3 | token_hash | varchar(64) | Chuỗi hash của token (UNIQUE) |
| 4 | expires_at | datetime | Thời gian hết hạn |
| 5 | created_at | datetime | Thời gian tạo |
| 6 | updated_at | datetime | Thời gian cập nhật |

*Bảng 3.6 Bảng refresh_tokens*

---

## 3.2.3.7. Bảng otp_codes

Bảng lưu trữ mã OTP gửi qua email (quên mật khẩu, xác thực).

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | int | Mã OTP (khóa chính, tự tăng) |
| 2 | email | varchar(255) | Email nhận OTP (không FK — chỉ lưu email tạm) |
| 3 | otp | varchar(255) | Mã OTP đã mã hóa |
| 4 | created_at | datetime | Thời gian tạo |
| 5 | updated_at | datetime | Thời gian cập nhật |

*Bảng 3.7 Bảng otp_codes*

---

## 3.2.3.8. Bảng cart_items

Bảng lưu trữ giỏ hàng thông thường của người dùng đã đăng nhập.

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã giỏ hàng (khóa chính, UUID) |
| 2 | user_id | char(36) | Mã người dùng (FK → users.id) |
| 3 | product_id | char(36) | Mã sản phẩm (FK → products.id) |
| 4 | quantity | int | Số lượng sản phẩm |
| 5 | total_price | int | Tổng giá |
| 6 | created_at | datetime | Thời gian tạo |
| 7 | updated_at | datetime | Thời gian cập nhật |

*Bảng 3.8 Bảng cart_items*

> [!NOTE]
> Ràng buộc UNIQUE: (user_id, product_id) — mỗi người dùng chỉ có một bản ghi cho mỗi sản phẩm trong giỏ.

---

## 3.2.3.9. Bảng build_pc_cart_items

Bảng lưu trữ giỏ hàng Build PC — mỗi slot loại linh kiện cho mỗi người dùng.

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã mục Build PC (khóa chính, UUID) |
| 2 | product_id | char(36) | Mã sản phẩm (FK → products.id) |
| 3 | component_type | varchar(50) | Loại linh kiện (FK → component_types.code) |
| 4 | user_id | char(36) | Mã người dùng (FK → users.id) |
| 5 | quantity | int | Số lượng |
| 6 | total_price | int | Tổng giá |
| 7 | created_at | datetime | Thời gian tạo |
| 8 | updated_at | datetime | Thời gian cập nhật |

*Bảng 3.9 Bảng build_pc_cart_items*

> [!NOTE]
> Ràng buộc UNIQUE: (user_id, product_id) và (user_id, component_type) — mỗi người dùng chỉ có một sản phẩm cho mỗi loại linh kiện.

---

## 3.2.3.10. Bảng recently_viewed

Bảng lưu trữ sản phẩm đã xem gần đây — tối đa 24 sản phẩm, thời gian sống 60 ngày.

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã bản ghi (khóa chính, UUID) |
| 2 | user_id | char(36) | Mã người dùng (FK → users.id) |
| 3 | product_id | char(36) | Mã sản phẩm (FK → products.id) |
| 4 | created_at | datetime | Thời gian tạo |
| 5 | updated_at | datetime | Thời gian cập nhật |

*Bảng 3.10 Bảng recently_viewed*

> [!NOTE]
> Ràng buộc UNIQUE: (user_id, product_id) — mỗi sản phẩm chỉ xuất hiện một lần trong danh sách xem gần đây của người dùng.

---

## 3.2.3.11. Bảng product_specs

Bảng lưu trữ thông số kỹ thuật chi tiết của sản phẩm (brand, socket...).

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | int | Mã thông số (khóa chính, tự tăng) |
| 2 | product_id | char(36) | Mã sản phẩm (FK → products.id) |
| 3 | spec_key | varchar(100) | Khóa thông số kỹ thuật |
| 4 | spec_value | varchar(255) | Giá trị thông số kỹ thuật |

*Bảng 3.11 Bảng product_specs*

> [!NOTE]
> Ràng buộc UNIQUE: (product_id, spec_key) — mỗi sản phẩm chỉ có một giá trị cho mỗi thông số.

---

## 3.2.3.12. Bảng pc_configurations

Bảng lưu trữ cấu hình chi tiết PC nguyên bộ (quan hệ 1-1 với bảng products).

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã cấu hình (khóa chính, UUID) |
| 2 | product_id | char(36) | Mã sản phẩm (FK → products.id, UNIQUE, quan hệ 1-1) |
| 3 | cpu | text | Thông tin CPU |
| 4 | motherboard | text | Thông tin Mainboard |
| 5 | ram | text | Thông tin RAM |
| 6 | storage | text | Thông tin ổ cứng |
| 7 | gpu | text | Thông tin Card đồ họa |
| 8 | power | text | Thông tin Nguồn |
| 9 | computer_case | text | Thông tin Vỏ case |
| 10 | cooler | text | Thông tin Tản nhiệt |
| 11 | created_at | datetime | Thời gian tạo |
| 12 | updated_at | datetime | Thời gian cập nhật |

*Bảng 3.12 Bảng pc_configurations*

---

## 3.2.3.13. Bảng orders

Bảng lưu trữ đơn hàng — hỗ trợ cả khách đã đăng nhập và khách vãng lai.

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã đơn hàng (khóa chính, UUID) |
| 2 | order_code | varchar(255) | Mã đơn hàng hiển thị (UNIQUE) |
| 3 | user_id | char(36) | Mã người dùng (FK → users.id, NULL = khách vãng lai) |
| 4 | full_name | varchar(255) | Họ tên người đặt hàng |
| 5 | phone | varchar(255) | Số điện thoại |
| 6 | address | varchar(255) | Địa chỉ giao hàng |
| 7 | email | varchar(255) | Email người đặt hàng |
| 8 | total_price | int | Tổng giá đơn hàng |
| 9 | status | varchar(50) | Trạng thái đơn hàng (mặc định: "pending") |
| 10 | return_reason | text | Lý do trả hàng |
| 11 | admin_note | text | Ghi chú của quản trị viên |
| 12 | delivered_at | datetime | Thời gian giao hàng |
| 13 | completed_at | datetime | Thời gian hoàn thành |
| 14 | cancelled_at | datetime | Thời gian hủy |
| 15 | return_requested_at | datetime | Thời gian yêu cầu trả hàng |
| 16 | return_rejected_at | datetime | Thời gian từ chối trả hàng |
| 17 | returned_at | datetime | Thời gian đã trả hàng |
| 18 | refunded_at | datetime | Thời gian hoàn tiền |
| 19 | payment_method | varchar(255) | Phương thức thanh toán |
| 20 | guest_access_token_hash | varchar(255) | Hash token truy cập cho khách vãng lai |
| 21 | guest_access_token_expires_at | datetime | Thời gian hết hạn token khách vãng lai |
| 22 | created_at | datetime | Thời gian tạo |
| 23 | updated_at | datetime | Thời gian cập nhật |

*Bảng 3.13 Bảng orders*

> [!NOTE]
> Các trạng thái đơn hàng: pending_payment, pending, confirmed, shipping, delivered, completed, cancelled, return_requested, return_rejected, return_in_progress, returned, refunded.

---

## 3.2.3.14. Bảng order_items

Bảng lưu trữ chi tiết sản phẩm trong đơn hàng (lưu snapshot sản phẩm tại thời điểm đặt).

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã chi tiết đơn hàng (khóa chính, UUID) |
| 2 | order_id | char(36) | Mã đơn hàng (FK → orders.id) |
| 3 | product_id | char(36) | Mã sản phẩm (FK → products.id) |
| 4 | product_name | varchar(255) | Tên sản phẩm tại thời điểm đặt |
| 5 | product_images | text | Ảnh sản phẩm tại thời điểm đặt |
| 6 | product_snapshot | json | Snapshot toàn bộ thông tin sản phẩm |
| 7 | unit_price | int | Đơn giá |
| 8 | discount | int | Phần trăm giảm giá (mặc định: 0) |
| 9 | quantity | int | Số lượng |
| 10 | line_total | int | Thành tiền |
| 11 | created_at | datetime | Thời gian tạo |
| 12 | updated_at | datetime | Thời gian cập nhật |

*Bảng 3.14 Bảng order_items*

---

## 3.2.3.15. Bảng payment_attempts

Bảng lưu trữ lịch sử các lần thử thanh toán (VNPAY, MOMO).

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã lần thanh toán (khóa chính, UUID) |
| 2 | order_id | char(36) | Mã đơn hàng (FK → orders.id) |
| 3 | order_code | varchar(255) | Mã đơn hàng tham chiếu |
| 4 | provider | varchar(10) | Nhà cung cấp thanh toán (MOMO \| VNPAY) |
| 5 | amount | int | Số tiền thanh toán |
| 6 | status | varchar(20) | Trạng thái (mặc định: "pending") |
| 7 | gateway_request_id | varchar(255) | Mã yêu cầu từ cổng thanh toán |
| 8 | gateway_transaction_id | varchar(255) | Mã giao dịch từ cổng thanh toán |
| 9 | payment_url | text | URL trang thanh toán |
| 10 | failure_reason | text | Lý do thất bại |
| 11 | refund_note | text | Ghi chú hoàn tiền |
| 12 | refunded_at | datetime | Thời gian hoàn tiền |
| 13 | raw_request | json | Dữ liệu yêu cầu gốc |
| 14 | raw_response | json | Dữ liệu phản hồi gốc |
| 15 | raw_callback | json | Dữ liệu callback gốc |
| 16 | created_at | datetime | Thời gian tạo |
| 17 | updated_at | datetime | Thời gian cập nhật |

*Bảng 3.15 Bảng payment_attempts*

> [!NOTE]
> Ràng buộc UNIQUE: (provider, gateway_request_id) — mỗi nhà cung cấp chỉ có một mã yêu cầu duy nhất.
> Các trạng thái: pending, succeeded, failed, expired, requires_refund, refunded.

---

## 3.2.3.16. Bảng product_reviews

Bảng lưu trữ đánh giá sản phẩm — người dùng phải mua hàng mới được đánh giá.

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã đánh giá (khóa chính, UUID) |
| 2 | user_id | char(36) | Mã người dùng (FK → users.id) |
| 3 | product_id | char(36) | Mã sản phẩm (FK → products.id) |
| 4 | order_id | char(36) | Mã đơn hàng (FK → orders.id, có thể NULL) |
| 5 | rating | int | Điểm đánh giá |
| 6 | content | text | Nội dung đánh giá |
| 7 | status | varchar(20) | Trạng thái duyệt (mặc định: "pending") |
| 8 | reviewed_at | datetime | Thời gian duyệt |
| 9 | reviewed_by_user_id | char(36) | Mã admin đã duyệt (không FK constraint) |
| 10 | created_at | datetime | Thời gian tạo |
| 11 | updated_at | datetime | Thời gian cập nhật |
| 12 | deleted_at | datetime | Thời gian xóa mềm |

*Bảng 3.16 Bảng product_reviews*

> [!NOTE]
> Ràng buộc UNIQUE: (user_id, order_id, product_id) — mỗi người dùng chỉ đánh giá một lần cho mỗi sản phẩm trong mỗi đơn hàng.

---

## 3.2.3.17. Bảng contacts

Bảng lưu trữ form tư vấn từ khách hàng — không liên kết tài khoản.

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã liên hệ (khóa chính, UUID) |
| 2 | full_name | varchar(255) | Họ tên khách hàng |
| 3 | phone | varchar(255) | Số điện thoại |
| 4 | purchase_intent | text | Nhu cầu mua hàng |
| 5 | purpose | text | Mục đích sử dụng |
| 6 | budget | text | Ngân sách |
| 7 | delivery_option | text | Hình thức nhận hàng |
| 8 | status | varchar(20) | Trạng thái (mặc định: "new") |
| 9 | admin_note | text | Ghi chú của quản trị viên |
| 10 | handled_at | datetime | Thời gian xử lý |
| 11 | created_at | datetime | Thời gian tạo |
| 12 | updated_at | datetime | Thời gian cập nhật |
| 13 | deleted_at | datetime | Thời gian xóa mềm |

*Bảng 3.17 Bảng contacts*

---

## 3.2.3.18. Bảng blog_posts

Bảng lưu trữ bài viết blog / tin tức.

| STT | Tên trường | Kiểu dữ liệu | Ghi chú |
|-----|-----------|---------------|---------|
| 1 | id | char(36) | Mã bài viết (khóa chính, UUID) |
| 2 | title | varchar(255) | Tiêu đề bài viết |
| 3 | content | text | Nội dung bài viết |
| 4 | cover_image | varchar(255) | Ảnh bìa bài viết |
| 5 | status | varchar(20) | Trạng thái (mặc định: "draft") |
| 6 | published_at | datetime | Thời gian xuất bản |
| 7 | created_at | datetime | Thời gian tạo |
| 8 | updated_at | datetime | Thời gian cập nhật |
| 9 | deleted_at | datetime | Thời gian xóa mềm |

*Bảng 3.18 Bảng blog_posts*

---

## 3.2.4. Các mối quan hệ giữa các bảng (Foreign Keys)

| STT | Bảng nguồn | Trường | Bảng đích | Trường đích | Loại quan hệ |
|-----|-----------|--------|----------|-------------|---------------|
| 1 | spec_definitions | component_type | component_types | code | N - 1 |
| 2 | products | category_id | categories | id | N - 1 |
| 3 | products | component_type | component_types | code | N - 1 |
| 4 | refresh_tokens | user_id | users | id | N - 1 |
| 5 | cart_items | user_id | users | id | N - 1 |
| 6 | cart_items | product_id | products | id | N - 1 |
| 7 | build_pc_cart_items | user_id | users | id | N - 1 |
| 8 | build_pc_cart_items | product_id | products | id | N - 1 |
| 9 | build_pc_cart_items | component_type | component_types | code | N - 1 |
| 10 | recently_viewed | user_id | users | id | N - 1 |
| 11 | recently_viewed | product_id | products | id | N - 1 |
| 12 | product_specs | product_id | products | id | N - 1 |
| 13 | pc_configurations | product_id | products | id | 1 - 1 |
| 14 | orders | user_id | users | id | N - 1 |
| 15 | order_items | order_id | orders | id | N - 1 |
| 16 | order_items | product_id | products | id | N - 1 |
| 17 | payment_attempts | order_id | orders | id | N - 1 |
| 18 | product_reviews | user_id | users | id | N - 1 |
| 19 | product_reviews | product_id | products | id | N - 1 |
| 20 | product_reviews | order_id | orders | id | N - 1 |

*Bảng 3.19 Các mối quan hệ Foreign Key trong cơ sở dữ liệu*
