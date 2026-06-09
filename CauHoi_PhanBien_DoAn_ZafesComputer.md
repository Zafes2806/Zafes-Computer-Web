# BÁO CÁO CHUẨN BỊ PHẢN BIỆN ĐỒ ÁN TỐT NGHIỆP

**Tên đề tài:** Xây dựng website bán máy tính và linh kiện Zafes Computer  
**Hướng hệ thống:** Website thương mại điện tử cho sản phẩm máy tính, linh kiện, cấu hình PC, giỏ hàng, đặt hàng, thanh toán, quản trị và chăm sóc khách hàng.  

## 1. Tóm tắt đồ án

Đồ án xây dựng một hệ thống web bán máy tính và linh kiện gồm hai phần chính:

- **Client:** React (thư viện xây dựng giao diện), Vite (công cụ build frontend), React Router (điều hướng trang), Ant Design (thư viện giao diện), SCSS module (CSS cục bộ theo component), Axios (thư viện gọi API từ frontend).
- **Server:** Node.js (môi trường chạy JavaScript phía server), Express.js (framework xây dựng API), Sequelize ORM (thư viện ánh xạ bảng database thành model), MySQL (hệ quản trị cơ sở dữ liệu quan hệ).
- **Các chức năng chính:** đăng ký, đăng nhập, đăng nhập Google, quên mật khẩu bằng OTP (mã xác thực một lần), quản lý sản phẩm, danh mục, loại linh kiện, thông số kỹ thuật, giỏ hàng, build PC (xây dựng cấu hình máy tính), đặt hàng, thanh toán COD (thanh toán khi nhận hàng)/MoMo/VNPAY, quản lý đơn hàng, đánh giá sản phẩm, blog, liên hệ, dashboard quản trị (bảng thống kê quản trị) và chatbot (trợ lý tư vấn tự động).
- **Các điểm kỹ thuật nổi bật:** xác thực JWT (JSON Web Token - token xác thực) và refresh token (token cấp lại phiên đăng nhập), cookie bảo mật, phân quyền khách hàng/quản trị, kiểm tra tồn kho trong transaction (giao dịch cơ sở dữ liệu), snapshot sản phẩm trong đơn hàng (bản chụp dữ liệu sản phẩm tại thời điểm mua), quản lý vòng đời đơn hàng, xử lý thanh toán online bằng payment attempt (bản ghi một lần thử thanh toán), rate limit API (giới hạn số request), Helmet (middleware tăng bảo mật HTTP header), CORS (cơ chế kiểm soát nguồn gọi API), Swagger (tài liệu API) và validate dữ liệu đầu vào (kiểm tra dữ liệu request).

### 1.1. Chú thích nhanh thuật ngữ tiếng Anh

| Thuật ngữ | Chú thích tiếng Việt |
|---|---|
| Client | Phần giao diện chạy trên trình duyệt người dùng |
| Server | Phần backend xử lý API, nghiệp vụ và database |
| Frontend | Phần giao diện người dùng |
| Backend | Phần xử lý phía server |
| API | Giao diện lập trình ứng dụng, nơi frontend gọi backend |
| REST API | Kiểu API dùng các phương thức HTTP như GET, POST, PUT, PATCH, DELETE |
| Axios | Thư viện gọi API từ frontend |
| React | Thư viện xây dựng giao diện theo component |
| Vite | Công cụ chạy và build frontend |
| Express.js | Framework Node.js dùng để xây dựng API |
| Sequelize ORM | Thư viện ánh xạ bảng database thành model trong code |
| Middleware | Hàm trung gian xử lý request trước khi vào controller |
| Controller | Lớp nhận request và gọi service |
| Service | Lớp xử lý nghiệp vụ chính |
| Model | Lớp đại diện cho bảng database |
| JWT | Token xác thực người dùng |
| Access token | Token ngắn hạn dùng để xác thực request |
| Refresh token | Token dài hơn dùng để cấp lại access token |
| Cookie httpOnly | Cookie không cho JavaScript phía trình duyệt đọc trực tiếp |
| OTP | Mã xác thực một lần |
| bcrypt | Thư viện hash mật khẩu/OTP |
| Transaction | Giao dịch database, đảm bảo nhiều thao tác cùng thành công hoặc cùng rollback |
| Rollback | Hoàn tác transaction khi có lỗi |
| Snapshot | Bản chụp dữ liệu tại một thời điểm |
| Payment attempt | Bản ghi một lần thử thanh toán |
| Callback | Request cổng thanh toán gửi ngược về server sau khi xử lý |
| Rate limit | Giới hạn số request trong một khoảng thời gian |
| CORS | Cơ chế giới hạn website nào được phép gọi API |
| Helmet | Middleware thêm các HTTP header bảo mật |
| Swagger | Công cụ mô tả và kiểm thử API |
| Soft delete | Xóa mềm, dữ liệu vẫn còn trong database nhưng bị ẩn |
| Paranoid | Cơ chế xóa mềm của Sequelize |
| Build PC | Chức năng chọn linh kiện để xây dựng cấu hình máy tính |
| PC configuration | Cấu hình chi tiết của PC nguyên bộ |
| Component type | Loại linh kiện/sản phẩm như CPU, RAM, VGA |
| Product spec | Thông số kỹ thuật của sản phẩm |
| Dashboard | Trang thống kê/tổng quan quản trị |
| Chatbot | Trợ lý trò chuyện tự động |
| Google Generative AI | Dịch vụ AI tạo sinh của Google |

