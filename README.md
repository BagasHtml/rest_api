# 🚛 Waste Management Operational System (DLH API)

Sistem Backend berbasis Next.js API Route yang mengintegrasikan AI dengan logika operasional lapangan untuk Dinas Lingkungan Hidup (DLH). Sistem ini melakukan prediksi volume sampah dan menghitung kebutuhan logistik secara real-time.

## 🚀 Fitur Utama

* **AI-Driven Prediction**: Mengintegrasikan model *Chronos-T5 Tiny* untuk estimasi volume sampah.
* **Dynamic Operational Scaling**: Kalkulasi otomatis jumlah truk, personel, dan *man-hours* berdasarkan beban sampah yang masuk.
* **Hybrid Logic System**:
* **Mode AI**: Digunakan untuk lokasi yang terdaftar dalam dataset (Contoh: Jakarta Pusat).
* **Mode Fallback**: Kalkulasi mandiri berbasis jumlah pengunjung untuk lokasi luar jangkauan (Contoh: JIS, GBK).


* **Spatial Data Ready**: Integrasi koordinat (Lat/Lng) untuk pemetaan armada di dashboard.

## 🛠️ Tech Stack

* **Framework**: Next.js 14 (App Router)
* **Language**: TypeScript
* **AI Integration**: Hugging Face Inference API
* **Deployment**: Vercel / Localhost

## 📊 Parameter Kalkulasi (Standar DLH)

Sistem menggunakan standar operasional berikut:

* **Konversi Berat**: 1 m³ sampah ≈ 0.4 Ton.
* **Kapasitas Armada**: 5 m³ per truk.
* **Personel**: 3 orang per armada (1 Driver, 2 Crew).
* **Shift Kerja**: 8 jam kerja/hari.

## 🔌 API Endpoint

### POST `/api/waste`

Menerima input lokasi dan estimasi pengunjung untuk menghasilkan rencana operasional.

**Contoh Request Body:**

```json
{
  "locationName": "Stadion JIS",
  "visitorEstimate": 80000
}

```

**Contoh Response Output:**

```json
{
    "status": "success",
    "data": {
        "location": "Stadion JIS",
        "metrics": {
            "total_volume": "60.0 m3",
            "total_weight": "24.0 Ton",
            "required_trucks": 12,
            "required_staff": 36,
            "total_man_hours": 288
        },
        "summary": "Analisis Operasional Stadion JIS: Estimasi sampah 24.0 Ton. Mobilisasi 12 unit truk dan 36 personel."
    }
}

```

## 📈 Alur Kerja Sistem

1. **Input**: Menerima nama lokasi dan estimasi massa dari Frontend.
2. **AI Sync**: Menghubungi API AI untuk mendapatkan data historis keramaian.
3. **Logika Dinamis**: Jika lokasi tidak ada di dataset AI, sistem beralih ke kalkulasi berbasis *visitor ratio* agar hasil tetap akurat.
4. **Final Output**: Data dikirim ke Frontend untuk visualisasi peta dan tabel logistik.

# 📋 Dokumentasi REST API Waste Management - Untuk Frontend

Dokumentasi lengkap untuk memudahkan tim frontend dalam mengintegrasikan REST API Waste Management.

---

## 📌 Ringkasan Proyek

Proyek ini adalah REST API berbasis **Next.js** dengan **Prisma ORM** dan **MySQL** database untuk manajemen limbah (waste management). API ini memprediksi volume limbah berdasarkan lokasi dan jumlah pengunjung, serta menyimpan log prediksi ke database.

**Tech Stack:**
- Framework: Next.js 16.2.6
- ORM: Prisma 5.22.0
- Database: MySQL
- Language: TypeScript & JavaScript
- Styling: Tailwind CSS 4

---

## 🚀 Endpoint Utama

### Base URL
```
POST /api/waste
```

**Description:** Endpoint untuk mendapatkan prediksi volume limbah berdasarkan lokasi dan data pengunjung.

---

## 📤 Request Format

### Method: POST

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `locationName` | string | Yes | Nama lokasi/area (contoh: "JIS", "GBK", "Ice BSD", "Jakarta Pusat", "Jakarta Selatan") |
| (custom fields) | any | No | Field tambahan sesuai kebutuhan AI service |

