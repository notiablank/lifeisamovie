# Life is a Movie

A movie tracking and sharing app.

## Monorepo Structure

| Path | Description |
|------|-------------|
| `apps/ios/` | SwiftUI iOS app |
| `apps/api/` | Backend API (coming soon) |
| `.github/workflows/` | CI/CD pipelines |

## Getting Started

### iOS App

```bash
cd apps/ios
brew install xcodegen
xcodegen generate
open LifeIsAMovie.xcodeproj
```

Requires Xcode 16+ and targets iOS 17+.

## Linting

SwiftLint config lives at the repo root (`.swiftlint.yml`).
