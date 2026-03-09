# Progressive Workout (PWO) - Project Overview

## Project at a Glance

**Progressive Workout** is a full-featured mobile application for tracking personalized fitness workouts with real-time progress monitoring, and advanced statistics. It combines flexible workout program management with comprehensive data analytics to help users track their fitness journey across multiple devices.

### Quick Facts

| Property             | Value                                         |
| -------------------- | --------------------------------------------- |
| **Project Type**     | Mobile Application (React Native/Expo)        |
| **Platforms**        | iOS, Android, Web                             |
| **Language**         | TypeScript 5.9.2                              |
| **Framework**        | React 19.2.0 + Expo ~55.0.0                   |
| **State Management** | React Context API + Firebase                  |
| **Backend**          | Firebase (Authentication + Realtime Database) |
| **API Integration**  | REST API with Firebase auth tokens            |
| **Version**          | 1.1.0 (Post-refactor)                         |
| **Repository Type**  | Monolith                                      |
| **Status**           | ⚠️ Major architectural refactor (v1.0 → v1.1) |

---

## Core Features (Updated)

### 📱 Workout Execution

- **Real-time Timer**: Track warmups, work intervals, and rest periods
- **Free Navigation**: Jump between any step during workout execution
- **Session Persistence**: Pause and resume workouts across app sessions
- **Detailed Tracking**: Sets, reps, weight, duration recording (simplified from events)

### 💪 Workout Programs

- **Custom Programs**: Build personalized workout programs with exercises and blocks
- **Predefined Programs**: Access built-in workout programs
- **QR Code Sharing**: Share programs via QR codes for quick import (NEW)
- **Program Import/Export**: JSON export/import for data portability
- **API-Driven**: Programs synced via backend API

### 🏋️ Exercise Library

- **Exercise Management**: Create, edit, and manage exercise database
- **Categories**: Organize by strength, cardio, flexibility, skill
- **Icons & Media**: Visual identification with Ionicons
- **Three Sources**: Built-in (read-only), user-created, professional trainer
- **API-Synced**: All exercises stored on backend

### 📊 Progress Tracking & Analytics

- **Personal Records (PRs)**: Track max weight, max reps, volume, estimated 1RM
- **Weekly Statistics**: Aggregate stats by week
- **Consistency Heatmap**: Visualize workout consistency over time
- **Streak Tracking**: Track consecutive workout days
- **Program Progress**: Lifetime stats per program
- **Exercise Trends**: Progression data for specific exercises

### 👤 User Management (NEW)

- **Firebase Auth**: Email/password authentication
- **Guest Access**: Try app without account
- **Account Linking**: Convert guest to registered user
- **Multi-Device Sync**: Progress synced across devices via API
- **Profile Management**: User settings and preferences

### 🗑️ Removed Features

- ❌ **Challenges** - Completely removed (use Programs instead)
- ❌ **Event System** - Replaced with direct API calls

---

## Technology Stack

### Core Dependencies

#### Frontend Framework

- **React**: 19.2.0 - UI library
- **React Native**: 0.81.5 - Native mobile framework
- **Expo**: ~55.0.0 - Development platform

#### Routing & Navigation

- **Expo Router**: ~6.0.17 - File-based routing
- **React Navigation**: 7.1.8 - Navigation library
- **React Navigation Bottom Tabs**: 7.4.0 - Tab navigation

#### Backend & Data

- **Firebase**: 12.10.0 - Authentication + Realtime Database + Analytics
- **React Context API**: Built-in state management
- **Custom REST Client**: `lib/api.ts` for API integration

#### UI Components & Styling

- **Victory Native**: 41.20.2 - Charts and data visualization
- **Expo Vector Icons**: 15.0.3 - Icon library (Ionicons)
- **Expo Linear Gradient**: ~15.0.8 - Gradient backgrounds
- **React Native SVG**: 15.12.1 - SVG rendering
- **React Native Reanimated**: ~4.1.1 - Advanced animations
- **React Native Confetti Cannon**: 1.5.2 - Celebration animation

#### Platform Features

- **Expo Camera**: ~17.0.10 - QR code scanning (NEW)
- **Expo Haptics**: ~15.0.8 - Haptic feedback (mobile)
- **Expo Audio**: ~1.1.0 - Sound effects
- **Expo Image**: ~3.0.11 - Image handling
- **Expo Fonts**: ~14.0.10 - Custom fonts (Google Fonts)