### Request Example
```json
{
  "locationName": "jis",
  "visitor_count": 5000
}
```

---

## 📥 Response Format

### Success Response (200)

```json
{
  "status": "success",
  "message": "Prediction completed successfully",
  "confidence_score": 0.85,
  "generated_at": "2026-05-12T10:30:45.123Z",
  "data": {
    "location": "JIS",
    "is_area_registered": true,
    "coordinates": {
      "lat": -6.1214,
      "lng": 106.8830
    },
    "waste_summary": {
      "total_volume_ton": 12.5,
      "total_food_waste_ton": 8.3,
      "total_plastic_ton": 2.1
    },
    "prediction_results": [
      {
        "lokasi": "JIS",
        "total_volume_ton": 12.5,
        "sisa_makanan_ton": 8.3,
        "plastik_ton": 2.1,
        "rekomendasi_truk": 3,
        "calculated_staff": 9,
        "man_hours": 72,
        "weight_kg": 12500
      }
    ],
    "logistics_plan": {
      // Data dari AI service untuk perencanaan logistik
    },
    "database_log": {
      "id": 1,
      "areaId": 1,
      "prediction_date": "2026-05-12T10:30:45.123Z",
      "volume_ton": 12.5,
      "confidence_score": 0.85,
      "risk_status": "HIGH",
      "created_at": "2026-05-12T10:30:45.123Z"
    }
  }
}
```

### Error Response (500)

```json
{
  "status": "error",
  "message": "Error message describing the issue"
}
```

---

## 🗂️ Data Structure (Prisma Schema)

### 1. **MasterArea**
Menyimpan data area/lokasi yang terdaftar dalam sistem.

