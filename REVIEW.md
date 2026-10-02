# Rà soát tool CHECK CHIMNEY

Ngày kiểm tra: 02/10/2026.

## Phạm vi và kết luận

Đã đọc toàn bộ 4 file gốc: `index.html`, `engine.js`, `app.js`, `style.css`; chạy kiểm tra cú pháp JavaScript, thử trực tiếp engine bằng Node.js và thao tác giao diện trên trình duyệt localhost. Không sửa 4 file nguồn.

Ứng dụng chạy được với dữ liệu demo, nhưng còn các lỗi về chất lượng dữ liệu, xử lý biên và hiển thị. Chưa có dữ liệu Spinnaker thực tế, quy tắc chimney chính thức hoặc sơ đồ vị trí bãi để xác nhận độ đúng nghiệp vụ. Không nên coi số chimney hiện tại là kết luận vận hành đã được kiểm chứng.

## Cấu trúc hiện tại

| File | Chức năng |
| --- | --- |
| `index.html` | Nhập dữ liệu, chỉ số, sơ đồ block/bay/row, bảng kết quả |
| `engine.js` | Danh sách 50 block RTG và 32 block Top/Side pick; parse TSV; tính chiều cao và chimney |
| `app.js` | Điều khiển nhập/xóa/demo, chọn vị trí và dựng giao diện |
| `style.css` | Bố cục, màu cảnh báo, responsive, lưới chiều cao |

Đây là ứng dụng HTML/CSS/JS thuần chạy tại trình duyệt. Không thấy lời gọi mạng để gửi dữ liệu, backend hoặc thư viện bên ngoài trong 4 file. Không có bộ test, cấu hình bãi hoặc tài liệu nghiệp vụ đi kèm. Thư mục hiện tại không phải Git repository.

## Quy tắc mà code đang thực hiện

- Nhận đúng 7 cột ngăn cách bằng Tab theo thứ tự cố định.
- Gộp stack theo `block + bay + row`; chiều cao bằng tier lớn nhất.
- Chimney: chiều cao ít nhất 3 và cao hơn mỗi row liền kề ít nhất 2 tier.
- Với RTG, row A bỏ qua phía trái và row H bỏ qua phía phải.
- Row liền kề được suy ra bằng ký tự/số cộng hoặc trừ 1.
- Không tìm thấy stack liền kề thì coi chiều cao bằng 0.
- SIZE không được kiểm tra hoặc dùng để xác định phạm vi chiếm chỗ của container.

Đây là mô tả code, không phải xác nhận rằng các quy tắc này đúng cho bãi thực tế.

## Các phát hiện đã tái hiện

### 1. P1 — Dữ liệu thiếu vẫn được dùng để kết luận chimney

Vị trí: `engine.js:32-40`; trạng thái kết quả tại `app.js:35-39`.

Chỉ dán một dòng vị trí `1C 01 B 4`: parser trả về 1 container hợp lệ, 0 lỗi; engine trả về chimney tại B, cao 4, hai phía bằng 0. Tương tự, stack chỉ có tier 1, 3, 4 không được cảnh báo thiếu tier 2.

Việc lấy tier lớn nhất làm chiều cao là hợp lý nếu dữ liệu đầy đủ. Vấn đề là tool không phân biệt vị trí trống đã xác nhận với vị trí không có trong dữ liệu được dán. Dữ liệu xuất có lọc hoặc thiếu dòng có thể tạo cảnh báo giả hoặc bỏ sót chimney mà không có dòng lỗi nào.

Đề xuất: xác định phạm vi và yêu cầu dữ liệu đầy đủ; cảnh báo tier bị khuyết; có trạng thái chưa đủ dữ liệu; không tự biến hàng xóm chưa xác định thành stack rỗng chắc chắn. Trường hợp có dòng bị loại, đánh dấu các vị trí chịu ảnh hưởng.

### 2. P1 — Parser nhận row ngoài A–H nhưng engine vẫn coi H là biên

Vị trí: `engine.js:15`, `engine.js:39`.

