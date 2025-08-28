# Credit Management API Documentation

## Qarz boshqaruvi uchun yangi API endpoint'lar

### 1. Qarzni to'lash
**POST** `/api/transactions/credit/payment/:id`

**Parametrlar:**
- `id` - Asl qarz tranzaksiyasining ID'si (URL parametr)

**Body:**
```json
{
  "paymentAmount": 50000,
  "paymentType": "cash", // "cash" yoki "card"
  "description": "Qarz to'lovi" // ixtiyoriy
}
```

**Response:**
```json
{
  "message": "Qarz qisman to'landi", // yoki "Qarz to'liq to'landi"
  "paymentTransaction": {...}, // Yangi yaratilgan chiqim tranzaksiyasi
  "updatedCreditTransaction": {...}, // Yangilangan qarz tranzaksiyasi
  "remainingDebt": 25000, // Qoldiq qarz miqdori
  "isFullyPaid": false // To'liq to'langanmi?
}
```

### 2. Barcha qarzlarni ko'rish
**GET** `/api/transactions/credits`

**Query parametrlar:**
- `page` - Sahifa raqami (default: 1)
- `limit` - Sahifadagi elementlar soni (default: 20)
- `status` - "active" (faol qarzlar) yoki "paid" (to'langan qarzlar)

**Response:**
```json
{
  "currentPage": 1,
  "totalPages": 3,
  "totalItems": 45,
  "totalActiveDebt": 150000, // Umumiy faol qarz miqdori
  "credits": [...] // Qarz tranzaksiyalari ro'yxati
}
```

### 3. Muayyan qarz bo'yicha to'lov tarixini ko'rish
**GET** `/api/transactions/credit/:id/payments`

**Parametrlar:**
- `id` - Qarz tranzaksiyasining ID'si

**Response:**
```json
{
  "creditTransaction": {...}, // Asl qarz tranzaksiyasi
  "payments": [...], // Ushbu qarz uchun qilingan barcha to'lovlar
  "paymentCount": 3 // To'lovlar soni
}
```

## Qarz to'lash jarayoni

1. **Qarz yaratilganda:**
   - `type: "cash-in"` va `paymentType: "credit"` bilan tranzaksiya yaratiladi
   - Bu tranzaksiya kirimga hisoblanadi, lekin aslida pul kirmagan
   - Tranzaksiya chiqimlarga qo'shilmaydi

2. **Qarz to'langanda:**
   - Yangi `type: "cash-out"` tranzaksiya yaratiladi (haqiqiy chiqim)
   - Asl qarz tranzaksiyasining miqdori yangilanadi
   - Agar to'liq to'langan bo'lsa - amount = 0, lekin yozuv saqlanadi
   - Agar qisman to'langan bo'lsa - qoldiq miqdor yangilanadi

3. **Advantages:**
   - Qarz yaratilgan vaqtda chiqimga hisoblanmaydi
   - To'langan vaqtdagina haqiqiy chiqim hisoblanadi
   - Barcha to'lov tarixi saqlanadi
   - Qarz holati aniq kuzatiladi

## Misol

1. **Qarz yaratish:**
```json
POST /api/transactions/cash-in
{
  "amount": 100000,
  "paymentType": "credit",
  "description": "Xodimga berilgan qarz"
}
```

2. **Qarz to'lash (50000 so'm):**
```json
POST /api/transactions/credit/payment/673a1b2c3d4e5f6789012345
{
  "paymentAmount": 50000,
  "paymentType": "cash"
}
```

Natija:
- Yangi chiqim tranzaksiyasi: 50000 so'm
- Qarz miqdori yangilandi: 50000 so'm (qoldiq)
- Qarz holati: "qisman to'langan"

3. **Qolgan qarzni to'lash (50000 so'm):**
```json
POST /api/transactions/credit/payment/673a1b2c3d4e5f6789012345
{
  "paymentAmount": 50000,
  "paymentType": "cash"
}
```

Natija:
- Yangi chiqim tranzaksiyasi: 50000 so'm
- Qarz miqdori: 0 so'm
- Qarz holati: "to'liq to'langan"
