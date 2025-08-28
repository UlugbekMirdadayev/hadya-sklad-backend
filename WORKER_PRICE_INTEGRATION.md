# Worker Price Integration Documentation

## workerPrice maydonining integratsiyasi

### Qo'shilgan funksionallik

`workerPrice` maydoni endi barcha Product API endpoint'larida to'liq qo'llab-quvvatlanadi.

### API Endpoint'lar

#### 1. Mahsulot yaratish
**POST** `/api/products/`

```json
{
  "name": "Mahsulot nomi",
  "ingredients": [...],
  "unit": "kg",
  "salePrice": 15000,
  "workerPrice": 12000,
  "collaboration": [...]
}
```

#### 2. Mahsulotni yangilash
**PUT** `/api/products/:sku`

```json
{
  "name": "Yangi nom",
  "ingredients": [...],
  "unit": "kg", 
  "salePrice": 16000,
  "workerPrice": 13000,
  "collaboration": [...]
}
```

#### 3. Ishchi narxlarini alohida yangilash
**PATCH** `/api/products/:sku/worker-price`

```json
{
  "workerPrice": 14000
}
```

#### 4. Ishchi narxi bo'lgan mahsulotlarni olish
**GET** `/api/products/worker/prices`

Faqat `workerPrice > 0` bo'lgan mahsulotlarni qaytaradi.

### Xususiyatlar

1. **Default qiymat**: Agar `workerPrice` berilmasa, avtomatik 0 ga o'rnatiladi
2. **Validatsiya**: Ishchi narxi manfiy bo'lishi mumkin emas
3. **Ixtiyoriy maydon**: `workerPrice` majburiy emas
4. **Alohida endpoint**: Faqat ishchi narxini yangilash uchun maxsus endpoint

### Misol

```javascript
// Yangi mahsulot yaratish
const newProduct = {
  name: "Osh",
  ingredients: [
    {
      ingredient: "ingredient_id_1",
      quantity: 0.5,
      unit: "kg"
    }
  ],
  unit: "porsiya",
  salePrice: 25000,     // Oddiy sotish narxi
  workerPrice: 20000,   // Ishchilar uchun narx
  collaboration: []
};

// Faqat ishchi narxini yangilash
const updateWorkerPrice = {
  workerPrice: 22000
};
```

### Database Schema

Model `Product.js` da `workerPrice` maydoni:

```javascript
workerPrice: { 
  type: Number, 
  default: 0 
}
```

### Response Format

Barcha API response'larda `workerPrice` maydoni qaytariladi:

```json
{
  "_id": "...",
  "name": "Mahsulot nomi",
  "sku": "MAH-1234",
  "salePrice": 15000,
  "workerPrice": 12000,
  "costPrice": 8000,
  "..."
}
```

## Foydalanish

1. **Mahsulot yaratishda**: `workerPrice` ni body da yuboring
2. **Yangilashda**: Barcha boshqa maydonlar bilan birga yuboring  
3. **Faqat ishchi narxini yangilash**: PATCH endpoint dan foydalaning
4. **Ishchi narxlari ro'yxati**: GET `/worker/prices` dan foydalaning

## Xavfsizlik

- Manfiy qiymatlar qabul qilinmaydi
- Faqat autentifikatsiya qilingan foydalanuvchilar kirish huquqiga ega
- Input validatsiya qo'shilgan