## 2. Câu hỏi phản biện và câu trả lời mẫu

### Câu 1. Vì sao em chọn đề tài website bán máy tính và linh kiện?

**Trả lời:**  
Em chọn đề tài này vì nhu cầu mua máy tính và linh kiện trực tuyến ngày càng phổ biến. Khác với website bán hàng thông thường, sản phẩm máy tính có nhiều thông số kỹ thuật, người dùng cần lọc, so sánh, build cấu hình và kiểm tra đơn hàng. Vì vậy đề tài giúp em áp dụng được cả kiến thức frontend, backend, cơ sở dữ liệu, bảo mật, thanh toán và xử lý nghiệp vụ thực tế.

### Câu 2. Mục tiêu chính của đồ án là gì?

**Trả lời:**  
Mục tiêu chính là xây dựng một website thương mại điện tử có thể hỗ trợ người dùng xem sản phẩm, tìm kiếm, lọc theo danh mục hoặc loại linh kiện, thêm vào giỏ hàng, build PC, đặt hàng và thanh toán. Về phía quản trị, hệ thống hỗ trợ quản lý sản phẩm, danh mục, đơn hàng, người dùng, đánh giá, blog, liên hệ và thống kê doanh thu.

### Câu 3. Kiến trúc tổng thể của hệ thống như thế nào?

**Trả lời:**  
Hệ thống được chia thành client và server. Client dùng React để xây dựng giao diện người dùng và gọi API qua Axios. Server dùng Express.js để xây dựng RESTful API, Sequelize để thao tác với MySQL. Dữ liệu được lưu trong MySQL, ảnh sản phẩm được lưu trong thư mục uploads, còn các dịch vụ như email, Google login, MoMo, VNPAY và chatbot được tích hợp qua API bên ngoài.

### Câu 4. Vì sao em chọn React cho frontend?

**Trả lời:**  
Em chọn React vì React hỗ trợ xây dựng giao diện theo component, dễ tái sử dụng, phù hợp với các trang có nhiều trạng thái như giỏ hàng, quản lý đơn hàng, form quản trị và lọc sản phẩm. Ngoài ra React kết hợp với Vite giúp tốc độ phát triển nhanh, build nhẹ và dễ tổ chức mã nguồn.

### Câu 5. Vì sao em chọn Node.js và Express.js cho backend?

**Trả lời:**  
Node.js phù hợp với hệ thống web có nhiều thao tác I/O như đọc ghi cơ sở dữ liệu, gửi email, gọi cổng thanh toán. Express.js đơn giản, linh hoạt, dễ xây dựng REST API và middleware như xác thực, phân quyền, validate, xử lý lỗi, rate limit.

### Câu 6. Vì sao em dùng MySQL và Sequelize?

**Trả lời:**  
MySQL phù hợp với dữ liệu có quan hệ rõ ràng như người dùng, sản phẩm, danh mục, đơn hàng, chi tiết đơn hàng, đánh giá. Sequelize giúp ánh xạ bảng thành model, định nghĩa quan hệ, hỗ trợ transaction và giảm việc viết SQL thủ công trong các nghiệp vụ phức tạp.

### Câu 7. Hệ thống có những vai trò người dùng nào?

**Trả lời:**  
Hệ thống có ba nhóm chính: khách chưa đăng nhập, khách hàng đã đăng nhập và quản trị viên. Khách chưa đăng nhập vẫn có thể xem sản phẩm, thêm giỏ hàng tạm và đặt hàng guest. Khách hàng đăng nhập có thể quản lý thông tin cá nhân, đơn hàng, đánh giá. Quản trị viên có quyền truy cập trang admin để quản lý dữ liệu và quy trình đơn hàng.

