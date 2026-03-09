# FitHub Flutter App — Setup & Run Guide

## Prerequisites

Make sure you have **Flutter SDK** installed. If not:
1. Download from [flutter.dev/get-started](https://docs.flutter.dev/get-started/install/windows)
2. Add Flutter to your PATH (e.g. `C:\flutter\bin`)
3. Run `flutter doctor` to verify the setup

---

## Setup (one-time)

```powershell
# Navigate to the fithub_app folder
cd c:\Users\nandhu\Fit-hub-portal\fithub_app

# Install all dependencies
flutter pub get
```

---

## Run the App

### On a connected Android device or emulator:
```powershell
flutter run
```

### On Chrome (web dev mode):
```powershell
flutter run -d chrome
```

### Build Android APK:
```powershell
flutter build apk --release
# APK will be at: build/app/outputs/flutter-apk/app-release.apk
```

---

## App Structure

```
lib/
├── main.dart                  ← App entry point
├── theme/app_theme.dart       ← Dark theme with FitHub green
├── config/api_config.dart     ← Backend endpoints (fit-hub-portal-qpn6.vercel.app)
├── services/
│   ├── api_service.dart       ← HTTP client with JWT
│   └── storage_service.dart   ← Token persistence
├── providers/
│   └── auth_provider.dart     ← Login state management
└── screens/
    ├── splash_screen.dart     ← Auto-login check
    ├── auth/                  ← Login, Register, OTP
    ├── home/                  ← Dashboard
    ├── exercises/             ← Exercise browser
    ├── shop/                  ← Products + cart
    ├── community/             ← Posts feed
    ├── location/              ← Gym finder
    └── profile/               ← User profile + logout
```

---

## Backend Connection

The app connects to: **https://fit-hub-portal-qpn6.vercel.app**

All endpoints used are documented in `lib/config/api_config.dart`.

---

## Key Features

| Feature | Details |
|---|---|
| 🔐 Auth | Login + Register with OTP email verification |
| 💪 Exercises | Browse + search with muscle/equipment filters + GIF preview |
| 🛒 Shop | Product grid with categories, search, add to cart |
| 👥 Community | Posts feed with avatar + images + like/comment counts |
| 📍 Gym Finder | Nearby gym list via backend location API |
| 👤 Profile | View/edit name & bio, follower stats, logout |
