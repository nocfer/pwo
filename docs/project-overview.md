# Progressive Workout (PWO) - Project Overview

## Project at a Glance

**Progressive Workout** is a full-featured mobile application for tracking personalized fitness workouts with real-time progress monitoring, challenges, and advanced statistics. It combines flexible workout program management with comprehensive data analytics to help users track their fitness journey.

### Quick Facts

| Property | Value |
|----------|-------|
| **Project Type** | Mobile Application (React Native/Expo) |
| **Platforms** | iOS, Android, Web |
| **Language** | TypeScript 5.9.2 |
| **Framework** | React 19.1.0 + Expo 54.0.27 |
| **State Management** | React Context API |
| **Backend** | Firebase (Authentication + Realtime Database) |
| **Version** | 1.0.0 |
| **Repository Type** | Monolith |

---

## Core Features

### 📱 Workout Execution
- **Real-time Timer**: Track warmups, work intervals, and rest periods
- **Free Navigation**: Jump between any step during workout execution
- **Session Persistence**: Pause and resume workouts across app sessions
- **Event Logging**: Detailed tracking of workout events (sets completed, rest intervals, etc.)

### 💪 Workout Programs
- **Custom Programs**: Build personalized workout programs with exercises and blocks
- **Predefined Programs**: Access built-in workout programs
- **QR Code Sharing**: Share programs via QR codes for quick import
- **Program Import/Export**: JSON export/import for data portability

### 🏋️ Exercise Library
- **Exercise Management**: Create, edit, and manage exercise database
- **Categories**: Organize by strength, cardio, flexibility, skill
- **Icons & Media**: Visual identification with Ionicons
- **Three Sources**: Built-in (read-only), user-created, professional trainer

### 📊 Progress Tracking & Analytics
- **Personal Records (PRs)**: Track max weight, max reps, volume, estimated 1RM
- **Weekly Statistics**: Aggregate stats by week
- **Consistency Heatmap**: Visualize workout consistency over time
- **7-Day Streak**: Track consecutive workout days
- **Program Progress**: Lifetime stats per program
- **Challenge Tracking**: Challenge-specific progress with rep increases

### 🎯 Challenges
- **Progressive Challenges**: Automatically scale rep targets weekly
- **Challenge Mode**: Run as program variant with challenge config
- **Progress Visualization**: Track challenge completion percentage
- **Rep Accumulation**: Track total reps against target

### 👤 User Management
- **Firebase Auth**: Email/password authentication
- **Guest Access**: Try app without account
- **Account Linking**: Convert guest to registered user
- **Profile Management**: User settings and preferences

---

## Technology Stack

### Core Dependencies

#### Frontend Framework
- **React**: 19.1.0 - UI library
- **React Native**: 0.81.5 - Native mobile framework
- **Expo**: ~54.0.27 - Development platform

#### Routing & Navigation
- **Expo Router**: ~6.0.17 - File-based routing
- **React Navigation**: 7.1.8 - Navigation library
- **React Navigation Bottom Tabs**: 7.4.0 - Tab navigation

#### State Management & Data
- **Firebase**: 12.8.0 - Authentication + Realtime database
- **React Context API**: Built-in state management

#### UI Components & Styling
- **Victory Native**: 41.20.2 - Charts and data visualization
- **Expo Vector Icons**: 15.0.3 - Icon library (Ionicons)
- **Expo Linear Gradient**: ~15.0.8 - Gradient backgrounds
- **React Native SVG**: 15.12.1 - SVG rendering
- **React Native Reanimated**: ~4.1.1 - Advanced animations
- **React Native Confetti Cannon**: 1.5.2 - Celebration animation

#### Platform Features
- **Expo Camera**: ~17.0.10 - QR code scanning
- **Expo Haptics**: ~15.0.8 - Haptic feedback (mobile)
- **Expo Audio**: ~1.1.0 - Sound effects
- **Expo Image**: ~3.0.11 - Image handling
- **Expo Fonts**: ~14.0.10 - Custom fonts (Google Fonts)

