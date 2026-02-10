---
inclusion: always
---

# Styling Guidelines & Design System

## React Native Styling Fundamentals

### StyleSheet Usage

- Use `StyleSheet.create()` for all styles to optimize performance
- Define styles at the bottom of component files for easy reference
- Reference theme colors and constants from `theme/theme.ts`
- Use consistent spacing values based on 4px base unit
- Never use inline styles except for dynamic values calculated at runtime
- Leverage `StyleSheet.flatten()` when combining multiple style objects
- Use `StyleSheet.compose()` for conditional style composition

### Style Organization

- Group related styles together within `StyleSheet.create()`x
- Use descriptive style names that reflect their purpose (e.g., `container`, `header`, `title`)
- Separate layout styles from appearance styles for clarity
- Keep style definitions close to their usage context
- Use theme presets for common patterns (`theme.presets.card`, `theme.presets.buttonPrimary`)

### Performance Considerations

- Avoid creating new StyleSheet objects on every render
- Use `useMemo()` for dynamically calculated styles
- Memoize style objects passed to child components
- Minimize style recalculations in frequently-rendered components
- Use `React.memo()` for components with complex styling

## Theme System Architecture

### Theme Structure

- Centralized theme definitions in `theme/theme.ts`
- Export theme as a constant object with typed properties
- Include all design tokens: colors, spacing, typography, shadows, radius, presets

### Theme Access Patterns

- Import theme directly: `import { theme } from '@/theme/theme'`
- Use theme values for all styling decisions
- Never hardcode colors, sizes, or spacing values
- Use theme presets for common component patterns

### Design Tokens

- **Colors**: Primary, accent, success, warning, danger, neutral palette
- **Spacing**: xs (4px), sm (8px), md (12px), lg (16px), xl (24px), xxl (32px)
- **Typography**: h1, h2, h3, body, bodyBold, caption, captionBold, small
- **Shadows**: none, sm, md, lg
- **Radius**: xs (6px), sm (10px), md (14px), lg (18px), xl (24px), full (9999px)

## Spacing & Sizing System

### Base Unit & Scale

- Base unit: 4px (fundamental spacing increment)
- Spacing scale via `theme.spacing`:
  - `xs`: 4px
  - `sm`: 8px
  - `md`: 12px
  - `lg`: 16px
  - `xl`: 24px
  - `xxl`: 32px

### Padding & Margins

- Screen content padding: `lg` (16px)
- Card padding: `lg` (16px)
- Component internal padding: `md` (12px)
- Gap between sections: `lg` (16px)
- Gap between list items: `sm` (8px)

### Component Sizing

- Minimum touch target: 40-44px
- Standard button height: 44px (md size)
- Small button height: 36px (sm size)
- Large button height: 52px (lg size)
- Input field height: 44px
- Icon button size: 40px × 40px
- Standard icon size: 18-20px
- Small icon size: 14-16px

## Typography System

### Font Families

- Primary font: Manrope (modern geometric sans-serif)
- Weights: Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800)
- Access via `theme.fonts.regular`, `theme.fonts.medium`, `theme.fonts.semiBold`, `theme.fonts.bold`, `theme.fonts.extraBold`

### Typography Scale

```
h1:          26px, Bold, lineHeight 32, letterSpacing -0.5
h2:          20px, SemiBold, lineHeight 26, letterSpacing -0.3
h3:          17px, SemiBold, lineHeight 22
body:        15px, Regular, lineHeight 22
bodyBold:    15px, SemiBold, lineHeight 22
caption:     13px, Regular, lineHeight 18
captionBold: 13px, SemiBold, lineHeight 18
small:       11px, Medium, lineHeight 14
```

### Text Styling

- Use `numberOfLines` prop to truncate text
- Apply `ellipsizeMode="tail"` for truncated text
- Use semantic text colors: `text`, `subtext`, `muted`

## Color System & Palette

### Primary Colors

