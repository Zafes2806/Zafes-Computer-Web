# BÁO CÁO LUỒNG CHỨC NĂNG, FILE, API VÀ DATABASE

**Dự án:** Zafes Computer Web  
**Mục đích file này:** Giải thích các nhóm file dùng để làm gì, khi một chức năng chạy thì đi qua những file/hàm nào, gọi API nào và dùng tới bảng nào trong cơ sở dữ liệu.

## 1. Cấu trúc tổng quan dự án

### 1.1. Thư mục `client`

`client` là phần giao diện người dùng, xây dựng bằng React + Vite.

| Nhóm file/thư mục | Vai trò |
|---|---|
| `client/src/main.jsx` | Điểm khởi động React app. |
| `client/src/routes/index.jsx` | Khai báo các route frontend như trang chủ, sản phẩm, giỏ hàng, admin, profile. |
| `client/src/api/*.js` | Các hàm gọi API backend bằng Axios. Ví dụ `auth.js`, `products.js`, `orders.js`, `cart.js`. |
| `client/src/api/interceptor.js` | Cấu hình Axios interceptor, xử lý request/response, thường dùng để refresh token hoặc xử lý lỗi xác thực. |
| `client/src/Pages/*` | Các trang chính của hệ thống: sản phẩm, chi tiết sản phẩm, giỏ hàng, checkout, admin, blog, liên hệ. |
| `client/src/Components/*` | Component tái sử dụng: Header, Footer, CardBody, SafeHtml, PrivateRoute, AdminRoute. |
| `client/src/store/*` | Context/global state dùng cho trạng thái chung của ứng dụng. |
| `client/src/constants/*` | Hằng số dùng ở frontend như trạng thái đơn hàng, loại thanh toán, giới hạn thanh toán. |
| `client/src/utils/*` | Hàm tiện ích phía client: xử lý giỏ hàng khách, route sản phẩm, chatbot, session đăng nhập. |

### 1.2. Thư mục `server`

`server` là phần backend, xây dựng bằng Node.js + Express + Sequelize + MySQL.

| Nhóm file/thư mục | Vai trò |
|---|---|
| `server/src/server.js` | Khởi động Express server, cấu hình CORS, Helmet, rate limit, Swagger, static upload, static client build và job vòng đời đơn hàng. |
| `server/src/config/env.js` | Đọc và validate biến môi trường: database, JWT, cookie, email, MoMo, VNPAY, chatbot, cấu hình đơn hàng. |
| `server/src/config/index.js` | Kết nối Sequelize tới MySQL. |
| `server/src/routes/*.routes.js` | Khai báo API endpoint và middleware tương ứng. |
| `server/src/controllers/*.controller.js` | Nhận request, lấy dữ liệu từ `req`, gọi service, trả response. |
| `server/src/services/*.service.js` | Xử lý nghiệp vụ chính như đăng nhập, sản phẩm, giỏ hàng, đơn hàng, thanh toán. |
| `server/src/models/*.model.js` | Định nghĩa bảng database bằng Sequelize model. |
| `server/src/models/associations.js` | Định nghĩa quan hệ giữa các bảng: user-order, order-orderItem, product-category,... |
| `server/src/middleware/*` | Middleware xác thực, phân quyền, validate, upload, async handler. |
| `server/src/validators/*` | Validate input request bằng `express-validator`. |
| `server/src/constants/*` | Hằng số nghiệp vụ: trạng thái đơn hàng, sản phẩm, review, payment attempt. |
| `server/src/utils/*` | Hàm tiện ích: gửi mail, tính giá, snapshot đơn hàng, sanitize HTML, route client. |
| `server/src/docs/*` | Cấu hình Swagger API documentation. |
| `server/src/uploads/images/*` | Ảnh upload từ admin. |
| `server/sql/*` | Script migration/bổ sung schema. |

## 2. Các bảng chính trong database

| Model | Bảng database | Mục đích |
|---|---|---|
| `users.model.js` | `users` | Lưu tài khoản người dùng, admin, thông tin cá nhân, trạng thái tài khoản. |
| `refreshToken.model.js` | `refresh_tokens` | Lưu refresh token đã hash để quản lý phiên đăng nhập. |
| `otp.model.js` | `otp_codes` | Lưu OTP quên mật khẩu, OTP được hash. |
| `products.model.js` | `products` | Lưu sản phẩm, giá, ảnh, tồn kho, danh mục, loại linh kiện, trạng thái. |
| `category.model.js` | `categories` | Lưu danh mục sản phẩm. |
| `componentType.model.js` | `component_types` | Lưu loại linh kiện như CPU, RAM, GPU, mainboard. |
| `productSpec.model.js` | `product_specs` | Lưu thông số kỹ thuật cụ thể của từng sản phẩm. |
| `specDefinition.model.js` | `spec_definitions` | Định nghĩa các thông số theo loại linh kiện. |
| `pcConfiguration.model.js` | `pc_configurations` | Lưu cấu hình chi tiết của sản phẩm PC lắp sẵn. |
| `cart.model.js` | `cart_items` | Lưu sản phẩm trong giỏ hàng người dùng. |
| `buildPcCart.model.js` | `build_pc_cart_items` | Lưu các linh kiện người dùng chọn trong chức năng build PC. |
| `order.model.js` | `orders` | Lưu đơn hàng, trạng thái, tổng tiền, thông tin giao hàng, token guest. |
| `orderItem.model.js` | `order_items` | Lưu chi tiết đơn hàng và snapshot sản phẩm tại thời điểm mua. |
| `paymentAttempt.model.js` | `payment_attempts` | Lưu từng lần thử thanh toán MoMo/VNPAY, trạng thái, callback, giao dịch. |
| `productReview.model.js` | `product_reviews` | Lưu đánh giá sản phẩm sau mua hàng. |
| `blogs.model.js` | `blog_posts` | Lưu bài viết/blog. |
| `contact.model.js` | `contacts` | Lưu liên hệ/phản hồi từ khách hàng. |
| `userWatchProduct.model.js` | `recently_viewed` | Lưu sản phẩm đã xem gần đây. |

## 3. Luồng request chung trong backend

Một request API thường chạy theo luồng:

1. Client gọi API qua file trong `client/src/api`.
2. Request đi tới `server/src/server.js`.
3. `server.js` áp dụng middleware chung: CORS, Helmet, JSON parser, cookie parser, rate limit.
4. Request được chuyển vào `server/src/routes/index.js`.
5. Route con tương ứng xử lý endpoint, ví dụ `/api/auth`, `/api/products`, `/api/orders`.
6. Middleware route chạy: `authUser`, `authAdmin`, `authCustomer`, `validate`, `asyncHandler`.
7. Controller nhận request và gọi service.
8. Service xử lý nghiệp vụ, gọi model/database, dùng transaction nếu cần.
9. Controller trả response bằng `OK` hoặc lỗi được middleware xử lý.

## 4. Luồng chức năng chi tiết

### 4.1. Đăng ký tài khoản

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Register/RegisterUser.jsx` |
| Frontend API | `client/src/api/auth.js` |
| API backend | `POST /api/auth/register` |
| Route | `server/src/routes/auth.routes.js` |
| Middleware | `registerValidation`, `validate`, `asyncHandler` |
| Controller | `auth.controller.js` -> `register(req, res)` |
| Service chính | `auth.service.js` -> `registerUser(payload)` |
| Hàm liên quan | `issueAuthTokens`, `setAuthCookies`, `createToken`, `createRefreshToken` |
| Model/bảng | `users`, `refresh_tokens` |
| Ý nghĩa | Kiểm tra email, hash mật khẩu bằng bcrypt, tạo user, tạo access token và refresh token, set cookie đăng nhập. |

### 4.2. Đăng nhập bằng email/password

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/LoginUser/LoginUser.jsx` |
| Frontend API | `client/src/api/auth.js` |
| API backend | `POST /api/auth/login` |
| Route | `auth.routes.js` |
| Middleware | `loginValidation`, `validate` |
| Controller | `auth.controller.js` -> `login` |
| Service chính | `auth.service.js` -> `loginUser` |
| Hàm liên quan | `ensureUserCanAuthenticate`, `bcrypt.compareSync`, `issueAuthTokens`, `setAuthCookies` |
| Model/bảng | `users`, `refresh_tokens` |
| Ý nghĩa | Kiểm tra email/password, tài khoản bị khóa/xóa, cấp token và lưu cookie. |