#### Typography

- **Google Fonts**: DM Sans, Inter, Manrope, Plus Jakarta Sans, Sora

### Development Tools

| Tool           | Version    | Purpose                |
| -------------- | ---------- | ---------------------- |
| **TypeScript** | ~5.9.2     | Type safety            |
| **ESLint**     | 9.25.0     | Code linting           |
| **Prettier**   | Via plugin | Code formatting        |
| **Vitest**     | 2.1.0      | Unit testing           |
| **Fast-check** | 4.5.3      | Property-based testing |

---

## Architecture Overview (Updated)

### High-Level Architecture (API-Driven)

```
User Interface (Screens)
        ↓
Components (76 UI components + Auth)
        ↓
Hooks (30 custom React hooks)
        ↓
Context API (Auth + Data state with API integration)
        ↓
API Integration Layer (Firebase auth tokens)
        ↓
Backend API (Firebase REST endpoints)
        ↓
Local Storage (Offline fallback)
```

### Directory Structure

- **`app/`** - Expo Router file-based screens (21 screens + auth flows)
- **`components/`** - 76 reusable UI components organized by feature
- **`hooks/`** - 30 custom hooks (data fetching, session management, auth)
- **`context/`** - Global state (Auth, Data management)
- **`lib/`** - Utilities, API client, validation, mappers, audit logging
- **`types/`** - TypeScript type definitions
- **`theme/`** - Design tokens and styling
- **`__tests__/`** - 25+ test files (unit, component, integration)

---

## Key Characteristics

### Architecture Pattern (NEW: API-Driven)

- **Firebase-backed API** as primary data source
- **React Context API** for global state management
- **Custom API hooks** with automatic caching and retry logic
- **Version counters** for loose coupling and cache invalidation
- **Graceful offline fallback** to local storage

### Authentication (NEW: Required)

- **Firebase Authentication** (email/password)
- **Guest access** via anonymous auth
- **Account linking** to upgrade guest → registered
- **Automatic token refresh** for API calls
- **Session persistence** across app restarts

### Data Persistence (CHANGED: API-first)

- **Primary: Backend API** (Firebase REST)
- **Secondary: Local storage** (offline fallback)
- **Automatic sync** when connection restored
- **Multi-device sync** for authenticated users

### Offline-First Design (UPDATED)

- All features work without internet connection
- Local cache updates immediately
- API sync happens in background
- Visual indicator when using stale data
- Automatic retry when connection restored

### Type Safety

- **TypeScript strict mode** enabled
- **Comprehensive type definitions** for all data models
- **Path aliases** (`@/`) for clean imports
- **Validation system** with error codes

### Performance Optimizations

- **Code splitting**: Expo Router automatic per-screen
- **Lazy loading**: Data loaded on demand via API
- **Caching**: Firebase tokens, API responses, async data
- **Platform-specific rendering**: iOS SafeAreaView, etc.
- **Memoization**: Expensive computations cached

### Data Validation (NEW)

- **Enhanced validation** with error codes and detailed messages
- **Dependency checking** to prevent orphaned data
- **Audit logging** for all modifications
- **Permission system** enforced at API level

---

## Major Version Changes (v1.0 → v1.1)

### Breaking Changes ⚠️

| Aspect               | v1.0                 | v1.1                            |
| -------------------- | -------------------- | ------------------------------- |
| **Architecture**     | Local storage first  | ✅ API-driven                   |
| **Authentication**   | Optional             | ✅ Required (Firebase)          |
| **Challenge System** | Supported            | ❌ Removed                      |
| **Progress Model**   | SessionProgress      | ✅ WorkoutProgress (simplified) |
| **Event System**     | Pub-sub EventEmitter | ❌ Removed (API-driven)         |
| **Components**       | 54                   | ✅ 76 (+22 new)                 |
| **Hooks**            | 25                   | ✅ 30 (+5 new)                  |
| **Auth Screens**     | None                 | ✅ Sign-in, Sign-up             |
| **QR Features**      | None                 | ✅ Scanner + Generator          |

### New Features ✅

- **API Integration**: Firebase REST API with token management
- **Authentication Screens**: Sign-in, Sign-up, Guest access
- **Multi-Device Sync**: Progress synced via backend
- **QR Code Sharing**: Share programs via QR codes
- **Enhanced Data Management**: Forms, filters, search
- **Validation System**: Detailed error messages and codes
- **Audit Logging**: Track all modifications
- **Dependency Checking**: Prevent orphaned data