### Câu 8. Cơ chế xác thực đăng nhập hoạt động như thế nào?

**Trả lời:**  
Khi người dùng đăng nhập thành công, server tạo access token và refresh token. Access token dùng để xác thực các request, refresh token dùng để cấp lại access token khi phiên hết hạn. Token được lưu trong cookie httpOnly để giảm nguy cơ bị JavaScript phía client đọc trực tiếp.

### Câu 9. Vì sao cần refresh token?

**Trả lời:**  
Access token (token truy cập ngắn hạn) nên có thời gian sống ngắn để giảm rủi ro nếu bị lộ. Refresh token (token làm mới phiên đăng nhập) giúp người dùng không phải đăng nhập lại liên tục. Trong hệ thống, refresh token được lưu và có thể revoke (thu hồi/hủy hiệu lực) khi logout, nhờ đó kiểm soát phiên đăng nhập tốt hơn.

### Câu 10. Hệ thống phân quyền admin như thế nào?

**Trả lời:**  
Backend có middleware xác thực người dùng và middleware xác thực admin. Sau khi giải mã token, server lấy thông tin user từ database, kiểm tra tài khoản còn tồn tại, không bị khóa, không bị xóa mềm, sau đó kiểm tra trường `isAdmin`. Nếu không phải admin thì server trả lỗi không có quyền truy cập.

### Câu 11. Vì sao vẫn phải kiểm tra quyền ở backend dù frontend đã ẩn trang admin?

**Trả lời:**  
Frontend chỉ giúp cải thiện trải nghiệm, không phải lớp bảo mật tuyệt đối. Người dùng có thể gọi API trực tiếp bằng Postman hoặc chỉnh request. Vì vậy mọi API quan trọng như quản lý sản phẩm, đơn hàng, người dùng đều phải kiểm tra quyền ở backend.

### Câu 12. Quên mật khẩu bằng OTP được xử lý ra sao?

**Trả lời:**  
Người dùng nhập email, server kiểm tra tài khoản, tạo OTP 6 số và gửi qua email. OTP không lưu dạng plain text mà được hash bằng bcrypt trong database. Khi reset mật khẩu, server kiểm tra token reset và so khớp OTP bằng bcrypt, sau đó hash mật khẩu mới rồi cập nhật.

### Câu 13. Vì sao mật khẩu phải hash?

**Trả lời:**  
Mật khẩu là dữ liệu nhạy cảm. Nếu lưu plain text, khi database bị lộ thì toàn bộ tài khoản sẽ bị nguy hiểm. Hash bằng bcrypt giúp không thể suy ngược trực tiếp mật khẩu, đồng thời bcrypt có salt và chi phí tính toán cao hơn các thuật toán hash thông thường.

### Câu 14. Hệ thống xử lý giỏ hàng như thế nào?

**Trả lời:**  
Với người dùng đăng nhập, giỏ hàng được lưu trong database theo `userId`. Với khách chưa đăng nhập, client có thể lưu giỏ hàng tạm và khi đăng nhập sẽ đồng bộ lên server. Khi checkout, server kiểm tra lại sản phẩm, tồn kho, giá khuyến mãi và tính tổng tiền ở backend để tránh client sửa dữ liệu.

### Câu 15. Vì sao không tin tưởng tổng tiền gửi từ client?

**Trả lời:**  
Client có thể bị chỉnh sửa dữ liệu bằng DevTools hoặc request giả. Vì vậy server chỉ nhận danh sách sản phẩm và số lượng, sau đó tự truy vấn giá hiện tại, khuyến mãi, tồn kho và tự tính tổng tiền. Đây là nguyên tắc quan trọng để tránh gian lận đơn hàng.

### Câu 16. Khi tạo đơn hàng, hệ thống tránh lỗi tồn kho như thế nào?

**Trả lời:**  
Hệ thống tạo đơn hàng trong transaction. Trong quá trình checkout, server khóa và kiểm tra sản phẩm, đảm bảo sản phẩm còn bán được và tồn kho đủ. Sau khi tạo order và order item, server trừ tồn kho trong cùng transaction. Nếu có lỗi ở bất kỳ bước nào, transaction rollback để dữ liệu không bị sai lệch.

### Câu 17. Vì sao cần lưu snapshot sản phẩm trong chi tiết đơn hàng?