```prisma
model MasterArea {
  id          Int             @id @default(autoincrement())
  name        String          @unique
  latitude    Float
  longitude   Float
  predictions PredictionLog[]
  permits     CrowdPermit[]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | ID unik area |
| `name` | String | Nama area (unik, contoh: "JIS", "GBK") |
| `latitude` | Float | Koordinat latitude lokasi |
| `longitude` | Float | Koordinat longitude lokasi |
| `predictions` | Relation | Relasi ke PredictionLog |
| `permits` | Relation | Relasi ke CrowdPermit |

**Contoh Data:**
```
id=1, name="JIS", latitude=-6.1214, longitude=106.8830
id=2, name="GBK", latitude=-6.2185, longitude=106.8018
```

---

### 2. **PredictionLog**
Menyimpan log setiap prediksi limbah yang dibuat.

```prisma
model PredictionLog {
  id               Int        @id @default(autoincrement())
  areaId           Int
  area             MasterArea @relation(fields: [areaId], references: [id])
  prediction_date  DateTime
  volume_ton       Float
  confidence_score Float
  risk_status      String
  created_at       DateTime   @default(now())
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | ID unik log prediksi |
| `areaId` | Int | ID area dari MasterArea |
| `area` | Relation | Relasi ke MasterArea |
| `prediction_date` | DateTime | Tanggal prediksi dibuat |
| `volume_ton` | Float | Total volume limbah dalam ton |
| `confidence_score` | Float | Skor akurasi prediksi (0-1) |
| `risk_status` | String | Status risiko: "LOW", "MEDIUM", "HIGH" |
| `created_at` | DateTime | Timestamp data dibuat |

**Risk Status Rules:**
- `HIGH`: volume_ton > 10
- `MEDIUM`: volume_ton > 5 dan ≤ 10
- `LOW`: volume_ton ≤ 5

---

### 3. **TpaFacility**
Menyimpan data fasilitas TPA (Tempat Pembuangan Akhir).

```prisma
model TpaFacility {
  id               Int    @id @default(autoincrement())
  name             String
  max_capacity_ton Float
  current_load_ton Float
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | ID unik fasilitas |
| `name` | String | Nama TPA |
| `max_capacity_ton` | Float | Kapasitas maksimal (ton) |
| `current_load_ton` | Float | Muatan saat ini (ton) |

---

### 4. **CrowdPermit**
Menyimpan data izin keramaian/event besar.

```prisma
model CrowdPermit {
  id              Int        @id @default(autoincrement())
  areaId          Int
  area            MasterArea @relation(fields: [areaId], references: [id])
  event_name      String
  event_date      DateTime
  estimated_crowd Int
  status          String     @default("PENDING")
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | ID unik izin |
| `areaId` | Int | ID area dari MasterArea |
| `area` | Relation | Relasi ke MasterArea |
| `event_name` | String | Nama event/keramaian |
| `event_date` | DateTime | Tanggal event |
| `estimated_crowd` | Int | Estimasi jumlah pengunjung |
| `status` | String | Status: "PENDING", "APPROVED", "REJECTED" |

---

### 5. **FleetInventory**
Menyimpan data inventaris armada truk/kendaraan.

```prisma
model FleetInventory {
  id                     Int    @id @default(autoincrement())
  truck_type             String
  total_units            Int
  ready_units            Int
  capacity_per_truck_ton Float
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | ID unik armada |
| `truck_type` | String | Jenis truk (contoh: "10T", "5T") |
| `total_units` | Int | Total unit tersedia |
| `ready_units` | Int | Unit yang siap operasional |
| `capacity_per_truck_ton` | Float | Kapasitas per truk (ton) |

---

### 6. **OperationalParam**
Menyimpan parameter operasional sistem.

```prisma
model OperationalParam {
  param_key   String @id
  param_value Float
}
```

| Field | Type | Description |
|-------|------|-------------|
| `param_key` | String | Kunci parameter (ID unik) |
| `param_value` | Float | Nilai parameter |

---

## 🔌 Integrasi Library (`app/lib/waste-api.tsx`)

### WastePredictionService

Library client-side untuk berkomunikasi dengan AI Prediction Service dan REST API.

```typescript
import { wasteService } from '@/app/lib/waste-api';

// Menggunakan service
const result = await wasteService.predict({
  locationName: "jis",
  visitor_count: 5000
});
```

### API Signature

```typescript
async predict(payload: Record<string, any>): Promise<any>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `payload` | Record<string, any> | Objek yang berisi parameter prediksi |

### Return Value
Mengembalikan JSON response dari `/api/waste` endpoint.

### Error Handling

Jika request gagal, service akan melempar error dengan pesan:
```
AI API Error: {status_code} - {error_details}
```

### Contoh Penggunaan di Frontend

```typescript
// pages/prediction.tsx atau component
import { wasteService } from '@/app/lib/waste-api';
import { useState } from 'react';

export default function PredictionPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePredict = async (location: string, visitors: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await wasteService.predict({
        locationName: location,
        visitor_count: visitors
      });
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handlePredict('jis', 5000)}>
        Predict
      </button>
      
      {loading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      {result && (
        <div>
          <h3>Hasil Prediksi</h3>
          <p>Total Limbah: {result.data.waste_summary.total_volume_ton} ton</p>
          <p>Status Risiko: {result.data.database_log?.risk_status}</p>
          <p>Skor Kepercayaan: {result.confidence_score}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Use Case: Flow Lengkap

### Scenario: Prediksi Limbah untuk Event Besar di JIS

1. **Frontend mengirim request:**
   ```bash
   POST /api/waste
   Content-Type: application/json
   
   {
     "locationName": "jis",
     "visitor_count": 5000
   }
   ```

2. **Backend flow (`/api/waste/route.ts`):**
   - Menerima request dari frontend
   - Mengirim ke AI Prediction Service via `wasteService.predict()`
   - Mendapat response dengan prediksi volume limbah per kategori
   - Mencari area di database berdasarkan nama lokasi
   - Menghitung total limbah (food waste + plastic + lainnya)
   - Menyimpan log ke `PredictionLog` di database
   - Menambahkan kalkulasi (staff needed, man-hours, weight)
   - Mengembalikan response lengkap ke frontend

3. **Frontend menerima response:**
   ```json
   {
     "status": "success",
     "data": {
       "location": "JIS",
       "is_area_registered": true,
       "waste_summary": {
         "total_volume_ton": 12.5,
         "total_food_waste_ton": 8.3,
         "total_plastic_ton": 2.1
       },
       "prediction_results": [
         {
           "lokasi": "JIS",
           "total_volume_ton": 12.5,
           "calculated_staff": 9,
           "man_hours": 72
         }
       ]
     }
   }
   ```

4. **Frontend menampilkan:**
   - Peta lokasi dengan koordinat
   - Ringkasan limbah
   - Estimasi staff dan jam kerja
   - Rekomendasi truk
   - Status risiko

---

## 🗺️ Location Mapping

Berikut mapping lokasi dengan koordinat (hardcoded di `route.ts`):

| Lokasi | Latitude | Longitude |
|--------|----------|-----------|
| JIS | -6.1214 | 106.8830 |
| GBK | -6.2185 | 106.8018 |
| Ice BSD | -6.3006 | 106.6523 |
| Jakarta Pusat | -6.1753 | 106.8271 |
| Jakarta Selatan | -6.2615 | 106.8106 |

Default (jika lokasi tidak ditemukan): `-6.2088, 106.8456`

---

## 💡 Best Practices untuk Frontend

### 1. Caching
```typescript
// Jangan gunakan cache untuk request prediksi (API sudah set: "no-store")
// Tapi Anda bisa cache di frontend dengan kondisi tertentu
```

### 2. Error Handling
```typescript
try {
  const result = await wasteService.predict(payload);
  // Handle success
} catch (error) {
  // Status code 5xx = Server error
  // Tampilkan user-friendly message
}
```

### 3. Loading State
```typescript
// Selalu tampilkan loading indicator saat request sedang berlangsung
// Endpoint ini bergantung pada AI service (bisa slow)
```

### 4. Data Validation
```typescript
// Pastikan locationName tidak null/undefined
// Validate visitor_count adalah angka positif
if (!locationName || visitor_count <= 0) {
  throw new Error('Invalid input');
}
```

### 5. Response Parsing
```typescript
// Response structure dijamin consistent, tapi tetap validate
if (response.data?.waste_summary) {
  const { total_volume_ton, total_food_waste_ton } = response.data.waste_summary;
  // Use data
}
```

---

## 🔑 Environment Variables

Untuk menjalankan aplikasi, Anda perlu konfigurasi:

```bash
# .env.local
DATABASE_URL="mysql://user:password@localhost:3306/waste_db"
API_URL="https://your-ai-service.com/predict"
```

---

## 📊 Database Diagram (Simplified)

```
MasterArea
  ├─→ PredictionLog (one-to-many)
  └─→ CrowdPermit (one-to-many)

TpaFacility (standalone)
FleetInventory (standalone)
OperationalParam (standalone)
```

---

## 🧪 Testing Request dengan Curl

```bash
curl -X POST http://localhost:3000/api/waste \
  -H "Content-Type: application/json" \
  -d '{
    "locationName": "jis",
    "visitor_count": 5000
  }'
```

---

## 📞 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 Error "AI API Error" | AI Service tidak responsive | Cek connection ke AI service, verifikasi API_URL |
| "Area not found" response | Lokasi tidak terdaftar di database | Gunakan lokasi yang terdaftar (JIS, GBK, dll) |
| `confidence_score` = 0 | AI service tidak return skor | Validate response dari AI service |
| Database log tidak tersimpan | Area ID tidak valid | Pastikan area sudah di-setup di MasterArea |

---

## 📝 Notes untuk Developer

1. **Coordinates Hardcoded**: Jika perlu update koordinat, edit `COORDINATES_MAP` di `route.ts`
2. **Risk Status Calculation**: Otomatis berdasarkan volume_ton (bisa di-customize)
3. **Staff Calculation**: Formula `truckCount * 3` per truk (bisa di-adjust sesuai SOP)
4. **Database Logging**: Hanya log jika area registered, jika tidak hanya return data saja
5. **Prisma Client**: Sudah di-setup, use `prisma` instance yang sudah di-import

---

## 📚 Additional Resources

- Dokumentasi Prisma: https://www.prisma.io/docs/
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- TypeScript: https://www.typescriptlang.org/docs/

---

**Last Updated:** 2026-05-12  
**Version:** 1.0.0  
**Maintained By:** Backend Team