### 4.3. Đăng nhập Google

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `LoginUser.jsx` |
| Frontend API | `client/src/api/auth.js` |
| API backend | `POST /api/auth/google` |
| Route | `auth.routes.js` |
| Controller | `auth.controller.js` -> `loginGoogle` |
| Service chính | `auth.service.js` -> `loginGoogle` |
| Hàm liên quan | `verifyGoogleCredential`, `issueAuthTokens` |
| Model/bảng | `users`, `refresh_tokens` |
| Ý nghĩa | Verify credential Google, nếu email đã có thì đăng nhập, nếu chưa có thì tạo user mới với `authProvider = google`. |

### 4.4. Lấy thông tin user đang đăng nhập

| Thành phần | Chi tiết |
|---|---|
| Frontend API | `client/src/api/auth.js` |
| API backend | `GET /api/auth/me` |
| Route | `auth.routes.js` |
| Middleware | `authUser` |
| Controller | `auth.controller.js` -> `authUser` |
| Service chính | `auth.service.js` -> `getAuthUser` |
| Model/bảng | `users` |
| Ý nghĩa | Verify token, lấy thông tin user hiện tại, trả về thông tin đã mã hóa AES theo cấu hình `SECRET_CRYPTO`. |

### 4.5. Refresh token

| Thành phần | Chi tiết |
|---|---|
| Frontend API | `client/src/api/interceptor.js`, `client/src/api/auth.js` |
| API backend | `POST /api/auth/refresh` |
| Route | `auth.routes.js` |
| Controller | `auth.controller.js` -> `refreshToken` |
| Service chính | `auth.service.js` -> `refreshToken` |
| Hàm liên quan | `verifyRefreshToken`, `createToken`, `createRefreshToken`, `clearAuthCookies` |
| Model/bảng | `refresh_tokens`, `users` |
| Ý nghĩa | Kiểm tra refresh token trong cookie, hủy token cũ, tạo access token và refresh token mới. |

### 4.6. Quên mật khẩu và đặt lại mật khẩu

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/ForgotPassword/ForgotPassword.jsx` |
| Frontend API | `client/src/api/auth.js` |
| API backend | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Route | `auth.routes.js` |
| Controller | `auth.controller.js` -> `forgotPassword`, `resetPassword` |
| Service chính | `auth.service.js` -> `forgotPassword`, `resetPassword` |
| Hàm liên quan | `sendMailForgotPassword`, `otpGenerator.generate`, `bcrypt.hash`, `bcrypt.compare`, `jwt.sign`, `jwt.verify` |
| Model/bảng | `users`, `otp_codes` |
| Ý nghĩa | Tạo OTP, hash OTP, gửi email. Khi reset thì kiểm tra token reset và OTP rồi hash mật khẩu mới. |

### 4.7. Đồng bộ giỏ hàng khách sau đăng nhập

| Thành phần | Chi tiết |
|---|---|
| Frontend utility | `client/src/utils/guestStorage.js`, `client/src/utils/authSession.js` |
| API backend | `POST /api/auth/merge-session` |
| Route | `auth.routes.js` |
| Middleware | `authUser`, `mergeSessionValidation` |
| Controller | `auth.controller.js` -> `mergeSession` |
| Service chính | `auth.service.js` -> `mergeGuestSession` |
| Service phụ | `cart.service.js` -> `mergeGuestCart`; `buildPcCart.service.js` -> `mergeGuestBuildPcCart` |
| Model/bảng | `cart_items`, `build_pc_cart_items`, `products` |
| Ý nghĩa | Khi khách đăng nhập, giỏ hàng tạm và build PC tạm được nhập vào tài khoản. |

### 4.8. Xem danh sách sản phẩm

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Category/Category.jsx`, `SearchProduct.jsx`, `HomePage.jsx` |
| Frontend API | `client/src/api/products.js` |
| API backend | `GET /api/products` |
| Route | `products.routes.js` |
| Middleware | `authOptional`, `getProductsValidation`, `validate` |
| Controller | `products.controller.js` -> `getProducts` |
| Service chính | `product.service.js` -> `getProducts` |
| Hàm liên quan | `buildProductWhereClause`, `getProductOrder`, `findProductsForList`, `parseSpecFilters`, `buildPaginationMeta` |
| Model/bảng | `products`, `categories`, `component_types`, `product_specs`, `pc_configurations` |
| Ý nghĩa | Lấy danh sách sản phẩm theo bộ lọc, tìm kiếm, giá, loại linh kiện, thông số, phân trang. |

### 4.9. Xem chi tiết sản phẩm

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/DetailProduct/DetailProduct.jsx` |
| Frontend API | `client/src/api/products.js` |
| API backend | `GET /api/products/:id` |
| Route | `products.routes.js` |
| Middleware | `authOptional`, `getProductByIdValidation` |
| Controller | `products.controller.js` -> `getProductById` |
| Service chính | `product.service.js` -> `getProductById` |
| Service phụ | `productReview.service.js` -> `getApprovedReviews` |
| Model/bảng | `products`, `categories`, `component_types`, `product_specs`, `pc_configurations`, `product_reviews`, `users` |
| Ý nghĩa | Lấy thông tin sản phẩm, thông số, cấu hình PC nếu có và đánh giá đã duyệt. |

### 4.10. Thêm/sửa/xóa sản phẩm trong admin

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Admin/Components/ManagerProducts/ManagerProduct.jsx`, `ProductFormModal.jsx` |
| Frontend API | `client/src/api/products.js`, `client/src/api/admin.js` |
| API backend | `POST /api/products`, `PUT /api/products/:id`, `PATCH /api/products/:id`, `DELETE /api/products/:id`, `PATCH /api/products/:id/restore` |
| Route | `products.routes.js` |
| Middleware | `authAdmin`, validate tương ứng |
| Controller | `products.controller.js` -> `createProduct`, `updateProduct`, `updateProductStatus`, `deleteProduct`, `restoreProduct` |
| Service chính | `product.service.js` -> `createProduct`, `updateProduct`, `updateProductStatus`, `deleteProduct`, `restoreProduct` |
| Service phụ | `pcConfiguration.service.js` -> `upsertPcConfiguration`, `removePcConfiguration` |
| Model/bảng | `products`, `categories`, `component_types`, `product_specs`, `pc_configurations` |
| Ý nghĩa | Admin quản lý sản phẩm, thông số kỹ thuật, cấu hình PC, trạng thái bán/ngừng bán/xóa mềm. |

### 4.11. Upload ảnh sản phẩm

| Thành phần | Chi tiết |
|---|---|
| Frontend API | `client/src/api/uploads.js` |
| API backend | `POST /api/uploads/single`, `POST /api/uploads/multiple` |
| Route | `upload.routes.js` |
| Middleware | `authAdmin`, `uploadSingleImage` hoặc `uploadMultipleImages`, `verifyUploadedImages` |
| Controller | `upload.controller.js` -> `handleSingleUpload`, `handleMultipleUpload` |
| File liên quan | `server/src/middleware/upload.js`, `server/src/utils/assetPaths.js` |
| Database | Không ghi trực tiếp DB; đường dẫn ảnh sau đó được lưu trong `products`, `blog_posts` hoặc entity liên quan. |
| Ý nghĩa | Upload ảnh vào `server/src/uploads/images`, server phục vụ tĩnh qua `/uploads`. |

### 4.12. Quản lý danh mục

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Admin/Components/ManagerCategory/ManagerCategory.jsx` |
| Frontend API | `client/src/api/categories.js` |
| API backend | `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `PATCH /api/categories/:id`, `DELETE /api/categories/:id`, `PATCH /api/categories/:id/restore` |
| Route | `category.routes.js` |
| Controller | `category.controller.js` |
| Service chính | `category.service.js` |
| Hàm chính | `createCategory`, `getAllCategory`, `updateCategory`, `updateCategoryStatus`, `deleteCategory`, `restoreCategory` |
| Model/bảng | `categories`, `products` |
| Ý nghĩa | Quản lý danh mục và kiểm tra danh mục có sản phẩm liên kết trước khi xóa. |

