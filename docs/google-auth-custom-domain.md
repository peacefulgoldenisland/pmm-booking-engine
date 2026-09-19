# Panduan Setup Custom Domain untuk Google Auth

Dokumen ini berisi langkah-langkah untuk mengubah *domain* `*.firebaseapp.com` bawaan Firebase menjadi *domain* asli aplikasi (`book.peacefulgoldenisland.com`) pada layar *popup* Google Sign-In.

## 1. Mengubah App Name di Google Cloud Console
Untuk memastikan nama yang muncul di *popup* adalah "Peaceful Golden Island" (bukan nama *project ID*).

1. Buka [Google Cloud Console (OAuth Consent Screen)](https://console.cloud.google.com/apis/credentials/consent).
2. Klik tombol **Edit App**.
3. Isi form berikut:
   - **App name:** `Peaceful Golden Island`
   - **User support email:** `peacefulgoldenisland@gmail.com`
   - **App logo:** Abaikan untuk sementara agar tidak memicu kewajiban *Google Verification* yang panjang.
   - **Application home page:** Kosongkan atau isi dengan `https://book.peacefulgoldenisland.com`
   - **Authorized domains:** Tambahkan `peacefulgoldenisland.com`
   - **Developer contact information:** `peacefulgoldenisland@gmail.com`
4. Klik **Save and Continue**.

## 2. Reverse Proxy di Next.js (next.config.ts)
Untuk mengatasi pembatasan Firebase yang mengharuskan *domain* auth di-*hosting* di Firebase Hosting, kita akan membajak *routing* via Vercel / Next.js.

Tambahkan `rewrites` di `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... existing config (images, dll)
  
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://pgi-voyage-app.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
```

## 3. Dynamic Auth Domain di Firebase Client (src/lib/firebase.ts)
Ubah `authDomain` di `firebaseConfig` agar otomatis menggunakan `localhost` atau `book.peacefulgoldenisland.com` berdasarkan *URL* yang sedang diakses.

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // Otomatis menyesuaikan domain browser alih-alih menggunakan firebaseapp.com
  authDomain: typeof window !== 'undefined' ? window.location.hostname : process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
```

**Catatan Tambahan:**
Saat melakukan perubahan domain ini, pastikan domain tujuan (`book.peacefulgoldenisland.com` dan `localhost`) sudah didaftarkan di **Firebase Console > Authentication > Settings > Authorized domains**.