**Trả lời:**  
Thông tin sản phẩm có thể thay đổi sau khi khách đặt hàng, ví dụ đổi giá, đổi tên, đổi ảnh, đổi thông số hoặc sản phẩm bị xóa. Nếu đơn hàng chỉ tham chiếu sản phẩm hiện tại thì lịch sử mua hàng sẽ sai. Vì vậy hệ thống lưu snapshot gồm tên, ảnh, giá, thông số tại thời điểm đặt hàng để đảm bảo hóa đơn và lịch sử đơn hàng chính xác.

### Câu 18. Hệ thống có hỗ trợ khách chưa đăng nhập đặt hàng không?

**Trả lời:**  
Có. Khách chưa đăng nhập có thể đặt hàng bằng thông tin giao hàng. Với đơn hàng guest, hệ thống sinh token truy cập đơn hàng và hash token trong database. Token thật được gửi qua email hoặc trả về metadata, giúp khách xem lại đơn mà không cần tài khoản.

### Câu 19. Vòng đời đơn hàng gồm những trạng thái nào?

**Trả lời:**  
Các trạng thái chính gồm chờ thanh toán, chờ xử lý, đang giao, đã giao, hoàn thành, hủy, yêu cầu trả hàng, từ chối trả hàng, đã trả hàng, đã hoàn tiền. Hệ thống định nghĩa luồng chuyển trạng thái hợp lệ để tránh admin hoặc user chuyển sai quy trình.

### Câu 20. Vì sao cần giới hạn chuyển trạng thái đơn hàng?

**Trả lời:**  
Nếu không giới hạn, đơn hàng có thể chuyển bất hợp lý, ví dụ từ đã hủy sang đang giao hoặc từ hoàn thành về chờ xử lý. Điều này gây sai nghiệp vụ, sai tồn kho và sai báo cáo. Do đó server kiểm tra trạng thái hiện tại và trạng thái kế tiếp có hợp lệ không trước khi cập nhật.

### Câu 21. Khi hủy đơn hàng thì tồn kho xử lý thế nào?

**Trả lời:**  
Khi đơn hàng bị hủy ở trạng thái cho phép hủy, hệ thống khôi phục lại tồn kho dựa trên các order item đã đặt. Việc hoàn kho được thực hiện trong transaction để tránh trường hợp trạng thái đơn đã hủy nhưng tồn kho chưa được trả lại.

### Câu 22. Hệ thống xử lý tự động hoàn thành đơn hàng như thế nào?

**Trả lời:**  
Backend có job vòng đời đơn hàng chạy định kỳ. Nếu đơn ở trạng thái đã giao quá thời gian cấu hình, hệ thống tự chuyển sang hoàn thành. Ngoài ra job cũng xử lý các phiên thanh toán online quá hạn và đơn chờ thanh toán quá lâu.

### Câu 23. Thanh toán COD và thanh toán online khác nhau thế nào?

**Trả lời:**  
Với COD, sau khi checkout thành công, đơn được tạo ở trạng thái chờ xử lý. Với MoMo hoặc VNPAY, đơn được tạo ở trạng thái chờ thanh toán, hệ thống tạo payment attempt và link thanh toán. Khi cổng thanh toán callback thành công, đơn mới chuyển sang chờ xử lý.

### Câu 24. Payment attempt là gì và vì sao cần?

**Trả lời:**  
Payment attempt là bản ghi đại diện cho một lần thử thanh toán của đơn hàng. Nó lưu provider, số tiền, trạng thái, mã giao dịch, link thanh toán, request và callback. Cần payment attempt để xử lý retry thanh toán, hết hạn thanh toán, callback trễ, giao dịch cần hoàn tiền và đối soát với cổng thanh toán.

### Câu 25. Nếu khách thanh toán thành công nhưng đơn đã bị hủy thì sao?

**Trả lời:**  
Hệ thống không tự chuyển đơn đã hủy thành đơn hợp lệ. Payment attempt (bản ghi lần thử thanh toán) sẽ được đánh dấu `requires_refund` (cần xử lý hoàn tiền), nghĩa là cần xử lý hoàn tiền. Cách này an toàn hơn vì nếu tồn kho đã được hoàn hoặc đơn không còn hợp lệ, không nên xác nhận đơn một cách tự động.

### Câu 26. Hệ thống kiểm tra callback MoMo/VNPAY thế nào?