### 4.13. Quản lý loại linh kiện

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Admin/Components/ManagerComponentTypes/ManagerComponentTypes.jsx` |
| Frontend API | `client/src/api/componentTypes.js` |
| API backend | `GET /api/component-types`, `POST /api/component-types`, `PUT /api/component-types/:code`, `PATCH /api/component-types/:code`, `DELETE /api/component-types/:code`, `PATCH /api/component-types/:code/restore` |
| Route | `componentTypes.routes.js` |
| Controller | `componentTypes.controller.js` |
| Service chính | `componentType.service.js` |
| Model/bảng | `component_types`, `products`, `build_pc_cart_items`, `spec_definitions` |
| Ý nghĩa | Quản lý các loại linh kiện như CPU, GPU, RAM, mainboard, phục vụ lọc sản phẩm và build PC. |

### 4.14. Quản lý định nghĩa thông số kỹ thuật

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Admin/Components/ManagerSpecDefinitions/ManagerSpecDefinitions.jsx` |
| Frontend API | `client/src/api/specDefinitions.js` |
| API backend | `GET /api/spec-definitions`, `POST /api/spec-definitions`, `PUT /api/spec-definitions/:id`, `PATCH /api/spec-definitions/:id`, `PATCH /api/spec-definitions/reorder`, `DELETE /api/spec-definitions/:id`, `PATCH /api/spec-definitions/:id/restore` |
| Route | `specDefinitions.routes.js` |
| Controller | `specDefinitions.controller.js` |
| Service chính | `specDefinition.service.js` |
| Model/bảng | `spec_definitions`, `component_types` |
| Ý nghĩa | Định nghĩa các trường thông số theo từng loại linh kiện, ví dụ CPU có socket, RAM có bus. |

### 4.15. Thêm sản phẩm vào giỏ hàng

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `DetailProduct.jsx`, `Cart.jsx`, component `CardBody.jsx` |
| Frontend API | `client/src/api/cart.js`, `client/src/utils/addToCart.jsx` |
| API backend | `POST /api/cart/items` |
| Route | `cart.routes.js` |
| Middleware | `authCustomer`, `addToCartValidation` |
| Controller | `cart.controller.js` -> `addToCart` |
| Service chính | `cart.service.js` -> `addToCart` |
| Hàm liên quan | `getProductOrThrow`, `ensureAvailableStock`, `upsertCartItem` |
| Model/bảng | `cart_items`, `products`, `categories`, `component_types` |
| Ý nghĩa | Kiểm tra sản phẩm còn bán được, tồn kho đủ, sau đó thêm mới hoặc tăng số lượng trong giỏ hàng. |

### 4.16. Xem/sửa/xóa giỏ hàng

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Cart/Cart.jsx` |
| Frontend API | `client/src/api/cart.js` |
| API backend | `GET /api/cart/items`, `PATCH /api/cart/items/:cartItemId`, `DELETE /api/cart/items/:cartItemId` |
| Route | `cart.routes.js` |
| Controller | `cart.controller.js` -> `getCart`, `updateQuantity`, `deleteCart` |
| Service chính | `cart.service.js` -> `getCart`, `updateQuantity`, `deleteCart` |
| Model/bảng | `cart_items`, `products`, `categories`, `component_types`, `product_specs`, `pc_configurations` |
| Ý nghĩa | Hiển thị giỏ hàng, cập nhật số lượng, xóa sản phẩm khỏi giỏ. |

### 4.17. Build PC

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/BuildPc/BuildPc.jsx` |
| Frontend API | `client/src/api/buildPc.js` |
| API backend | `POST /api/build-pc/items`, `GET /api/build-pc/items`, `PATCH /api/build-pc/items/by-product/:productId`, `DELETE /api/build-pc/items/by-product/:productId`, `DELETE /api/build-pc/items` |
| Route | `buildPcCart.routes.js` |
| Controller | `buildPcCart.controller.js`, một phần dùng `cart.controller.js` |
| Service chính | `buildPcCart.service.js` |
| Hàm chính | `buildPcCart`, `getBuildPcCart`, `updateQuantityCartBuildPc`, `deleteCartBuildPc`, `mergeGuestBuildPcCart` |
| Model/bảng | `build_pc_cart_items`, `products`, `component_types`, `categories`, `product_specs`, `pc_configurations` |
| Ý nghĩa | Người dùng chọn từng linh kiện để build PC, lưu danh sách linh kiện theo tài khoản. |

### 4.18. Chuyển build PC vào giỏ hàng

| Thành phần | Chi tiết |
|---|---|
| API backend | `POST /api/cart/imports/build-pc` |
| Route | `cart.routes.js` |
| Controller | `cart.controller.js` -> `addToCartBuildPC` |
| Service chính | `cart.service.js` -> `addToCartBuildPC` |
| Service phụ | `cart.service.js` -> `getCartBuildPc`, `upsertCartItem` |
| Model/bảng | `build_pc_cart_items`, `cart_items`, `products` |
| Ý nghĩa | Lấy toàn bộ linh kiện trong build PC và đưa vào giỏ hàng để thanh toán. |

### 4.19. Đặt hàng COD

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Cart/Cart.jsx`, `client/src/Pages/Checkout/PaymentSuccess.jsx` |
| Frontend API | `client/src/api/orders.js` |
| API backend | `POST /api/orders` |
| Route | `orders.routes.js` |
| Middleware | `authOptionalCustomer`, `checkoutValidation` |
| Controller | `orders.controller.js` -> `checkout` |
| Service chính | `checkout.service.js` -> `checkout` |
| Service phụ | `order.service.js` -> `createOrder`, `getCheckoutSnapshot`, `ensureShippingInfo` |
| Utility | `pricing.js`, `orderItemSnapshot.js`, `sendOrderEmail.js`, `guestOrderAccess.js` |
| Model/bảng | `orders`, `order_items`, `cart_items`, `products`, `product_specs`, `pc_configurations`, `categories`, `component_types` |
| Ý nghĩa | Server tự kiểm tra sản phẩm, tính tổng tiền, tạo đơn, lưu snapshot sản phẩm, trừ tồn kho, xóa giỏ hàng, gửi email. |

### 4.20. Đặt hàng thanh toán MoMo/VNPAY

| Thành phần | Chi tiết |
|---|---|
| Frontend API | `client/src/api/orders.js` |
| API backend | `POST /api/orders` với `paymentMethod = MOMO` hoặc `VNPAY` |
| Route | `orders.routes.js` |
| Controller | `orders.controller.js` -> `checkout` |
| Service chính | `checkout.service.js` -> `checkout` |
| Service phụ | `order.service.js` -> `getCheckoutPreview`, `createOrder`; `paymentAttempt.service.js` -> `createPaymentLink`; `payment.service.js` -> `createMomoPayment`, `createVnpayPayment` |
| Model/bảng | `orders`, `order_items`, `payment_attempts`, `cart_items`, `products` |
| Ý nghĩa | Tạo đơn ở trạng thái `pending_payment`, tạo payment attempt, gọi gateway để lấy link thanh toán, trả payment URL cho client. |

### 4.21. Callback MoMo

| Thành phần | Chi tiết |
|---|---|
| API backend | `GET /api/payments/momo/return`, `POST /api/payments/momo/ipn` |
| Route | `payment.routes.js` |
| Controller | `payment.controller.js` -> `handleMomoReturn`, `handleMomoIpn`, dùng hàm chung `handleMomoCallback` |
| Service chính | `payment.service.js`, `paymentAttempt.service.js` |
| Hàm liên quan | `getMomoCallbackPayload`, `verifyMomoCallbackSignature`, `markAttemptSucceeded`, `markAttemptFailed`, `buildMomoCallbackResponse` |
| Model/bảng | `payment_attempts`, `orders`, `order_items`, `products` |
| Ý nghĩa | Verify chữ ký MoMo, kiểm tra số tiền, cập nhật payment attempt, chuyển đơn từ `pending_payment` sang `pending` hoặc đánh dấu cần hoàn tiền. |

### 4.22. Callback VNPAY

| Thành phần | Chi tiết |
|---|---|
| API backend | `GET /api/payments/vnpay/return` |
| Route | `payment.routes.js` |
| Controller | `payment.controller.js` -> `handleVnpayReturn` |
| Service chính | `payment.service.js` -> `verifyVnpayReturn`; `paymentAttempt.service.js` |
| Hàm liên quan | `markAttemptSucceeded`, `markAttemptFailed` |
| Model/bảng | `payment_attempts`, `orders`, `order_items`, `products` |
| Ý nghĩa | Verify return URL từ VNPAY, xác nhận hoặc từ chối giao dịch, redirect người dùng về trang kết quả thanh toán. |

### 4.23. Tạo lại link thanh toán

| Thành phần | Chi tiết |
|---|---|
| API backend | `POST /api/orders/:orderCode/payments` |
| Route | `orders.routes.js` |
| Controller | `orders.controller.js` -> `createPaymentRetry` |
| Service chính | `checkout.service.js` -> `createPaymentRetry` |
| Service phụ | `paymentAttempt.service.js` -> `createPaymentLink` |
| Model/bảng | `orders`, `payment_attempts` |
| Ý nghĩa | Khi đơn còn `pending_payment`, người dùng có thể tạo lại hoặc dùng lại link thanh toán còn hạn. |

### 4.24. Xem danh sách đơn hàng của khách

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/InfoUser/Components/ManagerOrder/ManagerOrder.jsx` |
| Frontend API | `client/src/api/orders.js` |
| API backend | `GET /api/orders` |
| Route | `orders.routes.js` |
| Middleware | `authCustomer`, `orderListValidation` |
| Controller | `orders.controller.js` -> `getUserOrders` |
| Service chính | `order.service.js` -> `getUserOrders`, `formatOrderForUser` |
| Model/bảng | `orders`, `order_items` |
| Ý nghĩa | Lấy đơn hàng của user đang đăng nhập, có phân trang và dữ liệu snapshot sản phẩm. |

