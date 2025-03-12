# Alur Kerja Sistem WhatsApp AI Chatbot

## 1. Inisialisasi Sistem
- Sistem dimulai dari `index.js`
- Menginisialisasi WhatsApp client dengan konfigurasi keamanan
- Memuat semua layanan AI (Dialogflow, ChatGPT, Gemini)
- Mempersiapkan koneksi ke Google Sheets untuk logging

## 2. Proses Autentikasi WhatsApp
1. Sistem menghasilkan QR code
2. User melakukan scan QR code dengan WhatsApp
3. Setelah terautentikasi, sistem siap menerima pesan

## 3. Alur Pemrosesan Pesan
Ketika ada pesan masuk dari pengguna:

```mermaid
graph TD
    A[Pesan Masuk] --> B{Cek Queue}
    B -->|Sudah ada di queue| C[Kirim pesan tunggu]
    B -->|Belum ada di queue| D[Masukkan ke queue]
    D --> E[Proses dengan Dialogflow]
    E --> F{Confidence > 0.7?}
    F -->|Ya| G[Gunakan jawaban Dialogflow]
    F -->|Tidak| H[Coba ChatGPT]
    H --> I{ChatGPT Berhasil?}
    I -->|Ya| J[Gunakan jawaban ChatGPT]
    I -->|Tidak| K[Gunakan Gemini]
    G --> L[Tambahkan tag sumber]
    J --> L
    K --> L
    L --> M[Kirim jawaban]
    M --> N[Log ke Google Sheets]
    N --> O[Hapus dari queue]
```

## 4. Detail Proses Per Layanan

### a. Dialogflow
- Menerima pesan user
- Menganalisis intent (maksud) pesan
- Jika confidence > 0.7, memberikan respons terstruktur
- Response ditandai dengan "_jawaban digenerate oleh sistem_"

### b. ChatGPT
- Digunakan jika Dialogflow tidak yakin dengan intent
- Menggunakan model GPT untuk generasi teks
- Memiliki sistem retry jika terjadi error
- Response ditandai dengan "_jawaban digenerate oleh ChatGPT_"

### c. Gemini
- Berfungsi sebagai fallback jika ChatGPT gagal
- Menggunakan Google's Generative AI
- Memiliki sistem retry sendiri
- Response ditandai dengan "_jawaban digenerate oleh Gemini_"

## 5. Sistem Logging
Setiap percakapan dicatat ke Google Sheets dengan informasi:
- Timestamp
- ID Pengirim
- Pesan User
- Respons Bot
- Sumber Respons (Dialogflow/ChatGPT/Gemini)
- Bahasa yang Digunakan

## 6. Penanganan Error
- Setiap layanan memiliki error handling sendiri
- Error dikategorikan berdasarkan sumbernya
- User mendapat pesan error yang ramah
- Error dilog dengan detail untuk debugging

## 7. Sistem Antrian (Queue)
- Mencegah pemrosesan ganda untuk pengirim yang sama
- Mengirim pesan "mohon tunggu" jika masih dalam proses
- Menggunakan Map untuk tracking status pemrosesan
- Membersihkan queue setelah selesai/error

## 8. Fitur Tambahan
- Indikator mengetik saat memproses
- Retry otomatis untuk API calls
- Fallback bertingkat antar AI
- Logging komprehensif untuk monitoring

## 9. Konfigurasi yang Dibutuhkan (.env)
```
DIALOGFLOW_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path_to_credentials.json
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
GOOGLE_SHEETS_ID=your_sheets_id
DIALOGFLOW_LANGUAGE_CODE=id