**Trả lời:**  
Với MoMo, server xây dựng lại chuỗi chữ ký và dùng HMAC SHA256 với secret key để so sánh chữ ký callback, có dùng so sánh an toàn thời gian. Với VNPAY, hệ thống dùng thư viện VNPAY để verify return URL. Ngoài chữ ký, hệ thống còn kiểm tra số tiền callback có khớp với payment attempt không.

### Câu 27. Vì sao cần kiểm tra số tiền callback?

**Trả lời:**  
Chữ ký xác nhận dữ liệu đến từ cổng thanh toán, nhưng hệ thống vẫn cần đảm bảo số tiền thanh toán đúng bằng số tiền đơn hàng. Nếu số tiền không khớp, đơn hàng không được xác nhận để tránh thất thoát hoặc sai lệch giao dịch.

### Câu 28. Chức năng build PC hoạt động như thế nào?

**Trả lời:**  
Hệ thống phân loại sản phẩm theo loại linh kiện như CPU, mainboard, RAM, storage, GPU, nguồn, case, tản nhiệt. Người dùng có thể chọn từng linh kiện để tạo cấu hình. Với sản phẩm PC lắp sẵn, hệ thống có bảng cấu hình riêng lưu các thành phần như CPU, mainboard, RAM, storage, GPU, power, case và cooler.

### Câu 29. Vì sao tách bảng cấu hình PC thay vì để tất cả trong bảng sản phẩm?

**Trả lời:**  
Không phải sản phẩm nào cũng là PC lắp sẵn, nên nếu để tất cả trường cấu hình trong bảng sản phẩm sẽ gây nhiều cột rỗng và khó mở rộng. Tách bảng cấu hình PC giúp dữ liệu rõ nghĩa hơn, dễ bảo trì và phù hợp chuẩn hóa cơ sở dữ liệu.

### Câu 30. Hệ thống quản lý thông số kỹ thuật sản phẩm như thế nào?

**Trả lời:**  
Hệ thống có model thông số sản phẩm và định nghĩa thông số theo loại linh kiện. Nhờ vậy mỗi loại sản phẩm có thể có bộ thông số riêng, ví dụ CPU có socket (chuẩn chân cắm), số nhân; RAM có dung lượng, bus (tốc độ truyền dữ liệu); GPU có VRAM (bộ nhớ card đồ họa). Cách này linh hoạt hơn so với cố định tất cả thông số thành các cột trong bảng sản phẩm.

### Câu 31. Tính năng đánh giá sản phẩm có kiểm soát không?

**Trả lời:**  
Có. Hệ thống gắn đánh giá với người dùng, sản phẩm và đơn hàng. Người dùng chỉ nên đánh giá sau khi mua hàng và trong khoảng thời gian cho phép. Điều này giúp đánh giá đáng tin cậy hơn, tránh spam hoặc đánh giá khi chưa mua sản phẩm.

### Câu 32. Hệ thống bảo vệ API khỏi request quá nhiều như thế nào?

**Trả lời:**  
Server dùng `express-rate-limit` để giới hạn request. Có giới hạn riêng cho API đọc, API ghi và API xác thực. Việc này giúp giảm nguy cơ spam, brute force đăng nhập và làm quá tải server.

### Câu 33. Hệ thống có những biện pháp bảo mật nào?

**Trả lời:**  
Một số biện pháp bảo mật gồm: hash mật khẩu bằng bcrypt, JWT và refresh token, cookie httpOnly, kiểm tra tài khoản bị khóa hoặc xóa mềm, phân quyền backend, validate dữ liệu đầu vào, CORS theo client origin, Helmet để thêm HTTP security headers, rate limit, verify callback thanh toán và sanitize HTML khi hiển thị nội dung có định dạng.

### Câu 34. Vì sao cần validate dữ liệu ở backend?

**Trả lời:**  
Validate ở frontend chỉ giúp người dùng nhập đúng hơn, nhưng không đủ bảo mật. Backend phải validate để chống dữ liệu thiếu, sai kiểu, sai định dạng hoặc request giả. Điều này giúp bảo vệ database và đảm bảo nghiệp vụ luôn nhất quán.

### Câu 35. CORS được cấu hình để làm gì?

**Trả lời:**  
CORS cho phép server chỉ chấp nhận request từ các origin client được cấu hình. Vì hệ thống dùng cookie đăng nhập và frontend/backend có thể chạy khác domain hoặc port, CORS phải bật `credentials` và giới hạn origin để tránh website lạ gọi API kèm cookie.

### Câu 36. Vì sao dùng Swagger?