- **Primary**: #6366F1 (Indigo-500) - main actions, highlights
- **Primary Dark**: #4F46E5 (Indigo-600) - hover/pressed states
- **Primary Light**: #EEF2FF (Indigo-50) - backgrounds, highlights
- **Primary Muted**: #C7D2FE (Indigo-200) - subtle accents

### Accent & Status Colors

- **Accent**: #F59E0B (Amber-500) - special emphasis, streaks
- **Accent Light**: #FEF3C7 (Amber-100) - accent backgrounds
- **Success**: #10B981 (Emerald-500) - positive actions
- **Success Light**: #D1FAE5 (Emerald-100) - success backgrounds
- **Danger**: #EF4444 (Red-500) - errors, destructive actions
- **Danger Light**: #FEE2E2 (Red-100) - error backgrounds
- **Warning**: #F59E0B (Amber-500) - warnings

### Neutral Palette

- **Background**: #F8FAFC (Slate-50) - screen backgrounds
- **Surface**: #FFFFFF - cards, elevated surfaces
- **Card**: #FFFFFF - card backgrounds (same as surface)
- **Text**: #0F172A (Slate-900) - primary text
- **Subtext**: #475569 (Slate-600) - secondary text
- **Muted**: #94A3B8 (Slate-400) - tertiary text, placeholders
- **Border**: #E2E8F0 (Slate-200) - standard borders
- **Border Light**: #F1F5F9 (Slate-100) - subtle dividers

### Phase Colors (Workout States)

- **Warmup**: #F97316 / #FFF7ED (Orange-500 / Orange-50)
- **Working**: #6366F1 / #EEF2FF (Indigo-500 / Indigo-50)
- **Break**: #06B6D4 / #ECFEFF (Cyan-500 / Cyan-50)
- **Done**: #10B981 / #D1FAE5 (Emerald-500 / Emerald-100)

### Overlay

- **Overlay**: rgba(15, 23, 42, 0.5) - modal backdrops

## Shadows & Elevation

### Shadow Scale

```
none: No shadow
sm:   shadowOpacity 0.04, shadowRadius 3, elevation 1
md:   shadowOpacity 0.06, shadowRadius 6, elevation 2
lg:   shadowOpacity 0.08, shadowRadius 12, elevation 4
```

### Shadow Usage

- **Cards**: `sm` shadow (primary card style)
- **Elevated cards**: `md` shadow
- **Modals**: `md` shadow
- **Buttons**: No shadow or `sm` for primary buttons
- Shadow color: #0F172A (Slate-900)

## Border & Corner Radius

### Radius Scale

```
xs:   6px  - small elements, chips
sm:   10px - icon containers, small cards
md:   14px - buttons, inputs, list items
lg:   18px - cards, sections
xl:   24px - modals, large cards
full: 9999px - pills, avatars
```

### Radius Usage

- **Buttons**: `md` (14px)
- **Input fields**: `md` (14px)
- **Cards**: `lg` (18px)
- **List items**: `md` (14px)
- **Modals**: `xl` (24px) for top corners
- **Icon containers**: `sm` (10px)
- **Chips/Pills**: `full` (9999px)

### Border Styles

