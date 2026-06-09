# Ke hoach cai tien Component Type va bo loc san pham

## 1. Van de hien tai

He thong dang co bang `component_types` de quan ly loai linh kien/san pham, vi du:

- `cpu`
- `ram`
- `vga`
- `mainboard`
- `pc`

Tuy nhien, mot so luong code van hard-code cac ma loai linh kien. Vi du trong `category.service.js` co danh sach:

```js
const COMPONENT_FILTER_TYPES = [
  'cpu',
  'ram',
  'vga',
  'mainboard',
  'ssd',
  'hdd',
  'power',
  'cooler',
  'case',
  'monitor',
  'keyboard',
  'mouse',
  'headset',
];
```

Dieu nay lam cho bang `component_types` chua thuc su la nguon du lieu chinh cho cac loai linh kien. Neu admin xoa hoac them moi loai linh kien trong database, mot so chuc nang van khong thay doi theo vi code dang phu thuoc vao danh sach hard-code.

## 2. Anh huong cua thiet ke hien tai

### 2.1. Xoa component type khong lam hong ngay chuc nang mua hang

Khi admin xoa `pc`, `cpu`, `ram` hoac cac loai khac, san pham cu van co field `componentType` trong bang `products`. Vi vay cac luong nhu xem san pham, them gio hang thuong va dat hang co the van hoat dong.

Ly do la cac luong nay chu yeu dua vao:

- san pham co ton tai hay khong;
- san pham co dang ban hay khong;
- ton kho;
- gia;
- danh muc;
- snapshot don hang.

Chung khong phai luc nao cung validate lai `componentType` trong bang `component_types`.

### 2.2. Cac chuc nang quan tri se bi anh huong

Neu mot component type bi xoa, cac chuc nang sau co the gap loi hoac thieu lua chon:

- Tao moi san pham thuoc loai da xoa.
- Sua san pham cu thuoc loai da xoa.
- Dropdown chon loai san pham trong admin.
- Build PC, vi gio build PC co kiem tra `isBuildPcAllowed`.
- Bo loc theo loai linh kien trong mot so API.
- Quan ly thuoc tinh ky thuat theo component type.

### 2.3. Rieng `pc` la loai dac biet

`pc` khong chi la mot loai san pham binh thuong. Code dang dung `componentType === 'pc'` de xu ly rieng:

- Bat buoc `pcConfiguration` khi tao/sua san pham PC nguyen bo.
- Luu cau hinh PC vao bang rieng.
- Khong dung `ProductSpec` thong thuong.
- Hien thi cau hinh CPU, RAM, GPU, mainboard...
- Khong cho them PC nguyen bo vao Build PC.

Vi vay `pc` nen duoc xem la system type, khong nen cho admin xoa tuy tien.

## 3. Muc tieu cai tien

Muc tieu cua cai tien la:

- De bang `component_types` tro thanh nguon du lieu chinh cho danh sach loai linh kien.
- Giam hard-code danh sach component type trong backend/frontend.
- Bao ve cac loai he thong quan trong nhu `pc`, `cpu`, `ram`, `vga`, `mainboard`.
- Van giu duoc logic dac biet cua PC nguyen bo.
- Khong lam vo cac san pham va don hang hien co.

## 4. Huong thiet ke de xuat

### 4.1. Phan biet system type va custom type

Nen bo sung y niem `system type` cho cac loai linh kien cot loi.

Vi du cac type nen duoc xem la system type:

- `pc`
- `cpu`
- `mainboard`
- `ram`
- `ssd`
- `hdd`
- `vga`
- `power`
- `case`
- `cooler`
- `monitor`
- `keyboard`
- `mouse`
- `headset`

Admin co the sua ten hien thi hoac trang thai, nhung khong nen duoc xoa cac system type nay.

Co the trien khai bang mot trong hai cach:

- Cach nhanh: hard-code danh sach system type trong service.
- Cach tot hon: them cot `isSystem` vao bang `component_types`.