**Trả lời:**  
Swagger giúp mô tả và kiểm thử API trực quan. Khi bảo trì hoặc trình bày đồ án, Swagger giúp người xem biết hệ thống có những endpoint nào, request cần dữ liệu gì và response trả về ra sao.

### Câu 37. Dashboard quản trị thống kê gì?

**Trả lời:**  
Dashboard quản trị dùng để theo dõi tình hình hệ thống như đơn hàng, doanh thu, sản phẩm, người dùng hoặc các dữ liệu vận hành khác. Mục tiêu là giúp quản trị viên có cái nhìn tổng quan và ra quyết định nhanh hơn.

### Câu 38. Chatbot trong hệ thống dùng để làm gì?

**Trả lời:**  
Chatbot hỗ trợ người dùng hỏi nhanh về sản phẩm, tư vấn mua hàng hoặc giải đáp các câu hỏi phổ biến. Backend tích hợp Google Generative AI thông qua API key, client gọi API chatbot để hiển thị hội thoại trên giao diện.

### Câu 39. Nếu sản phẩm bị xóa sau khi khách đã mua thì đơn hàng có bị mất thông tin không?

**Trả lời:**  
Không. Vì order item đã lưu snapshot thông tin sản phẩm tại thời điểm mua. Do đó dù sản phẩm bị xóa mềm hoặc chỉnh sửa, đơn hàng vẫn hiển thị được tên, ảnh, giá, thông số và số lượng đã mua.

### Câu 40. Nếu nhiều người cùng mua một sản phẩm còn ít tồn kho thì hệ thống xử lý ra sao?

**Trả lời:**  
Khi checkout, hệ thống dùng transaction và khóa dữ liệu sản phẩm để kiểm tra và trừ tồn kho. Nếu tồn kho không đủ thì request bị từ chối. Cách này giảm rủi ro bán vượt số lượng tồn kho trong các tình huống nhiều người đặt hàng cùng lúc.

### Câu 41. Vì sao hệ thống có trạng thái `pending_payment`?

**Trả lời:**  
Trạng thái `pending_payment` (chờ thanh toán) dùng cho đơn thanh toán online đã giữ hàng nhưng chưa được cổng thanh toán xác nhận. Nếu thanh toán thành công, đơn chuyển sang `pending` (chờ xác nhận); nếu hết hạn hoặc thất bại, đơn bị hủy và hoàn lại tồn kho. Trạng thái này giúp tách rõ đơn đã thanh toán và chưa thanh toán.

### Câu 42. Khi tạo link thanh toán thất bại thì hệ thống xử lý thế nào?

**Trả lời:**  
Nếu lỗi do dữ liệu không hợp lệ hoặc vượt giới hạn số tiền, hệ thống hủy đơn chờ thanh toán và hoàn kho. Nếu lỗi tạm thời từ gateway, hệ thống có thể trả về đơn ở trạng thái chờ thanh toán nhưng không có payment URL, để người dùng thử tạo lại link thanh toán.

### Câu 43. Hệ thống có hỗ trợ tìm kiếm và lọc sản phẩm không?

**Trả lời:**  
Có. Client có các trang danh sách sản phẩm, tìm kiếm, lọc theo danh mục và loại linh kiện. Backend có các API sản phẩm hỗ trợ truy vấn, phân trang và lấy dữ liệu liên quan như danh mục, thông số, cấu hình PC.

### Câu 44. Vì sao cần phân trang?

**Trả lời:**  
Phân trang giúp giảm lượng dữ liệu trả về trong một request, tăng tốc độ tải trang và giảm tải cho server/database. Với các bảng lớn như sản phẩm, đơn hàng, người dùng, phân trang là cần thiết để hệ thống vận hành ổn định.

### Câu 45. Hệ thống xử lý upload ảnh như thế nào?

**Trả lời:**  
Server dùng middleware upload dựa trên Multer, lưu ảnh vào thư mục uploads và phục vụ tĩnh qua route `/uploads`. Server cũng xử lý lỗi upload như quá kích thước hoặc số lượng file vượt giới hạn.

### Câu 46. Điểm mạnh của đồ án là gì?

**Trả lời:**  
Điểm mạnh là hệ thống có nhiều nghiệp vụ gần thực tế: đăng nhập và refresh token, quên mật khẩu OTP, phân quyền, checkout guest, snapshot đơn hàng, thanh toán MoMo/VNPAY, retry thanh toán, xử lý callback trễ, hoàn kho khi hủy, tự động hoàn thành đơn, quản lý đánh giá sau mua hàng và dashboard admin.

### Câu 47. Hạn chế của đồ án là gì?