### Removed Features ❌

- **Challenge System**: All challenge-related code and UX
- **Event System**: Pub-sub event emitter (replaced with API calls)
- **Challenge Components**: 17 components deleted

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended 20 LTS)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For mobile: XCode (iOS) or Android Studio (Android)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with Firebase config
cp .env.example .env
# Edit .env and add:
# EXPO_PUBLIC_FIREBASE_API_KEY=your-key
# EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
# EXPO_PUBLIC_API_BASE_URL=https://api.example.com  (for API)
# EXPO_PUBLIC_API_ENABLED=true
# (other Firebase config...)

# 3. Start development
npm start
```

### Development Commands

| Command                 | Purpose                       |
| ----------------------- | ----------------------------- |
| `npm start`             | Start Expo development server |
| `npm run ios`           | Run on iOS simulator          |
| `npm run android`       | Run on Android emulator       |
| `npm run web`           | Run in web browser            |
| `npm run compile`       | Check TypeScript compilation  |
| `npm run lint`          | Check code style              |
| `npm run lint:fix`      | Auto-fix code style issues    |
| `npm test`              | Run tests (watch mode)        |
| `npm run test:run`      | Run tests once (CI mode)      |
| `npm run test:coverage` | Generate coverage report      |

---

## Key Documentation Files

- **[Architecture](./architecture.md)** - Detailed technical architecture and patterns (API-driven)
- **[Data Models](./data-models.md)** - Complete database schema and entity relationships
- **[Source Tree Analysis](./source-tree-analysis.md)** - Annotated directory structure
- **[Development Guide](./development-guide.md)** - Setup, API patterns, and development instructions
- **[API Contracts](./api-contracts.md)** - Backend API endpoints and contracts (NEW)
- **[Breaking Changes Guide](./breaking-changes.md)** - Migration path from v1.0 → v1.1 (NEW)

---

## Migration Guide (v1.0 → v1.1)

⚠️ **This is a breaking version** due to architectural changes.

### Key Migration Points

1. **Setup Firebase Auth**
   - Configure Firebase project in console
   - Create authentication users
   - Update .env with credentials

2. **Data Model Changes**
   - `SessionProgress` → `WorkoutProgress`
   - `sessionId` → `workoutId` references
   - Flatten nested progress structures

3. **Removed Features**
   - Remove challenge-related UI
   - Migrate challenge programs to regular programs
   - Update any custom code using event system

4. **New API Integration**
   - All data reads now go through API
   - API client handles authentication
   - Local storage becomes fallback only

See **[Breaking Changes Guide](./breaking-changes.md)** for detailed migration steps.

---

## Project Statistics

| Metric                  | Value    | Change      |
| ----------------------- | -------- | ----------- |
| **Total Components**    | 76       | +22         |
| **Total Hooks**         | 30       | +5          |
| **Total Screens**       | 21       | -           |
| **Auth Screens**        | 3        | +3 (NEW)    |
| **Total Tests**         | 25+      | -           |
| **Lines of TypeScript** | ~15,000+ | +2,000+     |
| **Type Coverage**       | 100%     | Strict mode |
| **React Version**       | 19.2.0   | +0.1.0      |
| **Expo Version**        | ~55.0.0  | +1.0.0      |
| **Firebase Version**    | 12.10.0  | +2.10.0     |

---

## Next Steps

1. **Setup** - Follow [Development Guide](./development-guide.md)
2. **Understand Architecture** - Review [Architecture](./architecture.md)
3. **Review Data Models** - Check [Data Models](./data-models.md)
4. **Explore Components** - Read [Source Tree Analysis](./source-tree-analysis.md)
5. **Migrate Data** (if upgrading) - See [Breaking Changes Guide](./breaking-changes.md)
6. **Test Environment** - Run `npm run test:run`

---

## Support & Questions

For detailed technical information:

- **Architecture questions** → See [Architecture](./architecture.md)
- **Data model questions** → See [Data Models](./data-models.md)
- **API integration** → See [API Contracts](./api-contracts.md)
- **Development setup** → See [Development Guide](./development-guide.md)
- **Migration help** → See [Breaking Changes Guide](./breaking-changes.md)

---

_For API-driven architecture details, refer to the generated architecture and data models documentation._
_Version 1.1.0 - Refactored to API-driven with Firebase backend integration._
