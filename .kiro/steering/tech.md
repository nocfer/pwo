# Technology Stack

## Framework & Platform

- **React Native** with **Expo SDK 54** for cross-platform mobile development
- **Expo Router** for file-based navigation and routing
- **TypeScript** for type safety and better developer experience

## Key Libraries

- **React Native Reanimated** for smooth animations and gestures
- **Victory Native** for data visualization and charts
- **React Native SVG** for vector graphics and QR codes
- **Expo Audio** for workout sound effects
- **Expo Haptics** for tactile feedback
- **React Native Gesture Handler** for touch interactions

## Development Tools

- **Vitest** for unit and integration testing with property-based testing using fast-check
- **ESLint** with Expo config and Prettier for code formatting
- **TypeScript** with strict mode enabled
- **Path aliases** using `@/*` for clean imports

## Testing Strategy

- Unit tests for utilities, validation, and data management
- Integration tests for context and data flow
- Property-based testing for form validation and data integrity
- Coverage tracking for core business logic

## Common Commands

### Development

```bash
npm start              # Start Expo development server
npm run android        # Run on Android emulator
npm run ios           # Run on iOS simulator
npm run web           # Run in web browser
```

### Code Quality

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues automatically
```

### Testing

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report
```

### Deployment

```bash
npm run predeploy     # Export for web
npm run deploy        # Deploy to GitHub Pages
```

## Architecture Patterns

- **Context + Reducer** pattern for global state management
- **Custom hooks** for data fetching and business logic
- **Event-driven architecture** for cross-component communication
- **Storage abstraction** for data persistence
- **Validation layer** with comprehensive error handling