Dữ liệu RTG tại cùng bay gồm G=1, H=4, I=4, J=4 được chấp nhận không lỗi. Engine vẫn báo H là chimney và `right = null`, dù I ở bên cạnh cao 4. Sơ đồ lại hiển thị được I/J.

Nếu RTG chỉ có A–H thì parser phải loại hoặc cảnh báo I/J. Nếu một block có thêm row, engine phải dùng biên của block đó. Hiện hai phần không thống nhất.

Đề xuất: cấu hình row hợp lệ, thứ tự row và row biên theo từng block, dùng chung cho parser, tính toán và sơ đồ.

### 3. P2 — Sơ đồ nhiều hơn 8 row bị xuống dòng, mất tương ứng với nhãn

Vị trí: `app.js:16-17`, `style.css:3`.

Ngay trong demo, block 1A sinh 9 row A–I. CSS dùng `var(--rows,8)` nhưng app không gán `--rows`. Trên trình duyệt, 8 stack đầu cùng tọa độ dọc; stack thứ 9 nằm thấp hơn 202 px. Các nhãn row được dựng ở một grid riêng bên dưới toàn bộ stack, khiến sơ đồ không còn đúng một hàng mặt cắt.

Đề xuất: đồng bộ số cột với `rows.length` cho cả stack và nhãn, giữ chúng cùng chiều rộng và cuộn ngang chung.

### 4. P2 — Sửa dữ liệu nhưng kết quả cũ không được đánh dấu

Vị trí: `app.js:35-43`; ô nhập tại `index.html`.

Chạy demo rồi thay ô nhập bằng một container tier 1: số liệu vẫn hiện 71 container / 5 chimney và trạng thái cũ. Không có listener `input` để báo dữ liệu đã thay đổi. Nhấn Kiểm tra lần nữa mới cập nhật đúng về 1 container / 0 chimney.

Đề xuất: đánh dấu kết quả đã cũ ngay khi người dùng sửa dữ liệu, hiện yêu cầu kiểm tra lại hoặc xóa kết quả cũ. Biến `loaded` hiện được gán nhưng không được dùng để quản lý trạng thái này.

### 5. P2 — Container trùng vị trí khác nhau được xử lý theo thứ tự dòng

Vị trí: `engine.js:23-26`.

Cùng container number xuất hiện tại `1C 01 B 4` và `1C 01 B 1`: đặt dòng tier 4 trước thì có 1 chimney; đảo thứ tự thì có 0 chimney. Cả hai lần đều báo một lỗi trùng. Giao diện có cảnh báo kết quả tạm tính, nhưng bản ghi đầu tiên vẫn được dùng như dữ liệu có thể tính stack.

Đề xuất: với các bản ghi trùng nhưng mâu thuẫn vị trí, đánh dấu tất cả vị trí liên quan là chưa xác định thay vì mặc định lấy dòng đầu. Bản ghi trùng hoàn toàn có thể được khử trùng riêng.

### 6. P2 — Có header nhưng không kiểm tra đủ tên và thứ tự cột

Vị trí: `engine.js:9-12`.

Parser bỏ qua header chỉ vì hai cột đầu là SIZE và BLOCK. Thử đổi chỗ LINE OPERATOR và UN DISCHARGE PORT trong header và dữ liệu: vẫn 0 lỗi nhưng thông tin hãng tàu/cảng bị gán ngược. Việc có header khiến người dùng khó nhận biết rằng tool vẫn đọc hoàn toàn theo vị trí cố định.

Đề xuất: kiểm tra cả 7 tên và thứ tự cột hoặc ánh xạ theo tên header. Với dữ liệu không có header, giữ quy ước thứ tự cố định và hướng dẫn rõ.

### 7. P2 — Các lỗi từ dòng thứ 151 trong danh sách bị ẩn hoàn toàn

Vị trí: `app.js:38`.

