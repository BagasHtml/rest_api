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