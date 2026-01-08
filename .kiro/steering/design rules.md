---
inclusion: always
---

# Styling Guidelines & Design System

## React Native Styling Fundamentals

### StyleSheet Usage
- Use `StyleSheet.create()` for all styles to optimize performance
- Define styles at the bottom of component files for easy reference
- Reference theme colors and constants from `theme/theme.ts`
- Use consistent spacing values based on 8px base unit
- Never use inline styles except for dynamic values calculated at runtime
- Leverage `StyleSheet.flatten()` when combining multiple style objects
- Use `StyleSheet.compose()` for conditional style composition

### Style Organization
- Group related styles together within `StyleSheet.create()`
- Use descriptive style names that reflect their purpose (e.g., `containerStyle`, `headerTextStyle`)
- Separate layout styles from appearance styles for clarity
- Keep style definitions close to their usage context
- Use style composition for reusable style combinations

### Performance Considerations
- Avoid creating new StyleSheet objects on every render
- Use `useMemo()` for dynamically calculated styles
- Memoize style objects passed to child components
- Minimize style recalculations in frequently-rendered components
- Use `React.memo()` for components with complex styling

## Theme System Architecture

### Theme Structure
- Centralized theme definitions in `theme/theme.ts`
- Separate light and dark mode theme objects
- Export theme as a constant object with typed properties
- Include all design tokens: colors, spacing, typography, shadows, borders

### Theme Access Patterns
- Import theme directly: `import { theme } from '@/theme/theme'`
- Use theme values for all styling decisions
- Never hardcode colors, sizes, or spacing values
- Create theme-aware components that adapt to light/dark modes
- Use `useColorScheme()` hook for dynamic theme switching

### Design Tokens
- **Colors**: Primary, secondary, accent, success, warning, error, neutral (with shades)
- **Spacing**: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px
- **Typography**: Font families, sizes (12px, 14px, 16px, 18px, 20px, 24px, 32px), weights (400, 500, 600, 700)
- **Shadows**: Elevation levels (none, small, medium, large)
- **Borders**: Border radius values (4px, 8px, 12px, 16px), border widths (1px, 2px)
- **Opacity**: Standard opacity values (0.1, 0.3, 0.5, 0.7, 0.9)

### Theme Consistency
- Maintain consistency across all components using theme values
- Update theme in one place to affect entire app
- Document all theme values and their intended usage
- Validate theme structure with TypeScript interfaces
- Provide fallback values for missing theme properties

## Responsive Design System

### Layout Patterns
- Use `useWindowDimensions()` hook for responsive layouts
- Implement breakpoints for phone (< 600px) and tablet (≥ 600px)
- Test on multiple device sizes: iPhone SE, iPhone 14, iPad
- Avoid hardcoded pixel values; use theme constants and calculated values
- Use flexbox for flexible, responsive layouts
- Implement safe area insets for notched devices

### Breakpoint Strategy
- **Mobile**: < 600px width (default layout)
- **Tablet**: ≥ 600px width (expanded layout with sidebars)
- **Large Tablet**: ≥ 900px width (multi-column layouts)
- Use `useWindowDimensions()` to detect current breakpoint
- Create responsive utility functions for conditional rendering

### Responsive Components
- Create responsive wrapper components that adapt to screen size
- Use conditional rendering based on breakpoints
- Adjust padding, margins, and font sizes for different screen sizes
- Implement flexible grid layouts that adapt to available space
- Test layouts in both portrait and landscape orientations

### Safe Area Handling
- Use `useSafeAreaInsets()` from `react-native-safe-area-context`
- Apply safe area insets to top, bottom, left, and right edges
- Account for notches, home indicators, and status bars
- Test on devices with and without notches

## Spacing & Sizing System

### Base Unit & Scale
- Base unit: 4px (fundamental spacing increment)
- Spacing scale: `xs: 4px`, `sm: 8px`, `md: 12px`, `lg: 16px`, `xl: 24px`, `xxl: 32px`
- Access spacing via `theme.spacing` object
- Use consistent spacing scale for visual rhythm
- Apply spacing scale to padding, margins, and gaps