**Trả lời:**  
Một số hạn chế là chưa có test tự động đầy đủ, chưa triển khai cloud storage cho ảnh, chưa có hệ thống vận chuyển thật, chưa có recommendation nâng cao và khả năng kiểm tra tương thích linh kiện PC vẫn có thể phát triển sâu hơn. Đây là các hướng em có thể cải tiến sau đồ án.

### Câu 48. Nếu triển khai thực tế, em sẽ cải tiến gì?

**Trả lời:**  
Em sẽ bổ sung test tự động, logging và monitoring, triển khai Docker, dùng cloud storage cho ảnh, thêm cache cho dữ liệu đọc nhiều, tối ưu SEO, tích hợp đơn vị vận chuyển, cải thiện kiểm tra tương thích linh kiện và bổ sung báo cáo doanh thu chi tiết hơn.

### Câu 49. Em học được gì từ đồ án này?

**Trả lời:**  
Em học được cách xây dựng một hệ thống web full-stack hoàn chỉnh, tổ chức frontend/backend, thiết kế database quan hệ, xử lý xác thực và phân quyền, quản lý transaction, tích hợp cổng thanh toán, xử lý nghiệp vụ đơn hàng và bảo vệ API trước các lỗi hoặc request không hợp lệ.

### Câu 50. Nếu giảng viên hỏi phần em tâm đắc nhất, em nên trả lời gì?

**Trả lời:**  
Phần em tâm đắc nhất là luồng checkout và quản lý đơn hàng, vì đây là phần có nhiều nghiệp vụ quan trọng: kiểm tra tồn kho, tạo đơn trong transaction, snapshot sản phẩm, trừ kho, xử lý COD và thanh toán online, retry thanh toán, callback từ gateway, hoàn kho khi hủy và tự động cập nhật vòng đời đơn hàng. Phần này thể hiện rõ việc hệ thống không chỉ là CRUD mà có xử lý nghiệp vụ thực tế.

## 3. Một số câu hỏi khó có thể gặp

### Câu 51. Nếu access token bị đánh cắp thì hệ thống có an toàn không?

**Trả lời:**  
Không có hệ thống nào an toàn tuyệt đối nếu token bị đánh cắp. Tuy nhiên hệ thống giảm rủi ro bằng cách lưu token trong cookie httpOnly, đặt thời gian sống access token ngắn, dùng refresh token có thể thu hồi khi logout và kiểm tra trạng thái tài khoản ở mỗi request. Nếu triển khai thực tế, em sẽ bổ sung HTTPS bắt buộc, CSRF protection và cơ chế phát hiện phiên bất thường.

### Câu 52. Cookie httpOnly chống được tấn công gì?

**Trả lời:**  
Cookie httpOnly giúp JavaScript phía trình duyệt không đọc trực tiếp được token, từ đó giảm rủi ro bị đánh cắp token khi có lỗ hổng XSS. Tuy nhiên nó không thay thế hoàn toàn việc chống XSS và CSRF, nên hệ thống vẫn cần sanitize HTML, kiểm soát origin và cấu hình SameSite phù hợp.

### Câu 53. Vì sao có cookie `logged` không httpOnly?

**Trả lời:**  
Cookie `logged` (cờ báo trạng thái đăng nhập) không chứa token hay dữ liệu nhạy cảm, chỉ là cờ để frontend biết người dùng có thể đang đăng nhập và gọi API lấy thông tin user. Token thật vẫn nằm trong cookie httpOnly (cookie không cho JavaScript đọc trực tiếp). Cách này giúp giao diện phản ứng tốt hơn mà không để lộ access token.

### Câu 54. Nếu callback thanh toán được gửi nhiều lần thì sao?

**Trả lời:**  
Hệ thống xử lý theo hướng idempotent. Payment attempt đã thành công thì không tạo đơn mới hoặc trừ kho lại. Nếu callback lặp lại, server kiểm tra trạng thái attempt và order hiện tại để trả kết quả phù hợp. Điều này quan trọng vì các cổng thanh toán có thể gửi callback nhiều lần.

### Câu 55. Vì sao cần transaction trong thanh toán và đơn hàng?

**Trả lời:**  
Vì các thao tác như tạo đơn, tạo chi tiết đơn, trừ kho, hủy đơn, hoàn kho và cập nhật payment attempt liên quan chặt chẽ với nhau. Nếu một bước thành công còn bước khác thất bại, dữ liệu sẽ sai. Transaction đảm bảo hoặc tất cả cùng thành công, hoặc tất cả rollback.

