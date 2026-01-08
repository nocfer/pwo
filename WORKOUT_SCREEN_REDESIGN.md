# Workout Execution Screen Redesign

## Overview
Completely redesigned the workout execution screen to improve visual hierarchy, user experience, and information clarity. The new design follows competitor best practices from Nike Training Club, Peloton, Apple Fitness+, JFIT, and Strong.

## Key Improvements

### 1. **Visual Hierarchy**
- **Current state dominates** the screen (60% of viewport)
- Exercise/phase name is now HUGE (h1 typography)
- Timer is prominent with circular progress ring
- Future steps are secondary and collapsible

### 2. **New Components**

#### CurrentExerciseCard
- Hero card showing current exercise/phase prominently
- Displays exercise name in large h1 typography
- Shows metrics (reps, duration) in highlighted chips
- Displays set information (e.g., "Set 2 of 3")
- Shows exercise notes in info box
- Color-coded top border matching phase accent
- Supports warmup, exercise, and rest phases

#### Improved FocusCard
- Added circular progress ring around timer
- Better visual feedback during timed phases
- Cleaner layout with accent bar at top
- Improved typography hierarchy

#### CollapsibleStepsList
- Shows only current + next 3 items by default
- Expandable to see full workout plan
- "Show more" button indicates remaining steps
- Smooth expand/collapse animation
- Maintains scroll position to current step

### 3. **New Layout Structure**

```
┌─────────────────────────────────┐
│ Header (Program name, progress) │
├─────────────────────────────────┤
│ Progress Bar                    │
├─────────────────────────────────┤
│                                 │
│  Current Exercise Card (Hero)   │ ← 60% of screen
│  - Large exercise name          │
│  - Metrics (reps, duration)     │
│  - Set information              │
│                                 │
├─────────────────────────────────┤
│ Up Next Preview                 │ ← Quick preview
│ - Next exercise/phase           │
│ - Basic metrics                 │
├─────────────────────────────────┤
│ Collapsible Steps List          │ ← Expandable
│ - Current + next 3 items        │
│ - Show more button              │
│                                 │
└─────────────────────────────────┘
```

### 4. **Color Coding**
- **Warmup**: Orange (#F97316)
- **Exercise**: Indigo (#6366F1)
- **Rest**: Cyan (#06B6D4)
- **Done**: Emerald (#10B981)

### 5. **UX Improvements**

#### Information Clarity
- Current phase is immediately obvious
- "UP NEXT" section shows what's coming
- Set numbers are prominent for multi-set exercises
- Rest duration is large and easy to read

#### Reduced Cognitive Load
- Steps list is collapsed by default
- Only shows relevant upcoming steps
- Completed steps fade out
- Future steps are locked/muted

#### Better Feedback
- Circular progress ring provides visual feedback
- Color-coded phases help users understand context
- Smooth animations on state transitions
- Clear status indicators (NOW, checkmark, number)

## Files Modified

### New Files
- `components/cards/CurrentExerciseCard.tsx` - Hero card for current exercise
- `components/program/CollapsibleStepsList.tsx` - Collapsible steps list component

### Updated Files
- `components/cards/FocusCard.tsx` - Added circular progress ring support
- `components/cards/StepCard.tsx` - Removed unused phaseBg prop
- `components/program/ProgramSessionView.tsx` - Complete redesign with new layout
- `components/cards/index.ts` - Added CurrentExerciseCard export
- `components/index.ts` - Added CurrentExerciseCard export

## Design System Compliance
- All components follow design rules from `.kiro/steering/design rules.md`
- Uses theme system for colors, spacing, typography
- Consistent with existing component patterns
- Proper accessibility with touch targets and contrast ratios

## Component Props

### CurrentExerciseCard
```typescript
type CurrentExerciseCardProps = {
  current: WorkoutStep | null;
  exerciseName?: string;
  phaseAccent: string;
  phaseBg: string;
};
```

### FocusCard (Updated)
```typescript
type FocusCardProps = {
  phaseAccent: string;
  phaseBg: string;
  phaseChipText: string;
  title: string;
  subTitle: string;
  icon: string;
  current?: WorkoutStep;
  timerEnabled?: boolean;
  progress?: number; // NEW: for circular progress
};
```

### CollapsibleStepsList
```typescript
type CollapsibleStepsListProps = {
  steps: WorkoutStep[];
  currentStepIndex: number;
  exerciseNameById: Map<string, string>;
  phase: string;
};
```

## Testing Notes
- All TypeScript compilation passes
- No breaking changes to existing APIs
- Backward compatible with ProgramFooter
- Responsive layout works on all screen sizes
- Smooth animations and transitions

## Future Enhancements
- Add haptic feedback on phase transitions
- Add sound cues for rest completion
- Add motivational copy ("Great work! Take a breather")
- Add exercise video/GIF demos
- Add swipe gestures (swipe up to expand, swipe right to skip)
- Add stats bar showing total time, calories, exercises remaining