### 4.25. Xem chi tiết đơn hàng

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `PaymentSuccess.jsx`, `ManagerOrder.jsx` |
| Frontend API | `client/src/api/orders.js` |
| API backend | `GET /api/orders/:orderCode` |
| Route | `orders.routes.js` |
| Middleware | `authOptional`, `orderCodeParamValidation` |
| Controller | `orders.controller.js` -> `getOrderDetail` |
| Service chính | `order.service.js` -> `getOrderDetailWithAccess` |
| Utility | `guestOrderAccess.js`, `orderItemSnapshot.js` |
| Model/bảng | `orders`, `order_items` |
| Ý nghĩa | User đăng nhập xem đơn của mình; khách guest xem đơn bằng token truy cập. |

### 4.26. Hủy đơn hàng

| Thành phần | Chi tiết |
|---|---|
| API backend | `POST /api/orders/:orderCode/cancellations` |
| Route | `orders.routes.js` |
| Controller | `orders.controller.js` -> `cancelUserOrder` |
| Service chính | `order.service.js` -> `cancelOrderWithAccess`, `cancelUserOrder` |
| Hàm liên quan | `assertOrderAccess`, `canTransitionOrderStatus`, `restoreStockForOrder`, `buildOrderStatusUpdate` |
| Model/bảng | `orders`, `order_items`, `products` |
| Ý nghĩa | Kiểm tra quyền xem đơn, kiểm tra trạng thái có được hủy không, hoàn kho và cập nhật trạng thái `cancelled`. |

### 4.27. Xác nhận đã nhận hàng

| Thành phần | Chi tiết |
|---|---|
| API backend | `POST /api/orders/:orderCode/completions` |
| Route | `orders.routes.js` |
| Middleware | `authCustomer` |
| Controller | `orders.controller.js` -> `completeUserOrder` |
| Service chính | `order.service.js` -> `completeUserOrder` |
| Model/bảng | `orders` |
| Ý nghĩa | Người dùng xác nhận đơn đã nhận, chuyển trạng thái sang `completed` nếu hợp lệ. |

### 4.28. Yêu cầu trả hàng/hoàn tiền

| Thành phần | Chi tiết |
|---|---|
| API backend | `POST /api/orders/:orderCode/return-requests` |
| Route | `orders.routes.js` |
| Controller | `orders.controller.js` -> `requestReturnOrder` |
| Service chính | `order.service.js` -> `requestReturnOrder` |
| Hàm liên quan | `isReturnWindowOpen`, `canTransitionOrderStatus`, `buildOrderStatusUpdate` |
| Model/bảng | `orders` |
| Ý nghĩa | Người dùng gửi lý do trả hàng trong thời hạn cho phép, đơn chuyển sang `return_requested`. |

### 4.29. Admin quản lý đơn hàng

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Admin/Components/ManagerOrder/ManagerOrder.jsx` |
| Frontend API | `client/src/api/admin.js`, `client/src/api/orders.js` |
| API backend | `GET /api/admin/orders`, `PATCH /api/admin/orders/:orderId` |
| Route | `admin.routes.js` |
| Middleware | `authAdmin`, validate trạng thái |
| Controller | `orders.controller.js` -> `getAdminOrders`, `updateStatus` |
| Service chính | `order.service.js` -> `getAdminOrders`, `updateStatus` |
| Hàm liên quan | `formatOrderForAdmin`, `buildAdminOrderWhere`, `canTransitionOrderStatus`, `restoreStockForOrder` |
| Model/bảng | `orders`, `order_items`, `payment_attempts`, `products` |
| Ý nghĩa | Admin lọc đơn, xem payment attempt, cập nhật trạng thái đơn, hoàn kho khi hủy hoặc chấp nhận trả hàng. |

### 4.30. Admin xác nhận đã hoàn tiền

| Thành phần | Chi tiết |
|---|---|
| API backend | `PATCH /api/admin/payment-attempts/:attemptId/refund` |
| Route | `admin.routes.js` |
| Controller | `orders.controller.js` -> `markRefundProcessed` |
| Service chính | `paymentAttempt.service.js` -> `markRefundProcessed` |
| Model/bảng | `payment_attempts` |
| Ý nghĩa | Khi payment attempt ở trạng thái cần hoàn tiền, admin đánh dấu đã xử lý hoàn tiền. |

### 4.31. Job vòng đời đơn hàng

| Thành phần | Chi tiết |
|---|---|
| File khởi động | `server/src/server.js` |
| Service | `orderLifecycle.service.js` |
| Hàm chính | `startOrderLifecycleJobs`, `autoCompleteDeliveredOrders` |
| Service phụ | `paymentAttempt.service.js` -> `expirePendingAttempts`, `expireStalePendingPaymentOrders` |
| Model/bảng | `orders`, `payment_attempts`, `order_items`, `products` |
| Ý nghĩa | Tự động chuyển đơn đã giao lâu ngày sang hoàn thành, hủy đơn thanh toán quá hạn, giải phóng tồn kho. |

### 4.32. Tạo đánh giá sản phẩm

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `DetailProduct.jsx`, `ManagerOrder.jsx` |
| Frontend API | `client/src/api/reviews.js` |
| API backend | `POST /api/reviews` |
| Route | `review.routes.js` |
| Middleware | `authCustomer`, `reviewCreateValidation` |
| Controller | `review.controller.js` -> `createReview` |
| Service chính | `productReview.service.js` -> `createReview` |
| Hàm liên quan | `findEligiblePurchasedOrder`, `isReviewWindowOpen`, `getOrderProductIds` |
| Model/bảng | `product_reviews`, `orders`, `order_items`, `products`, `users` |
| Ý nghĩa | Chỉ cho người dùng đánh giá sản phẩm đã mua trong đơn hợp lệ và trong thời gian cho phép. |

### 4.33. Sửa/xem đánh giá của tôi

| Thành phần | Chi tiết |
|---|---|
| API backend | `GET /api/reviews`, `PATCH /api/reviews/:id` |
| Route | `review.routes.js` |
| Controller | `review.controller.js` -> `getMyReviews`, `updateMyReview` |
| Service chính | `productReview.service.js` -> `getUserReviews`, `updateMyReview` |
| Model/bảng | `product_reviews`, `products`, `orders` |
| Ý nghĩa | User xem và sửa đánh giá của mình trong thời hạn chỉnh sửa. |

### 4.34. Admin duyệt/xóa/khôi phục đánh giá

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Admin/Components/ManagerReviews/ManagerReviews.jsx` |
| Frontend API | `client/src/api/reviews.js`, `client/src/api/admin.js` |
| API backend | `GET /api/admin/reviews`, `PATCH /api/admin/reviews/:id`, `DELETE /api/admin/reviews/:id`, `PATCH /api/admin/reviews/:id/restore` |
| Route | `admin.routes.js` |
| Controller | `review.controller.js` |
| Service chính | `productReview.service.js` |
| Model/bảng | `product_reviews`, `users`, `products`, `orders` |
| Ý nghĩa | Admin lọc, duyệt, ẩn, xóa mềm hoặc khôi phục đánh giá. |