Dán 151 dòng sai: chỉ số và tiêu đề báo 151 lỗi, nhưng DOM chỉ có 150 thông báo do `slice(0,150)`. Không có nút xem tiếp, tải danh sách hoặc thông báo đang giới hạn hiển thị.

Đề xuất: phân trang/xem thêm hoặc xuất toàn bộ lỗi kèm dòng gốc để người dùng sửa hết dữ liệu.

### 8. P3 — Row được chọn tự động chưa được tô trạng thái chọn

Vị trí: `app.js:17-19`.

Sau khi chạy demo, chi tiết mở ở row E nhưng không có nút row nào mang lớp `active`. Nguyên nhân: dựng nút trước, rồi mới gán `selectedRow` mặc định. Lỗi tương tự khi đổi bay và app tự chọn row.

Đề xuất: xác định `selectedRow` trước khi render nhãn row.

## Các điểm nghiệp vụ cần xác nhận

1. Điều kiện chimney chính thức: tier tối thiểu, chênh cao, cần thấp ở cả hai phía hay một phía, và cách tính vị trí biên.
2. Bay của container 20/40/45 feet có được quy đổi về vị trí vật lý chung không. Code chỉ so cùng chuỗi bay, không dùng SIZE. Trong thử nghiệm, A/C cao 4 ở bay 02 và B cao 4 ở bay 01 tạo ra 3 chimney. Nếu bay 02 của container 40 feet phủ vị trí bay 01, các so sánh này cần sửa. Chưa xác nhận quy ước này cho bãi của bạn.
3. Mỗi block có bao nhiêu row/bay/tier; có bỏ chữ, bỏ số hoặc ngắt row bởi lối đi không. Hiện row cạnh luôn là cộng/trừ 1, chưa có bản đồ thực tế.
4. Quy tắc RTG và Top/Side pick có giống nhau không. Ngoài xử lý biên A/H, engine hiện dùng chung một công thức.
5. Định dạng SIZE, CURRENT POSITION thực tế và ý nghĩa dấu `+`. SIZE trống hoặc `banana` đều được chấp nhận. Vị trí có `+`, YARD, GATE hiện bị loại có thông báo; cần phân loại đúng theo quy ước xuất dữ liệu.
6. Dữ liệu đầu vào có phải snapshot đầy đủ của vùng kiểm tra không, hay đã lọc theo hãng tàu, trạng thái, kích thước hoặc cảng.

## Kiểm chứng đã thực hiện

- `node --check engine.js` và `node --check app.js`: đạt.
- 15 assertion cơ bản: định dạng vị trí được hỗ trợ; từ chối vị trí không cụ thể, block không biết, bay 00, tier ngoài 1–9; ví dụ chiều cao 1–4–1 và 4–4–4: đạt theo công thức hiện tại.
- 12 ca chẩn đoán engine: stack thiếu tier, row H/I, SIZE rỗng/sai, đổi header, bay/size hỗn hợp, row số, row Top pick và đảo thứ tự bản ghi trùng. Các kết quả cụ thể được ghi ở trên.
- Trình duyệt: demo cho 71 container, 5 chimney, 3 block có chimney, 0 lỗi.
- Trình duyệt: xác nhận grid 9 row/8 cột, thiếu active row, trạng thái cũ sau khi sửa input, danh sách 151 lỗi chỉ hiện 150 dòng.
- Kiểm tra lại dữ liệu 1 container tier 1: 0 chimney; Clear xóa input, kết quả và chi tiết đúng.
- Không ghi nhận lỗi JavaScript trong log lỗi trình duyệt ở các thao tác đã thử.

Chưa xác minh với dữ liệu bãi thật, chưa đo hiệu năng trên snapshot toàn bãi, chưa kiểm tra đầy đủ nhiều trình duyệt/kích thước màn hình.

## Thứ tự đề xuất

Chốt quy tắc nghiệp vụ và cấu hình bãi → sửa độ tin cậy dữ liệu/biên/bay vật lý → sửa trạng thái kết quả và sơ đồ → thêm test hồi quy từ dữ liệu đã được planner xác nhận.