### Padding & Margins
- Container padding: `lg` (16px) standard, `xl` (24px) large, `sm` (8px) compact
- Component padding: `md` (12px) standard, `lg` (16px) large, `sm` (8px) small
- Margin between sections: `xl` (24px) standard, `xxl` (32px) large, `lg` (16px) small
- Margin between components: `lg` (16px) standard, `md` (12px) compact
- Use consistent padding for visual balance

### Gap & Spacing in Lists
- Gap between list items: `md` (12px) standard, `lg` (16px) large, `sm` (8px) compact
- Gap between columns in grid: `lg` (16px) standard, `md` (12px) compact
- Gap between form fields: `lg` (16px) standard, `md` (12px) compact
- Use `gap` property in flexbox for consistent spacing

### Component Sizing
- Minimum touch target size: 36-44px (accessibility standard)
- Button height: 44px (standard), 48px (large), 36px (small)
- Input field height: 44px (standard), 48px (large)
- Icon size: 24px (standard), 32px (large), 20px (small), 16px (extra small)
- Avatar size: 40px (standard), 56px (large), 32px (small)

## Typography System

### Font Families
- Primary font: DM Sans (DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold)
- Fallback: System font stack for fallback support
- Use consistent font family across all text elements
- Access fonts via `theme.fonts` object

### Font Sizes & Hierarchy
- **h1**: 28px (bold, for main headings)
- **h2**: 22px (semibold, for section titles)
- **h3**: 18px (semibold, for component titles)
- **Body**: 15px (regular, for standard body text)
- **Body Bold**: 15px (semibold, for emphasis)
- **Caption**: 13px (regular, for captions and labels)

### Font Weights
- **Regular**: 400 (default, for body text)
- **Medium**: 500 (for emphasis within body text)
- **Semibold**: 600 (for subheadings and emphasis)
- **Bold**: 700 (for headings and strong emphasis)

### Line Height & Letter Spacing
- **h1**: Line height 34px
- **h2**: Line height 28px
- **h3**: Line height 24px
- **Body**: Line height 22px
- **Caption**: Line height 18px
- Adjust line height for readability on different screen sizes

### Text Styling
- Use `numberOfLines` prop to truncate text when necessary
- Apply `ellipsizeMode="tail"` for truncated text
- Use `textBreakStrategy="highQuality"` for better text wrapping
- Maintain consistent text color usage (primary, secondary, tertiary)
- Use semantic text colors for different content types

## Color System & Palette

