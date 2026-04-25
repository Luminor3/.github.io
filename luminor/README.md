# LUMINOR 3D Printing — Web Platformu

Luminor 3D Printing için tam özellikli, profesyonel e-ticaret platformu.

## 🚀 GitHub Pages'e Yükleme

1. Bu klasörün tüm içeriğini GitHub repository'nize yükleyin
2. Repository Settings → Pages → Branch: `main`, Folder: `/ (root)` seçin
3. Birkaç dakika sonra siteniz `https://kullaniciadi.github.io/repo-adi` adresinde yayında olacak

## 📁 Dosya Yapısı

```
luminor/
├── index.html          → Ana Sayfa
├── products.html       → Ürün Kataloğu
├── custom-order.html   → Özel Sipariş Formu
├── cart.html           → Sepet & Ödeme
├── account.html        → Hesap / Giriş / Kayıt
├── about.html          → Hakkında
├── contact.html        → İletişim & SSS
└── assets/
    ├── css/
    │   ├── main.css          → Design system, navbar, footer
    │   ├── home.css          → Ana sayfa stilleri
    │   ├── products.css      → Ürünler sayfası
    │   ├── account.css       → Hesap sayfası
    │   ├── cart.css          → Sepet sayfası
    │   └── custom-order.css  → Özel sipariş
    └── js/
        ├── app.js            → Auth, Cart, Orders sistemi
        ├── home.js           → Ana sayfa JS
        ├── products.js       → Ürün listesi & filtreleme
        ├── account.js        → Hesap yönetimi
        ├── cart.js           → Sepet & ödeme akışı
        └── custom-order.js   → Özel sipariş formu
```

## ✨ Özellikler

- **Kullanıcı Sistemi**: Email/telefon + şifre ile kayıt & giriş
- **Güvenli Şifre**: WebCrypto API ile SHA-256 hashing
- **Sepet**: Oturum tabanlı, giriş yapan kullanıcıya kalıcı
- **Sipariş Akışı**: Adres → Ödeme → Onay 3 adımlı checkout
- **Özel Sipariş**: Detaylı form, dosya yükleme desteği
- **Hesabım**: Bilgiler, adresler, siparişler, güvenlik sekmeleri
- **Ürün Filtreleme**: Kategori, malzeme, fiyat, arama
- **İndirim Kodları**: `LUMINOR10` (%10) ve `ILKSIPARIS` (%15)
- **Mobil Uyumlu**: Tüm sayfalarda tam responsive tasarım

## 🔒 Güvenlik Notları

Bu demo sürümünde veriler `localStorage` ve `sessionStorage`'da tutulmaktadır.  
**Production** için backend API + gerçek ödeme entegrasyonu (iyzico, Stripe vb.) eklenmelidir.

## 🎨 Tasarım

- Koyu tema (dark mode) tasarım
- Renk paleti: Yeşil (#6ECFB5 / #2D9B7F) + Koyu arka plan
- Yazı tipleri: Syne (başlıklar) + DM Sans (gövde)
- CSS variables ile tam design system

## 📱 Sosyal Medya

- Instagram: [@luminor3dbaski](https://instagram.com/luminor3dbaski)  
- TikTok: [@luminor3dbaski](https://tiktok.com/@luminor3dbaski)
