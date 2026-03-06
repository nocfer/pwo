# ESLint & Prettier Configuration Fix

## Issues Fixed

### 1. **ESLint Configuration (eslint.config.js)**

- **Problem**: Used `eslint-plugin-prettier/recommended` which enforces Prettier rules through ESLint (redundant and causes conflicts)
- **Solution**: Switched to `eslint-config-prettier` which disables conflicting ESLint rules, letting Prettier handle formatting
- **Benefit**: Clean separation of concerns — ESLint handles code quality, Prettier handles formatting

### 2. **VS Code Settings (.vscode/settings.json)**

- **Problem**: Referenced non-existent `.prettierrc.mjs` config path
- **Solution**: Removed incorrect path reference; VS Code now auto-discovers `.prettierrc`
- **Problem**: `source.fixAll` is deprecated in newer ESLint versions
- **Solution**: Changed to `source.fixAll.eslint` for explicit ESLint fixing
- **Problem**: Redundant `formatOnSave` in language-specific settings
- **Solution**: Centralized to global `editor.formatOnSave: true`

### 3. **Package.json Scripts**

- **Problem**: `lint:fix` only ran ESLint, skipping Prettier formatting
- **Solution**: Updated to run Prettier first, then ESLint: `prettier --write . && eslint ... --fix`
- **Benefit**: Ensures consistent formatting before linting

## Configuration Details

### ESLint (eslint.config.js)

```javascript
// Uses flat config format (ESLint 9+)
// Extends: expo config + prettier config
// Ignores: dist, node_modules, .expo, coverage
// No custom rules (Prettier handles formatting)
```

### Prettier (.prettierrc)

```json
{
  "arrowParens": "avoid",
  "semi": false,
  "singleQuote": true,
  "trailingComma": "none"
}
```

### VS Code Integration

- **Default formatter**: Prettier for all file types
- **Format on save**: Enabled globally
- **ESLint on save**: Explicit fix action
- **Import organization**: Explicit action (manual trigger)

## Usage

### Format & Lint Everything

```bash
npm run lint:fix
```

### Check Without Fixing

```bash
npm run lint
```

### Manual Formatting (if needed)

```bash
npx prettier --write .
```

## How They Work Together

1. **Prettier** runs first → Handles all formatting (quotes, semicolons, line length, etc.)
2. **ESLint** runs second → Checks code quality (unused vars, logic errors, best practices)
3. **VS Code** on save → Prettier formats, then ESLint fixes fixable issues
4. **No conflicts** → ESLint rules that conflict with Prettier are disabled via `eslint-config-prettier`

## Verification

All files pass both Prettier and ESLint checks:

- ✅ TypeScript files (.ts, .tsx)
- ✅ JavaScript files (.js)
- ✅ JSON files (.json)
- ✅ Test files
- ✅ Configuration files