### 4.35. Blog

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Blogs/Blogs.jsx`, `DetailBlogs.jsx`, admin `ManagerBlogs.jsx` |
| Frontend API | `client/src/api/blogs.js` |
| API backend | `GET /api/blogs`, `GET /api/blogs/:id`, `POST /api/blogs`, `PUT /api/blogs/:id`, `PATCH /api/blogs/:id`, `DELETE /api/blogs/:id`, `PATCH /api/blogs/:id/restore` |
| Route | `blogs.routes.js` |
| Controller | `blogs.controller.js` |
| Service chính | `blog.service.js` |
| Model/bảng | `blog_posts` |
| Utility liên quan | `htmlSanitizer.js`, `SafeHtml.jsx`, `sanitizeHtml.js` |
| Ý nghĩa | Public xem blog đã xuất bản; admin tạo, sửa, đổi trạng thái, xóa mềm, khôi phục bài viết. |

### 4.36. Liên hệ

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Contact/Contact.jsx`, admin `ManagerContact.jsx` |
| Frontend API | `client/src/api/contacts.js` |
| API backend | `POST /api/contacts`, `GET /api/contacts`, `GET /api/contacts/:id`, `PATCH /api/contacts/:id`, `DELETE /api/contacts/:id`, `PATCH /api/contacts/:id/restore` |
| Route | `contact.routes.js` |
| Controller | `contact.controller.js` |
| Service chính | `contact.service.js` |
| Model/bảng | `contacts` |
| Ý nghĩa | Khách gửi liên hệ; admin xem, lọc, cập nhật trạng thái xử lý, xóa/khôi phục. |

### 4.37. Quản lý người dùng

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Admin/Components/ManagerUser/ManagerUser.jsx`, user `InfoUser.jsx` |
| Frontend API | `client/src/api/users.js` |
| API backend | `GET /api/users`, `POST /api/users`, `PUT /api/users/me`, `PATCH /api/users/:userId`, `DELETE /api/users/:userId`, `PATCH /api/users/:userId/restore` |
| Route | `users.routes.js` |
| Controller | `user.controller.js` |
| Service chính | `user.service.js` |
| Hàm chính | `getUsers`, `updateInfo`, `createUser`, `updateManagedUser`, `deleteUser`, `restoreUser` |
| Model/bảng | `users` |
| Ý nghĩa | User cập nhật thông tin cá nhân; admin tạo, lọc, khóa/mở khóa, phân quyền, xóa mềm/khôi phục tài khoản. |

### 4.38. Sản phẩm đã xem gần đây

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/InfoUser/Components/ManagerProductWatch/ManagerProductWatch.jsx` |
| Frontend API | `client/src/api/recentlyViewed.js` |
| API backend | `POST /api/recently-viewed`, `GET /api/recently-viewed` |
| Route | `wishlist.routes.js` |
| Middleware | `authCustomer`, `productWatchValidation` |
| Controller | `wishlist.controller.js` -> `createProductWatch`, `getProductWatch` |
| Service chính | `wishlist.service.js` |
| Hàm liên quan | `deleteExpiredProductWatches`, `deleteDuplicateProductWatches`, `limitProductWatches` |
| Model/bảng | `recently_viewed`, `products`, `categories`, `component_types` |
| Ý nghĩa | Lưu và hiển thị danh sách sản phẩm người dùng đã xem gần đây. |

### 4.39. Dashboard admin

| Thành phần | Chi tiết |
|---|---|
| Frontend page | `client/src/Pages/Admin/Components/DashBoard/DashBoard.jsx` |
| Frontend API | `client/src/api/admin.js` |
| API backend | `GET /api/admin/dashboard`, `GET /api/admin/stats/orders`, `GET /api/admin/stats/charts` |
| Route | `admin.routes.js` |
| Middleware | `authAdmin` |
| Controller | `dashboard.controller.js` |
| Service chính | `dashboard.service.js` |
| Hàm chính | `getDashboardStats`, `getOrderStats`, `getChartData` |
| Model/bảng | `orders`, `order_items`, `products`, `users` |
| Ý nghĩa | Tổng hợp số liệu quản trị như đơn hàng, doanh thu, biểu đồ theo thời gian. |

### 4.40. Chatbot

| Thành phần | Chi tiết |
|---|---|
| Frontend component | `client/src/Components/StorefrontChatbot/StorefrontChatbot.jsx`, `client/src/utils/Chatbot/Chatbot.jsx` |
| Frontend API | `client/src/api/chatbot.js` |
| API backend | `POST /api/chatbot/replies` |
| Route | `chatbot.routes.js` |
| Controller | `chatbot.controller.js` -> `reply` |
| Utility/service | `server/src/utils/Chatbot.js` |
| Database | Có thể không dùng DB trực tiếp; chủ yếu gọi Google Generative AI theo cấu hình `GOOGLE_AI_KEY`. |
| Ý nghĩa | Nhận câu hỏi từ người dùng và trả lời tự động bằng AI. |

## 5. Luồng nghiệp vụ thực tế theo trạng thái

Phần trên mô tả một chức năng đi qua file, API và bảng nào. Phần này mô tả thêm nghiệp vụ thực tế: trạng thái ban đầu là gì, ai được chuyển trạng thái, điều kiện chuyển là gì, dữ liệu nào bị ảnh hưởng và job tự động xử lý ra sao.

### 5.1. Vòng đời đơn hàng

Đơn hàng là nghiệp vụ trung tâm của hệ thống. Trạng thái đơn được định nghĩa trong `server/src/constants/orderStatus.js`.

| Trạng thái | Ý nghĩa nghiệp vụ | Ai/luồng tạo ra |
|---|---|---|
| `pending_payment` | Chờ thanh toán online | Đơn MoMo/VNPAY vừa được tạo nhưng gateway chưa xác nhận thanh toán |
| `pending` | Chờ xác nhận | Đơn COD mới tạo hoặc đơn online đã thanh toán thành công |
| `confirmed` | Chờ lấy hàng | Admin xác nhận đơn hợp lệ |
| `shipping` | Đang giao | Admin chuyển đơn sang giao hàng |
| `delivered` | Đã giao hàng | Admin xác nhận đơn đã giao tới khách |
| `completed` | Hoàn thành | Khách xác nhận đã nhận hàng hoặc job tự hoàn thành sau thời gian chờ |
| `cancelled` | Đã hủy | Khách/admin hủy đơn hoặc đơn online hết hạn thanh toán |
| `return_requested` | Yêu cầu trả hàng/hoàn tiền | Khách gửi yêu cầu trả hàng khi đơn đã giao |
| `return_rejected` | Từ chối trả hàng | Admin từ chối yêu cầu trả hàng và phải nhập lý do |
| `return_in_progress` | Đang trả hàng | Admin chấp nhận yêu cầu trả hàng |
| `returned` | Đã nhận hàng hoàn | Admin xác nhận đã nhận hàng trả, hệ thống hoàn kho |
| `refunded` | Đã hoàn tiền | Admin hoàn tất bước hoàn tiền |

Luồng chuyển trạng thái hợp lệ:

```text
pending_payment (Chờ thanh toán) -> cancelled (Đã hủy)
pending (Chờ xác nhận) -> confirmed (Chờ lấy hàng) -> shipping (Đang giao) -> delivered (Đã giao hàng) -> completed (Hoàn thành)
pending (Chờ xác nhận) -> cancelled (Đã hủy)
confirmed (Chờ lấy hàng) -> cancelled (Đã hủy)
delivered (Đã giao hàng) -> return_requested (Yêu cầu trả hàng/hoàn tiền) -> return_in_progress (Đang trả hàng) -> returned (Đã nhận hàng hoàn) -> refunded (Đã hoàn tiền)
delivered (Đã giao hàng) -> return_requested (Yêu cầu trả hàng/hoàn tiền) -> return_rejected (Từ chối trả hàng) -> completed (Hoàn thành)
```

Khi tạo đơn:

1. Người dùng hoặc khách vãng lai đặt hàng từ giỏ hàng hoặc danh sách sản phẩm gửi lên.
2. Backend kiểm tra thông tin nhận hàng, sản phẩm còn bán, danh mục còn hợp lệ và tồn kho đủ.
3. Hệ thống tạo bản ghi `orders` và các dòng `order_items`.
4. Mỗi `order_items` lưu snapshot sản phẩm tại thời điểm mua, gồm tên, ảnh, giá, giảm giá, thông số hoặc cấu hình PC. Nhờ vậy sau này sản phẩm bị sửa/xóa thì đơn hàng vẫn giữ được dữ liệu mua ban đầu.
5. Hệ thống trừ tồn kho ngay khi tạo đơn.
6. Nếu user đã đăng nhập thì sản phẩm đã mua được xóa khỏi `cart_items`; nếu khách vãng lai thì tạo token xem đơn guest.

Với COD:

1. Đơn được tạo trực tiếp với trạng thái `pending`.
2. Email đơn hàng được gửi nếu có email.
3. Admin vào quản lý đơn để xác nhận.
4. Admin có thể chuyển `pending (Chờ xác nhận) -> confirmed (Chờ lấy hàng)` hoặc `pending (Chờ xác nhận) -> cancelled (Đã hủy)`.
5. Nếu hủy, hệ thống hoàn lại tồn kho.

Với MoMo/VNPAY:

1. Đơn được tạo với trạng thái `pending_payment`.
2. Hệ thống tạo bản ghi `payment_attempts` trạng thái `pending`.
3. Backend tạo link thanh toán và trả về cho frontend.
4. Nếu gateway xác nhận thành công, payment attempt chuyển `succeeded`, đơn chuyển từ `pending_payment` sang `pending`.
5. Nếu gateway báo thất bại, payment attempt chuyển `failed`; nếu không còn attempt mới hơn thì đơn `pending_payment` bị hủy và hoàn kho.
6. Nếu thanh toán về sau khi đơn đã hủy/hết hạn, payment attempt chuyển `requires_refund` để admin xử lý hoàn tiền.

Các mốc tự động:

- `ORDER_PENDING_PAYMENT_TIMEOUT_MS` mặc định là 24 giờ. Sau thời gian này, job tự động hết hạn payment attempt `pending` và hủy đơn `pending_payment`, đồng thời hoàn kho.
- `ORDER_PAYMENT_LINK_REUSE_MS` mặc định là 2 giờ. Trong thời gian này, nếu khách tạo lại link thanh toán thì hệ thống có thể dùng lại link cũ còn hiệu lực.
- `ORDER_AUTO_COMPLETE_DELAY_HOURS` mặc định là 15 ngày. Đơn ở trạng thái `delivered` quá thời gian này sẽ tự chuyển sang `completed`.
- Job chạy trong `orderLifecycle.service.js`, được khởi động từ `server/src/server.js`.

Lưu ý quan trọng: code hiện tại tự hủy đơn `pending_payment` khi quá hạn thanh toán. Đơn COD ở trạng thái `pending` không có job tự hủy sau 24 giờ; đơn này chờ admin xác nhận hoặc hủy.

### 5.2. Luồng hủy đơn

Khách hoặc admin chỉ có thể hủy đơn ở các trạng thái còn cho phép:

```text
pending_payment (Chờ thanh toán) -> cancelled (Đã hủy)
pending (Chờ xác nhận) -> cancelled (Đã hủy)
confirmed (Chờ lấy hàng) -> cancelled (Đã hủy)
```

Khi hủy đơn:

1. Backend kiểm tra quyền xem đơn. User đăng nhập chỉ hủy được đơn của mình; khách vãng lai cần guest token hợp lệ.
2. Backend kiểm tra trạng thái hiện tại có được chuyển sang `cancelled` hay không.
3. Hệ thống đọc `order_items` và cộng lại tồn kho cho từng sản phẩm.
4. Đơn được cập nhật `status = cancelled` và ghi `cancelledAt`.
5. Nếu đơn đã ở `shipping`, `delivered`, `completed`, `returned`, `refunded` thì không được hủy theo luồng thường.

### 5.3. Luồng giao hàng và hoàn thành đơn

Luồng admin xử lý đơn bình thường:

```text
pending (Chờ xác nhận) -> confirmed (Chờ lấy hàng) -> shipping (Đang giao) -> delivered (Đã giao hàng)
```

Sau khi đơn `delivered`:

1. Khách có thể bấm xác nhận đã nhận hàng để chuyển `delivered (Đã giao hàng) -> completed (Hoàn thành)`.
2. Nếu khách không thao tác, job tự động sẽ chuyển `delivered (Đã giao hàng) -> completed (Hoàn thành)` sau `ORDER_AUTO_COMPLETE_DELAY_HOURS`, mặc định 15 ngày.
3. Khi chuyển sang `completed`, hệ thống ghi `completedAt`.
4. Dashboard doanh thu chỉ tính các đơn ở trạng thái hoàn thành theo `ORDER_REVENUE_STATUSES`.

### 5.4. Luồng trả hàng/hoàn tiền

Trả hàng chỉ mở khi đơn đang ở trạng thái `delivered`.

Luồng chấp nhận trả hàng:

```text
delivered (Đã giao hàng) -> return_requested (Yêu cầu trả hàng/hoàn tiền) -> return_in_progress (Đang trả hàng) -> returned (Đã nhận hàng hoàn) -> refunded (Đã hoàn tiền)
```

Luồng từ chối trả hàng:

```text
delivered (Đã giao hàng) -> return_requested (Yêu cầu trả hàng/hoàn tiền) -> return_rejected (Từ chối trả hàng) -> completed (Hoàn thành)
```

Chi tiết nghiệp vụ:

1. Khách gửi yêu cầu trả hàng/hoàn tiền và phải nhập lý do.
2. Backend kiểm tra đơn có thuộc user đó không, trạng thái có phải `delivered` không và còn trong thời hạn trả hàng không.
3. Đơn chuyển sang `return_requested`, lưu `returnReason` và `returnRequestedAt`.
4. Admin xem yêu cầu trong quản lý đơn.
5. Nếu admin chấp nhận, đơn chuyển sang `return_in_progress`, sau đó `returned`.
6. Khi chuyển sang `returned`, hệ thống hoàn kho vì hàng đã được nhận lại.
7. Sau khi xử lý tiền, admin chuyển `returned (Đã nhận hàng hoàn) -> refunded (Đã hoàn tiền)`, hệ thống ghi `refundedAt`.
8. Nếu admin từ chối, bắt buộc nhập `adminNote`, đơn chuyển `return_rejected`. Sau đó admin đóng đơn bằng `completed`.

Thời hạn yêu cầu trả hàng đang dùng cùng cấu hình `ORDER_AUTO_COMPLETE_DELAY_HOURS`, mặc định 15 ngày tính từ `deliveredAt` hoặc thời điểm cập nhật sang trạng thái đã giao.

### 5.5. Luồng thanh toán online và hoàn tiền

Mỗi lần tạo link thanh toán online sẽ tạo hoặc tái sử dụng một bản ghi `payment_attempts`.

Các trạng thái payment attempt:

| Trạng thái | Ý nghĩa |
|---|---|
| `pending` | Đang chờ gateway xác nhận |
| `succeeded` | Gateway xác nhận thanh toán thành công |
| `failed` | Gateway báo thanh toán thất bại |
| `expired` | Thanh toán quá hạn |
| `requires_refund` | Tiền đã về nhưng đơn không còn hợp lệ, cần admin hoàn tiền |
| `refunded` | Admin đã đánh dấu hoàn tiền xong |