- Standard border: 1px solid `border` (#E2E8F0)
- Subtle divider: 1px solid `borderLight` (#F1F5F9)
- Focus border: 1px solid `primary` (#6366F1)

## Component-Specific Styling

### Buttons

Three variants: `primary`, `secondary`, `ghost`
Three sizes: `sm`, `md`, `lg`

```
Primary:
- Background: primary (#6366F1)
- Text: primaryTextOn (#FFFFFF)
- Border: none
- Pressed: opacity 0.9, scale 0.98

Secondary:
- Background: surface (#FFFFFF)
- Text: text (#0F172A)
- Border: 1px solid border
- Pressed: background → background color, scale 0.98

Ghost:
- Background: transparent
- Text: primary (#6366F1)
- Border: none
- Pressed: opacity 0.7
```

### Input Fields

```
- Height: 44px
- Padding: md (12px) horizontal
- Border radius: md (14px)
- Background: surface (#FFFFFF)
- Border: 1px solid border (#E2E8F0)
- Focus: border → primary (#6366F1)
- Placeholder: muted (#94A3B8)
```

### Cards

```
Standard Card (theme.presets.card):
- Background: surface (#FFFFFF)
- Border radius: lg (18px)
- Padding: lg (16px)
- Shadow: sm

Bordered Card (theme.presets.cardBordered):
- Same as above but with 1px border, no shadow
```

### List Items

```
- Background: surface (#FFFFFF)
- Border radius: md (14px)
- Padding: md (12px)
- Margin bottom: sm (8px)
- Shadow: sm
- Pressed: background → background color, scale 0.98
```

### Modals

```
- Background: surface (#FFFFFF)
- Border radius: xl (24px) top corners
- Padding: lg (16px)
- Overlay: rgba(15, 23, 42, 0.5)
- Max height: 75% of screen
```

### Tabs

```
Container:
- Background: surface (#FFFFFF)
- Border radius: md (14px)
- Padding: xs (4px)
- Shadow: sm

Tab Button:
- Padding: sm (8px) vertical, md (12px) horizontal
- Border radius: sm (10px)
- Active: background → primaryLight (#EEF2FF)
- Active text: primary (#6366F1), semiBold
- Inactive text: muted (#94A3B8), medium
```

### Icon Buttons

```
- Size: 40px × 40px
- Border radius: md (14px)
- Background: surface or background
- Pressed: background → background, scale 0.96
```

### Chips/Badges

```
- Padding: xs (4px) vertical, sm (8px) horizontal
- Border radius: full (9999px)
- Background: primaryLight (#EEF2FF)
- Text: primary (#6366F1), captionBold
```

## Screen Layout Patterns

### Standard Screen Structure

```jsx
<SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
  <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <Text style={styles.title}>Screen Title</Text>
      <Text style={styles.subtitle}>Subtitle text</Text>
    </View>
    <View style={styles.content}>{/* Content sections */}</View>
  </ScrollView>
</SafeAreaView>
```

### Header Pattern

```
- Padding: lg (16px) horizontal
- Padding top: lg (16px) or xl (24px)
- Padding bottom: md (12px)
- Title: h1 typography
- Subtitle: body typography, muted color
```

### Content Pattern

```
- Padding: lg (16px) horizontal
- Padding bottom: xxl * 2 (64px) for tab bar clearance
- Gap between sections: lg (16px)
```

## Animation Guidelines

### Timing

- **Quick**: 250ms (card animations, fades)
- **Standard**: 300ms (transitions, slides)
- **Stagger delay**: 60-80ms between items

### Animation Values

- Slide distance: 12-16px
- Scale on press: 0.96-0.98
- Opacity on press: 0.7-0.9

### Best Practices

- Always use `useNativeDriver: true` for opacity and transform
- Keep animations subtle and purposeful
- Use staggered animations for lists (80ms delay per item)
- Animate opacity and translateY together for entrance animations

## Accessibility

### Touch Targets

- Minimum size: 40px × 40px
- Adequate spacing between targets: 8px minimum
- Use `hitSlop` for small interactive elements

### Color Contrast

- Text on background: Minimum 4.5:1 ratio
- UI components: Minimum 3:1 ratio
- Don't rely on color alone for information

### Text

- Minimum body text size: 15px
- Minimum caption size: 13px
- Adequate line height for readability

## Theme Presets Reference

Available presets in `theme.presets`:

```
card              - Standard card with shadow
cardBordered      - Card with border, no shadow
rowBetween        - Flex row with space-between
rowCenter         - Flex row with center alignment
screenContainer   - Full screen container
screenContent     - Padded content area
sectionHeader     - Section header row
buttonPrimary     - Primary button style
buttonSecondary   - Secondary button style
buttonGhost       - Ghost button style
iconButton        - Icon button container
input             - Input field style
chip              - Chip/badge container
sessionRow        - Session list item
listItem          - Generic list item
divider           - Horizontal divider
```
