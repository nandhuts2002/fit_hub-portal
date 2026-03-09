# FitHub Mobile (React Native)

## Setup

```bash
cd mobile
npm install
```

## Configure API

Create `mobile/.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=https://fit-hub-portal-qpn6.vercel.app
```

## Run

```bash
npm run android
# or
npm run start
```

## Implemented (connected to your backend)

- **Login**: `POST /login`
- **Register + OTP verify**: `POST /signup-init` → `POST /signup-verify` (+ resend `POST /signup-resend`)
- **Forgot / reset password**: `POST /forgot-password` → `POST /reset-password`
- **Shop**: `GET /shop/api/products`, wishlist + orders
- **Live sessions**: `GET /live/sessions`, `POST /live/sessions/:id/request`
- **Progress**: `GET /exercise-progress`, `GET /yoga-progress`

