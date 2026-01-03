# Technology Stack

## Framework & Platform

- **React Native** with **Expo SDK 54** for cross-platform mobile development
- **Expo Router** for file-based navigation with typed routes
- **TypeScript** for type safety and better developer experience
- **Metro** bundler for web builds

## Key Dependencies

- **React Navigation** for tab and stack navigation
- **React Native Reanimated** for smooth animations
- **React Native Gesture Handler** for touch interactions
- **Victory Native** for charts and data visualization
- **React Native SVG** for vector graphics and QR codes
- **Expo Audio** for workout sounds and feedback
- **Expo Camera** for QR code scanning
- **Expo Haptics** for tactile feedback

## Development Tools

- **ESLint** with Expo config and Prettier integration
- **Vitest** for unit testing with coverage reports
- **TypeScript** strict mode enabled
- **Prettier** for code formatting

## Common Commands

### Development

```bash
npm start              # Start Expo development server
npm run android        # Run on Android emulator
npm run ios           # Run on iOS simulator
npm run web           # Run in web browser
```

### Testing

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run tests with coverage report
```

### Code Quality

```bash
npm run lint          # Check code style
npm run lint:fix      # Fix linting issues automatically
```

### Deployment

```bash
npm run predeploy     # Export for web
npm run deploy        # Deploy to GitHub Pages
```

## Build Configuration

- **app.json**: Expo configuration with platform-specific settings
- **tsconfig.json**: TypeScript with path aliases (`@/*` maps to root)
- **eslint.config.js**: Flat config with Expo and Prettier rules
- **vitest.config.ts**: Test configuration with coverage setup
