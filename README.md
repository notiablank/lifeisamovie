# Life Is a Movie

A cinematic life-journaling app.

## Monorepo Structure

```
apps/
  ios/    — SwiftUI iOS app (Xcode project, iOS 17+, Swift 6)
  api/    — Fastify backend (Node.js + TypeScript)
```

## Getting Started

### iOS App

Open `apps/ios/LifeIsAMovie.xcodeproj` in Xcode 16+ and run on a simulator or device.

The project follows an MVVM architecture:

```
LifeIsAMovie/
  Views/          — SwiftUI views
  ViewModels/     — View models
  Models/         — Data models
  Services/       — Network and data services
  Assets.xcassets — Asset catalog
```

### API

```bash
cd apps/api
cp .env.example .env
npm install
npm run dev
```

## CI

GitHub Actions workflows live in `.github/workflows/`:

- **ios.yml** — Builds and tests the iOS app on push/PR changes to `apps/ios/`
- **backend-ci.yml** — Lints and tests the API on push/PR changes to `apps/api/`