#### Typography
- **Google Fonts**: DM Sans, Inter, Manrope, Plus Jakarta Sans, Sora

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **TypeScript** | ~5.9.2 | Type safety |
| **ESLint** | 9.25.0 | Code linting |
| **Prettier** | Via plugin | Code formatting |
| **Vitest** | 2.1.0 | Unit testing |
| **Fast-check** | 4.5.3 | Property-based testing |

---

## Architecture Overview

### High-Level Architecture

```
User Interface (Screens)
        ↓
Components (54 UI components)
        ↓
Hooks (25 custom React hooks)
        ↓
Context API (Auth + Data state)
        ↓
Storage Layer (Unified API)
        ├→ Web: localStorage
        └→ Native: Expo FileSystem
        ↓
Firebase (Auth + Database)
Optional: Backend API
```

### Directory Structure

- **`app/`** - Expo Router file-based screens (21 screens)
- **`components/`** - 54 reusable UI components organized by feature
- **`hooks/`** - 25 custom hooks (data fetching, session management)
- **`context/`** - Global state (Auth, Data management)
- **`lib/`** - Utilities, validation, storage, API client
- **`types/`** - TypeScript type definitions
- **`theme/`** - Design tokens and styling
- **`__tests__/`** - 23 test files (unit, component, integration)

---

## Key Characteristics

### State Management Pattern
- **React Context API** for global state
- **Custom hooks** for data fetching with built-in caching
- **Event-driven updates** using pub-sub pattern
- **Version counters** for loose coupling between data and UI

### Data Persistence
- **Unified storage layer** (`lib/storage.ts`) abstracts platform differences
- **Web**: `localStorage`
- **Native**: Expo FileSystem API
- **Automatic fallback**: Works offline with local-only data

### Offline-First Design
- All features work without internet connection
- Local storage for exercises, programs, and progress
- Optional Firebase sync when authenticated
- Optional backend API (feature-flag enabled)

### Type Safety
- **TypeScript strict mode** enabled
- **Comprehensive type definitions** for all data models
- **Path aliases** (`@/`) for clean imports

### Performance Optimizations
- **Code splitting**: Expo Router automatic per-screen
- **Lazy loading**: Data loaded on demand
- **Caching**: Firebase tokens, search results, async data
- **Platform-specific rendering**: iOS SafeAreaView, etc.

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
# (other Firebase config...)

# 3. Start development
npm start
```

### Development Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start Expo development server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in web browser |
| `npm run compile` | Check TypeScript compilation |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix code style issues |
| `npm test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run test:coverage` | Generate coverage report |

---

## Key Documentation Files

- **[Architecture](./architecture.md)** - Detailed technical architecture and patterns
- **[Source Tree Analysis](./source-tree-analysis.md)** - Annotated directory structure
- **[Component Inventory](./component-inventory.md)** - All 54 UI components documented
- **[Data Models](./data-models.md)** - Complete database schema and entity relationships
- **[API Contracts](./api-contracts.md)** - Backend API endpoints and contracts
- **[Development Guide](./development-guide.md)** - Setup and development instructions
- **[Integration Architecture](./integration-architecture.md)** - How parts communicate

---

## Project Metadata

| Field | Value |
|-------|-------|
| **Generator** | BMAD Document Project Workflow v1.2.0 |
| **Generated** | 2026-03-06 |
| **Scan Level** | Exhaustive |
| **Total Components** | 54 |
| **Total Hooks** | 25 |
| **Total Screens** | 21 |
| **Total Tests** | 23 files |
| **Type Coverage** | Comprehensive (TypeScript strict mode) |

---

## Next Steps

1. **Review** the [Architecture](./architecture.md) document for detailed design patterns
2. **Set up** local development following [Development Guide](./development-guide.md)
3. **Explore** components using [Component Inventory](./component-inventory.md)
4. **Understand** data flow through [Data Models](./data-models.md)
5. **Run tests** to verify environment: `npm run test:run`

---

*For detailed technical information, refer to the generated architecture and component documentation.*