Khuyen nghi cho do an hien tai: co the dung cach nhanh truoc, sau do neu can nang cap thi them cot `isSystem`.

### 4.2. Lay danh sach bo loc tu database

Thay vi hard-code `COMPONENT_FILTER_TYPES`, backend nen lay cac loai linh kien tu bang `component_types`.

Dieu kien goi y:

```js
where: {
  status: 'active',
  isProductType: true,
  isBuildPcAllowed: true,
}
```

Ly do dung `isBuildPcAllowed: true`:

- Cac loai nhu CPU, RAM, VGA, SSD... la linh kien co the dua vao bo loc cau hinh.
- `pc` co `isBuildPcAllowed: false`, nen khong xuat hien thanh nhom filter rieng.

Neu sau nay admin them `webcam` va bat `isBuildPcAllowed`, bo loc co the tu dong co nhom `webcam` ma khong can sua code.

### 4.3. Giu mapping rieng cho PC nguyen bo

Phan mapping tu `pcConfiguration` sang cac nhom linh kien van nen de co dinh, vi day la nghiep vu dac thu.

Vi du:

```js
const PC_CONFIGURATION_FILTER_MAP = {
  cpu: 'cpu',
  motherboard: 'mainboard',
  ram: 'ram',
  gpu: 'vga',
  power: 'power',
  computerCase: 'case',
  cooler: 'cooler',
};
```

Rieng `storage` co the can xu ly dac biet:

- Neu chuoi chua `ssd` thi dua vao nhom `ssd`.
- Neu chuoi chua `hdd` thi dua vao nhom `hdd`.

Day la logic nghiep vu hop ly de hard-code, vi cau truc cau hinh PC khong phai danh sach loai linh kien dong.

### 4.4. Chi bung cau hinh neu san pham la PC

Hien tai ham build filter goi doc `pcConfiguration` cho moi san pham. Ve mat ket qua co the van dung, nhung nen viet ro rang hon:

```js
if (normalizeComponentType(product.componentType) !== 'pc') {
  return;
}
```

Dieu nay giup code de doc hon va tranh truong hop san pham khac vo tinh co `pcConfiguration`.

## 5. Ke hoach trien khai theo giai doan

### Giai doan 1: Bao ve cac component type cot loi

Muc tieu: tranh viec admin xoa cac loai ma code/nghiep vu dang phu thuoc.

Cong viec:

- Tao danh sach system component type.
- Chan xoa mem cac type he thong trong `componentType.service.js`.
- Chan xoa vinh vien cac type he thong.
- Voi `pc`, chan cap nhat `isBuildPcAllowed = true`.
- Frontend admin an nut xoa voi system type hoac disable nut xoa.

Ket qua mong muon:

- Admin khong the xoa `pc`, `cpu`, `ram`, `vga`...
- Luong san pham va Build PC khong bi lech do mat type nen.

### Giai doan 2: Dong bo bo loc voi database

Muc tieu: bo loc khong con phu thuoc vao `COMPONENT_FILTER_TYPES` hard-code.

Cong viec:

- Trong `category.service.js`, lay danh sach component type active tu bang `component_types`.
- Tao bucket dua tren danh sach lay tu DB.
- Loai `pc` khoi nhom filter truc tiep.
- Giu mapping `pcConfiguration` sang cac nhom linh kien.
- Dam bao cac san pham linh kien roi van duoc gom vao dung nhom theo `product.componentType`.

Ket qua mong muon:

- Neu admin them loai moi va bat active/build PC allowed, bo loc co the hien nhom moi.
- Neu admin tam khoa mot loai, bo loc khong hien nhom do nua.

### Giai doan 3: Dong bo frontend voi API component types

Muc tieu: frontend khong con phu thuoc qua nhieu vao constant hard-code.

Cong viec:

- Dung API component types de lay label va thu tu hien thi.
- Giu constant frontend chi lam fallback khi API loi.
- Cac label nhu CPU, RAM, VGA nen uu tien lay tu database.
- Build PC page va Category page dung cung mot nguon component type.

Ket qua mong muon:

- Ten loai linh kien trong admin thay doi thi frontend hien thi theo.
- Giam lech giua database va giao dien.

### Giai doan 4: Tang tinh toan ven du lieu

Muc tieu: tranh du lieu san pham tham chieu den component type da bi xoa hoac khong hop le.

Cong viec:

- Truoc khi xoa component type custom, kiem tra co san pham, spec definition, build pc cart dang dung hay khong.
- Neu co du lieu phu thuoc, khong cho xoa vinh vien.
- Can nhac chi cho soft delete khi khong con san pham active.
- Them thong bao ro rang cho admin.

Ket qua mong muon:

- Khong con tinh trang san pham cu dung component type da mat dinh nghia.
- Admin hieu vi sao khong the xoa mot loai dang duoc su dung.

## 6. Thiet ke API goi y

### 6.1. Component types

API hien co co the tiep tuc dung:

```http
GET /api/component-types?status=active&productOnly=true
GET /api/component-types?status=active&buildPcOnly=true
```

Can dam bao response co:

```js
{
  code,
  name,
  isProductType,
  isBuildPcAllowed,
  status,
  isSystem // neu co bo sung
}
```

### 6.2. Component filters

API:

```http
GET /api/categories/component-filters
```

Nen tra ve filter groups dua tren:

- component types active trong database;
- san pham active;
- cau hinh PC nguyen bo;
- spec definition neu dang o trang chi tiet mot component type.

## 7. Pseudo-code cho backend filter moi

```js
async function getFilterTypesFromDatabase() {
  return ComponentType.findAll({
    where: {
      status: 'active',
      isProductType: true,
      isBuildPcAllowed: true,
    },
    order: [['name', 'ASC']],
  });
}

function createComponentBucketMaps(componentTypes) {
  return new Map(componentTypes.map((type) => [type.code, new Map()]));
}

function addPcConfigurationComponents(buckets, product) {
  if (normalizeComponentType(product.componentType) !== 'pc') {
    return;
  }

  const pcConfiguration = product.pcConfiguration || {};

  addComponentValue(buckets, 'cpu', pcConfiguration.cpu, product.id);
  addComponentValue(buckets, 'ram', pcConfiguration.ram, product.id);
  addComponentValue(buckets, 'mainboard', pcConfiguration.motherboard, product.id);
  addComponentValue(buckets, 'vga', pcConfiguration.gpu, product.id);
  addComponentValue(buckets, 'power', pcConfiguration.power, product.id);
  addComponentValue(buckets, 'case', pcConfiguration.computerCase, product.id);
  addComponentValue(buckets, 'cooler', pcConfiguration.cooler, product.id);
}
```

## 8. Rủi ro va luu y

### 8.1. San pham cu co component type da bi xoa

Neu truoc do admin da xoa mot component type, san pham cu van co `componentType` cu. Khi cai tien, can quyet dinh:

- Khoi phuc lai type do.
- Hoac doi component type cua san pham sang loai khac.
- Hoac chan sua san pham cho den khi admin chon lai type hop le.

### 8.2. Label frontend

Neu frontend lay label tu database, can co fallback de tranh loi giao dien khi API chua load xong.

### 8.3. Thu tu hien thi

Neu bo hard-code order, can them `displayOrder` cho `component_types` hoac van giu danh sach order fallback.

Khuyen nghi:

- Ngan han: giu order fallback trong code.
- Dai han: them cot `displayOrder`.

## 9. Ket luan

Huong cai tien hop ly nhat la:

- Khong cho xoa cac component type he thong.
- Lay danh sach nhom filter tu bang `component_types`.
- Van giu mapping rieng tu `pcConfiguration` sang CPU/RAM/VGA... vi day la logic dac thu cua PC nguyen bo.
- Dong bo frontend de uu tien dung du lieu component type tu API.

Cach nay giup he thong thuc te hon: database la nguon quan ly chinh, admin co the mo rong loai linh kien, nhung cac loai cot loi van duoc bao ve de khong lam sai nghiep vu.