Luồng thành công:

1. Gateway gọi callback/return về backend.
2. Backend verify chữ ký và kiểm tra số tiền.
3. Payment attempt chuyển `succeeded`.
4. Các payment attempt `pending` khác của cùng đơn bị chuyển `expired`.
5. Đơn chuyển `pending_payment (Chờ thanh toán) -> pending (Chờ xác nhận)`.

Luồng lỗi hoặc quá hạn:

1. Nếu gateway báo thất bại, payment attempt chuyển `failed`.
2. Nếu không còn attempt mới hơn, đơn bị hủy và hoàn kho.
3. Nếu attempt quá hạn theo job, attempt chuyển `expired`; nếu không có attempt mới hơn thì đơn bị hủy.
4. Nếu gateway báo thành công sau khi đơn đã hủy, attempt chuyển `requires_refund`.
5. Admin xử lý hoàn tiền thực tế bên ngoài hệ thống, sau đó đánh dấu `refunded`.

### 5.6. Luồng giỏ hàng thường

Khi thêm sản phẩm vào giỏ:

1. Hệ thống kiểm tra sản phẩm tồn tại, chưa bị xóa, đang active và danh mục còn active.
2. Kiểm tra tồn kho có đủ cho số lượng muốn thêm không.
3. Nếu sản phẩm đã có trong `cart_items`, hệ thống tăng số lượng và tính lại `totalPrice`.
4. Nếu chưa có, hệ thống tạo dòng giỏ hàng mới.
5. Khi checkout thành công, các sản phẩm tương ứng bị xóa khỏi giỏ hoặc giảm số lượng nếu chỉ mua một phần.

Giỏ hàng không lưu snapshot sản phẩm. Khi hiển thị giỏ, hệ thống lấy lại dữ liệu sản phẩm hiện tại. Snapshot chỉ được tạo khi phát sinh đơn hàng.

### 5.7. Luồng Build PC

Build PC là giỏ chọn linh kiện theo từng loại, lưu trong `build_pc_cart_items`.

Luồng chọn linh kiện:

1. Người dùng chọn một sản phẩm để thêm vào Build PC.
2. Backend kiểm tra sản phẩm có bán được không.
3. Backend lấy `componentType` của sản phẩm và kiểm tra trong `component_types`.
4. Chỉ sản phẩm thuộc loại active và `isBuildPcAllowed = true` mới được thêm vào Build PC.
5. Mỗi component type chỉ giữ một lựa chọn. Ví dụ đã chọn CPU A, sau đó chọn CPU B thì CPU A bị thay thế.
6. `pc` có `isBuildPcAllowed = false`, nên PC nguyên bộ không được thêm vào Build PC.

Khi chuyển Build PC vào giỏ hàng:

1. Backend đọc toàn bộ `build_pc_cart_items` của user.
2. Kiểm tra lại từng sản phẩm còn bán được và tồn kho đủ.
3. Từng linh kiện được đưa vào `cart_items`.
4. Build PC cart được dọn sau khi chuyển thành công.

### 5.8. Luồng sản phẩm, PC nguyên bộ và thông số kỹ thuật

Khi admin tạo/sửa sản phẩm:

1. Backend kiểm tra danh mục tồn tại và chưa bị xóa.
2. Backend kiểm tra `componentType` tồn tại trong `component_types`, đang active và được dùng cho sản phẩm.
3. Nếu `componentType = pc`, backend yêu cầu `pcConfiguration` gồm CPU, mainboard, RAM, storage, GPU, nguồn, case và tản nhiệt.
4. Sản phẩm PC nguyên bộ lưu cấu hình vào `pc_configurations`, không dùng `product_specs` như linh kiện rời.
5. Nếu sản phẩm không phải `pc`, backend lưu thông số kỹ thuật vào `product_specs`.
6. Khi đổi sản phẩm từ `pc` sang loại khác, hệ thống xóa `pc_configurations`; khi đổi sang `pc`, hệ thống xóa `product_specs`.

Luồng bộ lọc sản phẩm:

1. Frontend gọi `/api/categories/component-filters`.
2. Backend lấy các sản phẩm active.
3. Với linh kiện rời, backend đưa `product.name` vào nhóm theo `product.componentType`.
4. Với PC nguyên bộ, backend đọc `pcConfiguration` và bung ra thành các nhóm CPU, RAM, VGA, mainboard, nguồn, case...
5. Vì vậy filter có thể hiện CPU/RAM/VGA từ cả sản phẩm linh kiện rời và cấu hình của PC nguyên bộ.

### 5.9. Luồng đánh giá sản phẩm

Đánh giá chỉ được tạo sau khi người dùng đã mua hàng.

Điều kiện tạo đánh giá:

1. User phải đăng nhập.
2. Đơn phải thuộc về user đó.
3. Đơn phải ở trạng thái `delivered` hoặc `completed`.
4. Đơn còn trong thời hạn đánh giá, mặc định `REVIEW_WINDOW_DAYS = 15` ngày.
5. User chưa có đánh giá active cho đơn đó.

Khi tạo đánh giá:

1. Backend tìm đơn đủ điều kiện.
2. Lấy danh sách sản phẩm trong đơn.
3. Tạo review cho các sản phẩm trong đơn với trạng thái `pending`.
4. Review chưa hiển thị public cho đến khi admin duyệt.

Luồng duyệt review:

```text
pending (Chờ duyệt) -> approved (Đã duyệt)
pending (Chờ duyệt) -> hidden (Đã ẩn)
approved (Đã duyệt) -> hidden (Đã ẩn)
hidden (Đã ẩn) -> approved (Đã duyệt)
```

Nếu user sửa review:

1. Chỉ được sửa trong `REVIEW_EDIT_WINDOW_DAYS`, mặc định 10 ngày.
2. Khi sửa, review quay lại trạng thái `pending`.
3. Admin phải duyệt lại thì review mới hiển thị public.

### 5.10. Luồng blog

Blog có các trạng thái:

```text
draft (Bản nháp) -> published (Đã xuất bản)
draft (Bản nháp) -> archived (Đã lưu trữ)
published (Đã xuất bản) -> draft (Bản nháp)
published (Đã xuất bản) -> archived (Đã lưu trữ)
archived (Đã lưu trữ) -> draft (Bản nháp)
```

Nghiệp vụ:

1. Admin tạo bài viết, mặc định có thể là `draft` nếu chưa xuất bản.
2. Chỉ bài `published` mới hiển thị ở trang public.
3. Khi chuyển sang `published` lần đầu, hệ thống ghi `publishedAt`.
4. Bài `archived` là bài đã lưu trữ, không hiển thị public.
5. Xóa blog là xóa mềm; admin có thể khôi phục.

### 5.11. Luồng liên hệ khách hàng

Liên hệ có các trạng thái:

```text
new (Mới) -> contacted (Đã liên hệ) -> resolved (Đã xử lý)
new (Mới) -> archived (Đã lưu trữ)
contacted (Đã liên hệ) -> archived (Đã lưu trữ)
resolved (Đã xử lý) -> contacted (Đã liên hệ)
resolved (Đã xử lý) -> archived (Đã lưu trữ)
archived (Đã lưu trữ) -> contacted (Đã liên hệ)
```

Nghiệp vụ:

1. Khách gửi form liên hệ, hệ thống tạo bản ghi `contacts` với trạng thái `new`.
2. Admin xem danh sách liên hệ mới.
3. Khi đã gọi hoặc nhắn lại khách, admin chuyển sang `contacted`.
4. Khi xử lý xong, admin chuyển sang `resolved`.
5. Nếu không cần xử lý hoặc muốn lưu trữ, admin chuyển sang `archived`.
6. Khi chuyển sang trạng thái đã xử lý, hệ thống cập nhật `handledAt`; admin có thể ghi thêm `adminNote`.

### 5.12. Luồng tài khoản người dùng

Tài khoản có trạng thái active/inactive và có thể bị xóa mềm.

Nghiệp vụ chính:

1. Khi đăng ký email/password, hệ thống kiểm tra email chưa tồn tại, hash mật khẩu, tạo user active và cấp token.
2. Khi đăng nhập, hệ thống kiểm tra user chưa bị khóa/xóa và mật khẩu đúng.
3. Khi đăng nhập Google, nếu email chưa tồn tại thì tạo user theo Google; nếu đã tồn tại thì đăng nhập user đó.
4. Refresh token được lưu trong `refresh_tokens`; khi refresh thành công, token cũ bị thay bằng token mới.
5. Admin có thể khóa user bằng trạng thái inactive; user inactive không được đăng nhập.
6. Admin có thể xóa mềm user; dữ liệu lịch sử như đơn hàng vẫn được giữ để đối soát.

## 6. Bản đồ API nhanh

| Nhóm API | Endpoint chính | Chức năng |
|---|---|---|
| Auth | `/api/auth/register`, `/login`, `/google`, `/me`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `/merge-session` | Xác thực, phiên đăng nhập, OTP, đồng bộ giỏ hàng. |
| Users | `/api/users`, `/api/users/me`, `/api/users/:userId` | Quản lý người dùng và thông tin cá nhân. |
| Products | `/api/products`, `/api/products/:id`, `/api/products/search`, `/api/products/by-component-type` | Quản lý và hiển thị sản phẩm. |
| Categories | `/api/categories`, `/api/categories/:id/products`, `/api/categories/component-filters` | Danh mục và lọc sản phẩm. |
| Component Types | `/api/component-types` | Loại linh kiện. |
| Spec Definitions | `/api/spec-definitions` | Định nghĩa thông số kỹ thuật. |
| Cart | `/api/cart/items`, `/api/cart/imports/build-pc` | Giỏ hàng. |
| Build PC | `/api/build-pc/items` | Giỏ build PC. |
| Orders | `/api/orders`, `/api/orders/:orderCode`, `/api/orders/:orderCode/payments`, `/cancellations`, `/completions`, `/return-requests` | Đặt hàng và thao tác đơn của khách. |
| Payments | `/api/payments/momo/return`, `/api/payments/momo/ipn`, `/api/payments/vnpay/return` | Callback thanh toán. |
| Admin | `/api/admin/dashboard`, `/api/admin/orders`, `/api/admin/reviews`, `/api/admin/payment-attempts/:attemptId/refund` | Dashboard, quản lý đơn, review, hoàn tiền. |
| Reviews | `/api/reviews` | User tạo/xem/sửa đánh giá. |
| Blogs | `/api/blogs` | Blog và quản lý blog. |
| Contacts | `/api/contacts` | Liên hệ khách hàng. |
| Uploads | `/api/uploads/single`, `/api/uploads/multiple` | Upload ảnh admin. |
| Recently Viewed | `/api/recently-viewed` | Sản phẩm đã xem gần đây. |
| Chatbot | `/api/chatbot/replies` | Chatbot tư vấn. |

## 7. Các file nền tảng hay bị hỏi khi phản biện

### `server/src/server.js`

File khởi động backend. Các nhiệm vụ chính:

- Gọi `connectDB()` để kết nối MySQL.
- Gọi `initializeModelAssociations()` để đăng ký quan hệ Sequelize.
- Cấu hình CORS, Helmet, compression, body parser, cookie parser.
- Cấu hình rate limit cho API đọc, API ghi và auth.
- Gắn Swagger.
- Gắn toàn bộ route qua `routes(app)`.
- Serve ảnh upload qua `/uploads`.
- Serve frontend build nếu có `client/dist`.
- Gọi `startOrderLifecycleJobs()` để chạy job tự động xử lý đơn hàng.

### `server/src/config/env.js`

File đọc biến môi trường và chuẩn hóa cấu hình:

- Database: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `MYSQL_PORT`.
- Bảo mật: `JWT_SECRET`, `SECRET_CRYPTO`, cookie secure/sameSite.
- Client/server URL.
- Email OAuth.
- MoMo, VNPAY.
- Google AI chatbot.
- Cấu hình thời gian đơn hàng, review, rate limit.

### `server/src/middleware/auth.js`

File xác thực và phân quyền:

- `authUser`: yêu cầu đăng nhập.
- `authAdmin`: yêu cầu đăng nhập và là admin.
- `authCustomer`: yêu cầu đăng nhập và không phải admin.
- `authOptional`: có token thì gắn user, không có vẫn cho qua.
- `authOptionalCustomer`: cho guest hoặc customer, chặn admin mua hàng.

### `server/src/middleware/validate.js`

Nhận kết quả từ các validator, nếu có lỗi thì trả lỗi request. File này giúp backend không nhận dữ liệu sai định dạng.

### `server/src/middleware/asyncHandler.js`

Bọc controller async để tự chuyển lỗi vào error middleware, tránh phải try/catch ở mọi controller.

### `server/src/models/associations.js`

Định nghĩa quan hệ database:

- Category - Product.
- ComponentType - Product.
- User - CartItem.
- User - Order.
- Order - OrderItem.
- Order - PaymentAttempt.
- Product - OrderItem.
- User/Product/Order - ProductReview.
- Product - ProductSpec.
- Product - PcConfiguration.
- ComponentType - SpecDefinition.

## 8. Các bảng liên quan theo nghiệp vụ

| Nghiệp vụ | Bảng thường dùng |
|---|---|
| Đăng nhập/đăng ký | `users`, `refresh_tokens` |
| Quên mật khẩu | `users`, `otp_codes` |
| Sản phẩm | `products`, `categories`, `component_types`, `product_specs`, `pc_configurations` |
| Giỏ hàng | `cart_items`, `products` |
| Build PC | `build_pc_cart_items`, `products`, `component_types` |
| Đặt hàng | `orders`, `order_items`, `cart_items`, `products`, `product_specs`, `pc_configurations` |
| Thanh toán online | `orders`, `payment_attempts`, `order_items`, `products` |
| Đánh giá | `product_reviews`, `orders`, `order_items`, `products`, `users` |
| Blog | `blog_posts` |
| Liên hệ | `contacts` |
| Dashboard | `orders`, `order_items`, `products`, `users`, `payment_attempts` |
| Sản phẩm đã xem | `recently_viewed`, `products`, `users` |

## 9. Cách trả lời nhanh khi giảng viên hỏi "một chức năng chạy qua đâu?"

Có thể trả lời theo mẫu:

**Ví dụ chức năng đặt hàng:**  
Khi người dùng đặt hàng, frontend ở trang giỏ hàng gọi API `POST /api/orders` qua file `client/src/api/orders.js`. Backend nhận request ở `orders.routes.js`, qua middleware `authOptionalCustomer` và `checkoutValidation`, sau đó vào `orders.controller.js` hàm `checkout`. Controller gọi `checkout.service.js` hàm `checkout`. Nếu COD thì service gọi `order.service.js` hàm `createOrder`; nếu MoMo/VNPAY thì tạo đơn `pending_payment`, gọi `paymentAttempt.service.js` để tạo payment attempt và `payment.service.js` để tạo link thanh toán. Các bảng dùng chính là `orders`, `order_items`, `cart_items`, `products`, `payment_attempts` và các bảng thông tin sản phẩm như `product_specs`, `pc_configurations`.

**Ví dụ chức năng đăng nhập:**  
Frontend gọi `POST /api/auth/login`. Backend đi qua `auth.routes.js`, validate dữ liệu, vào `auth.controller.js` hàm `login`, gọi `auth.service.js` hàm `loginUser`. Service kiểm tra bảng `users`, so sánh mật khẩu bằng bcrypt, tạo access token và refresh token. Refresh token được lưu trong bảng `refresh_tokens`, sau đó server set cookie cho client.

**Ví dụ chức năng admin sửa sản phẩm:**  
Frontend admin gọi `PUT /api/products/:id`. Backend đi qua `products.routes.js`, middleware `authAdmin` kiểm tra quyền, validate dữ liệu rồi vào `products.controller.js` hàm `updateProduct`. Controller gọi `product.service.js` hàm `updateProduct`. Service cập nhật bảng `products`, cập nhật thông số ở `product_specs`, nếu là PC thì cập nhật `pc_configurations`, đồng thời kiểm tra liên kết với `categories` và `component_types`.
