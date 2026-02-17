# Life Is a Movie

A cinematic life-journaling app.

## Monorepo Structure

```
apps/
  ios/    — SwiftUI iOS app (Xcode project, iOS 17+)
  api/    — Fastify backend (coming soon)
```

## Getting Started

### iOS App

Open `apps/ios/LifeIsAMovie.xcodeproj` in Xcode 15+ and run on a simulator or device.

## CI

GitHub Actions workflows live in `.github/workflows/`:

- **ios.yml** — Builds the iOS app on push/PR changes to `apps/ios/`