### Câu 56. Tại sao không xóa cứng người dùng hoặc sản phẩm?

**Trả lời:**  
Trong hệ thống thương mại điện tử, dữ liệu người dùng, sản phẩm và đơn hàng có liên quan đến lịch sử giao dịch. Xóa cứng có thể làm mất dữ liệu đối soát. Vì vậy nên dùng xóa mềm hoặc trạng thái khóa/ngừng bán để giữ lịch sử nhưng không cho tiếp tục sử dụng.

### Câu 57. Hệ thống chống XSS như thế nào?

**Trả lời:**  
Hệ thống có các tiện ích sanitize HTML ở cả backend và frontend cho những nội dung có HTML như blog hoặc mô tả sản phẩm. Ngoài ra React mặc định escape text khi render. Với nội dung cần render HTML, phải sanitize trước khi hiển thị.

### Câu 58. Nếu server restart thì job tự động có bị mất không?

**Trả lời:**  
Job vòng đời đơn hàng được khởi động lại khi server bootstrap. Dữ liệu trạng thái nằm trong database nên server restart không làm mất dữ liệu. Sau khi server chạy lại, job tiếp tục quét các đơn đã đủ điều kiện để xử lý.

### Câu 59. Nếu hệ thống có nhiều server chạy song song thì job định kỳ có vấn đề gì?

**Trả lời:**  
Nếu nhiều instance cùng chạy job, có thể xảy ra xử lý trùng. Hiện tại hệ thống dùng transaction và khóa dữ liệu để giảm rủi ro. Nếu triển khai production nhiều server, em sẽ tách job sang worker riêng hoặc dùng distributed lock/queue để đảm bảo mỗi job chỉ chạy một lần tại một thời điểm.

### Câu 60. Làm sao chứng minh đồ án có khả năng mở rộng?

**Trả lời:**  
Hệ thống đã tách frontend/backend, tách controller/service/model, dùng REST API, phân trang dữ liệu, tách cấu hình môi trường, tách bảng theo nghiệp vụ như payment attempt, order item, product spec, pc configuration. Đây là nền tảng tốt để mở rộng thêm module vận chuyển, khuyến mãi, kho hàng, recommendation hoặc mobile app.

## 4. Gợi ý trả lời khi bị hỏi về điểm chưa hoàn thiện

Nếu hội đồng hỏi "Đồ án của em còn thiếu gì?", có thể trả lời:

**Trả lời mẫu:**  
Đồ án của em đã hoàn thành các chức năng chính của một website bán máy tính và linh kiện. Tuy nhiên vẫn còn một số điểm có thể cải tiến nếu phát triển thành sản phẩm thực tế, ví dụ bổ sung test tự động, logging tập trung, cloud storage cho ảnh, tối ưu SEO, tích hợp vận chuyển thật, cache dữ liệu đọc nhiều và kiểm tra tương thích linh kiện PC chi tiết hơn. Em xem đây là hướng phát triển tiếp theo sau đồ án.

## 5. Gợi ý mở đầu khi thuyết trình phản biện

Kính thưa thầy/cô, đồ án của em là hệ thống website bán máy tính và linh kiện Zafes Computer. Hệ thống được xây dựng theo mô hình client-server, frontend dùng React và backend dùng Node.js Express kết hợp MySQL. Ngoài các chức năng thương mại điện tử cơ bản như xem sản phẩm, giỏ hàng và đặt hàng, đồ án còn tập trung vào các nghiệp vụ đặc thù như build PC, quản lý thông số linh kiện, thanh toán MoMo/VNPAY, snapshot sản phẩm trong đơn hàng, quản lý vòng đời đơn hàng và phân quyền quản trị. Mục tiêu của em là xây dựng một hệ thống có tính thực tế, dữ liệu nhất quán và có khả năng mở rộng.

## 6. Gợi ý kết thúc khi phản biện

Qua đồ án này, em đã áp dụng được kiến thức về lập trình web full-stack, thiết kế cơ sở dữ liệu, xây dựng REST API, xác thực người dùng, phân quyền, transaction, tích hợp thanh toán và xử lý nghiệp vụ thương mại điện tử. Em nhận thấy hệ thống vẫn có thể tiếp tục hoàn thiện thêm về kiểm thử tự động, triển khai production và tối ưu hiệu năng, nhưng đồ án đã đáp ứng được mục tiêu ban đầu là xây dựng một website bán máy tính và linh kiện có đầy đủ luồng người dùng và quản trị.