### Color Categories
- **Primary**: Indigo-600 (#4F46E5) for key actions and highlights
- **Primary Dark**: Indigo-700 (#4338CA) for darker states
- **Primary Light**: Indigo-50 (#EEF2FF) for backgrounds
- **Accent**: Amber-500 (#F59E0B) for special emphasis
- **Success**: Emerald-500 (#10B981) for positive actions and confirmations
- **Success Light**: Emerald-100 (#D1FAE5) for success backgrounds
- **Danger**: Red-500 (#EF4444) for errors and destructive actions
- **Danger Light**: Red-100 (#FEE2E2) for error backgrounds
- **Warning**: Amber-500 (#F59E0B) for warnings and cautions
- **Warning Light**: Amber-100 (#FEF3C7) for warning backgrounds
- **Neutral**: Slate grayscale for backgrounds, borders, and text

### Neutral Color Palette
- **Background**: #FAFBFC (softer, more neutral background)
- **Surface**: #FFFFFF (primary surface)
- **Card**: #F8FAFC (slate-50, for secondary surfaces)
- **Text**: #1A1F2E (deep, rich black for readability)
- **Subtext**: #475569 (slate-600, for secondary text)
- **Muted**: #64748B (slate-500, for tertiary text)
- **Border**: #E2E8F0 (slate-200, for borders and dividers)

### Phase Palette for Workout States
- **Warmup**: Orange-500 (#F97316) with background Orange-50 (#FFF7ED)
- **Working**: Indigo-500 (#6366F1) with background Indigo-50 (#EEF2FF)
- **Break**: Cyan-600 (#0891B2) with background Cyan-50 (#ECFEFF)
- **Done**: Emerald-500 (#10B981) with background Emerald-100 (#D1FAE5)

### Semantic Color Usage
- **Primary Text**: Text (#1A1F2E)
- **Secondary Text**: Subtext (#475569)
- **Tertiary Text**: Muted (#64748B)
- **Disabled Text**: Muted (#64748B) with reduced opacity
- **Background**: Background (#FAFBFC)
- **Surface**: Surface (#FFFFFF)
- **Border**: Border (#E2E8F0)
- **Divider**: Border (#E2E8F0)

### Interactive Color States
- **Default**: Primary (#4F46E5)
- **Hover**: Primary Dark (#4338CA)
- **Active/Pressed**: Primary Dark (#4338CA) with scale transform
- **Disabled**: Muted (#64748B) with 0.5-0.6 opacity
- **Focus**: Primary (#4F46E5) with outline

### Accessibility & Contrast
- Maintain minimum contrast ratio of 4.5:1 for text on backgrounds
- Maintain minimum contrast ratio of 3:1 for UI components
- Test color combinations in both light and dark modes
- Avoid using color alone to convey information
- Use patterns or icons in addition to color for status indication

## Dark Mode Support

### Theme Switching
- Implement light theme as default in `theme/theme.ts`
- Use `useColorScheme()` hook to detect system preference
- Allow manual theme override in app settings
- Persist theme preference to storage
- Apply theme changes globally without full app reload

### Dark Mode Colors
- Currently app uses light mode only
- When implementing dark mode, invert neutral colors appropriately
- Adjust color brightness for readability in dark mode
- Use slightly desaturated colors in dark mode for reduced eye strain
- Maintain sufficient contrast in both modes
- Test all color combinations in dark mode

### Dark Mode Components
- Create theme-aware components that adapt to light/dark modes
- Use conditional styling based on `useColorScheme()` hook
- Apply theme colors consistently across all components
- Test dark mode on actual devices with dark mode enabled
- Provide visual feedback for interactive elements in dark mode

## Shadows & Elevation

### Shadow System
- **sm**: Small shadow (subtle depth) - shadowOpacity 0.06, shadowRadius 4, elevation 1
- **md**: Medium shadow (moderate depth) - shadowOpacity 0.08, shadowRadius 8, elevation 2
- **lg**: Large shadow (prominent depth) - shadowOpacity 0.1, shadowRadius 16, elevation 4

### Shadow Implementation
- Use `theme.shadows` object for consistent shadow application
- Shadow color: Slate-500 (#64748B)
- Apply shadows to cards, modals, and floating elements
- Avoid excessive shadows that reduce readability

### Elevation Usage
- Cards: `sm` shadow
- Buttons: `md` shadow
- Modals: `md` shadow
- Floating buttons: `md` shadow
- Dropdowns: `md` shadow
- Tooltips: `md` shadow

## Border & Corner Radius

### Border Radius Scale
- **sm**: 8px (subtle rounding)
- **md**: 14px (standard rounding)
- **lg**: 20px (prominent rounding)
- **xl**: 28px (very rounded)
- **full**: 9999px (circular elements)

### Border Radius Usage
- Buttons: `md` (14px)
- Input fields: `md` (14px)
- Cards: `lg` (20px)
- Modals: `xl` (28px)
- Avatars: `full` (circular)
- Icons: `sm` (8px)

### Border Styles
- Border width: 1px (standard)
- Border color: Use neutral colors from theme (Border #E2E8F0)
- Border style: Solid (standard)
- Apply borders to inputs, cards, and dividers
- Use consistent border styling across similar components

## Opacity & Transparency

### Opacity Scale
- **Disabled**: 0.5-0.6 (50-60% opacity)
- **Hover**: 0.9 (90% opacity)
- **Subtle**: 0.3 (30% opacity)
- **Faint**: 0.1 (10% opacity)
- **Opaque**: 1.0 (100% opacity)

### Opacity Usage
- Disabled states: 0.5-0.6 opacity
- Pressed states: 0.9 opacity with scale transform
- Overlay backgrounds: 0.35 opacity (rgba(0,0,0,0.35))
- Subtle dividers: 0.1 opacity
- Loading states: 0.6 opacity

## Animation & Transitions

### Animation Timing
- **Quick**: 150ms (micro-interactions)
- **Standard**: 300ms (standard transitions)
- **Slow**: 500ms (complex animations)
- Use consistent timing across similar animations
- Avoid animations longer than 500ms unless necessary

### Easing Functions
- **Linear**: Constant speed (rarely used)
- **EaseIn**: Slow start, fast end (entering animations)
- **EaseOut**: Fast start, slow end (exiting animations)
- **EaseInOut**: Slow start and end (standard transitions)
- Use appropriate easing for animation type

### Animation Principles
- Animate only necessary properties (opacity, transform, scale)
- Avoid animating layout properties (width, height) for performance
- Use `useNativeDriver: true` for better performance
- Provide visual feedback for user interactions
- Keep animations subtle and purposeful

## Component-Specific Styling

### Buttons
- Height: 44px (standard)
- Padding: `lg` (16px) horizontal, `lg` (16px) vertical
- Border radius: `md` (14px)
- Font size: 15px (body bold)
- Font weight: 600 (semibold)
- Minimum touch target: 44px × 44px
- Active state: Opacity 0.9 with scale 0.98 transform
- Disabled state: 0.5-0.6 opacity

### Input Fields
- Height: 44px (standard)
- Padding: `md` (12px) horizontal, `md` (12px) vertical
- Border radius: `md` (14px)
- Border: 1px solid Border (#E2E8F0)
- Font size: 15px
- Placeholder color: Muted (#64748B)
- Focus state: Primary color border, shadow
- Error state: Danger color border, error text below
- Background: Card (#F8FAFC)

### Cards
- Padding: `lg` (16px)
- Border radius: `lg` (20px)
- Background: Surface (#FFFFFF)
- Border: 1px solid Border (#E2E8F0)
- Shadow: `sm`
- Spacing between cards: `md` (12px)

### Modals & Dialogs
- Border radius: `xl` (28px) for top corners
- Padding: `lg` (16px)
- Background: Surface (#FFFFFF)
- Shadow: `md`
- Overlay: 35% opacity (rgba(0,0,0,0.35))
- Close button: Top right corner, 36-44px × 36-44px

### Lists & FlatLists
- Item height: Varies by content, minimum 44px
- Separator: 1px solid Border (#E2E8F0)
- Padding: `lg` (16px) horizontal, `md` (12px) vertical per item
- Gap between items: `md` (12px)
- Use `keyExtractor` for unique keys
- Implement `getItemLayout` for known heights

### Tabs
- Height: 48px (standard)
- Padding: `md` (12px) horizontal per tab
- Border radius: `md` (14px)
- Active indicator: Primary color, 2px bottom border
- Font size: 15px
- Font weight: 600 (semibold) for active, 500 (medium) for inactive

### Badges & Tags
- Height: 24px (standard)
- Padding: `xs` (4px) horizontal, `xs` (4px) vertical
- Border radius: `md` (14px)
- Font size: 13px (caption)
- Font weight: 600 (semibold)
- Background: Semantic color (success, warning, error, etc.)

## Accessibility in Styling

### Color Contrast
- Text on background: Minimum 4.5:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio
- Test with contrast checker tools
- Avoid relying on color alone for information

### Touch Targets
- Minimum size: 44px × 44px (iOS), 48px × 48px (Android)
- Adequate spacing between touch targets: 8px minimum
- Avoid small buttons or links
- Provide visual feedback on interaction

### Text Readability
- Use sufficient font size: Minimum 14px for body text
- Maintain adequate line height: 1.4-1.6 for body text
- Avoid very long lines of text (max 60-80 characters)
- Use clear, readable fonts
- Provide sufficient contrast between text and background

### Visual Indicators
- Use icons in addition to color for status
- Provide text labels for all interactive elements
- Use visual feedback for focus states
- Indicate loading and disabled states clearly
- Provide error messages with clear descriptions
