# Design Document

## Overview

This design addresses the critical gap in program execution functionality where users can create programs but cannot start them. Currently, the application only supports execution of challenge programs, leaving regular programs accessible only for editing. This creates an inconsistent and broken user experience.

The solution involves modifying the navigation patterns, adding execution entry points, and ensuring consistent behavior between regular programs and challenges while maintaining the existing session execution infrastructure.

## Architecture

The current architecture already supports program execution through the `/programs/[id]/session/[index]` route and associated components. The missing pieces are:

1. **Navigation Entry Points**: Adding "Start Program" actions in the UI
2. **Program Detail Enhancement**: Ensuring regular programs show execution options
3. **Home Screen Integration**: Including regular programs in quick-start options
4. **Consistent Interaction Patterns**: Standardizing tap-to-start vs tap-to-edit behaviors

## Components and Interfaces

### Modified Components

#### UnifiedDataManager

- **Current Behavior**: `onItemPress` navigates to edit screens for all items
- **New Behavior**: `onItemPress` navigates to program detail/execution screen for programs (both regular and challenges), edit screen for exercises
- **Additional Actions**: Inline action buttons (Start/Edit) visible on all program items (regular programs and challenges)

#### DataList

- **Current Behavior**: Single action (edit) for all items
- **New Behavior**: Context-aware actions based on data type
- **Interface Changes**: Add inline action buttons for programs (Start/Edit), maintain single action for exercises

#### Home Screen (index.tsx)

- **Current Behavior**: Only shows challenge programs in quick-start
- **New Behavior**: Shows both regular programs and challenges
- **Additional Features**: Program selection dropdown or carousel for multiple programs

#### Program Detail Screen (/programs/[id].tsx)

- **Current Behavior**: Shows different views for challenges vs regular programs, only has share button in header
- **New Behavior**: Consistent "Start Program" functionality for both types, plus edit button in header for both regular programs AND challenges
- **Enhancement**: Add edit button to header alongside share button for all program types, ensure ProgramView component has proper start button (already exists)

### New Components

#### ProgramListItem

```typescript
interface ProgramListItemProps {
  program: Program
  onStart: (program: Program) => void
  onEdit: (program: Program) => void
  selected?: boolean
  onSelectionChange?: (selected: boolean) => void
}
```

A specialized list item component for programs that shows inline Start/Edit action buttons, replacing the generic list item for program data types.

### Interface Modifications

#### Enhanced Navigation Props

```typescript
interface ProgramNavigationOptions {
  action?: 'start' | 'edit'
  sessionIndex?: number
}
```

#### Updated DataList Props

```typescript
interface DataListProps {
  // ... existing props
  onItemPress?: (item: DataItem) => void // Primary action (start for programs, edit for exercises)
  onItemEdit?: (item: DataItem) => void // Edit action for programs
  showInlineActions?: boolean // Whether to show inline action buttons for programs
}
```

## Data Models

No changes to existing data models are required. The current `Program` and `Session` types already support the necessary functionality.

## Correctness Properties

Let me analyze the acceptance criteria for testability:

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Converting EARS to Properties

Based on the prework analysis, here are the testable correctness properties:

**Property 1: Program start navigation consistency**
_For any_ program or challenge item tapped in any list, the system should navigate to the program detail/execution screen (not edit screen)
**Validates: Requirements 2.2, 4.1**

**Property 2: Inline action button functionality**
_For any_ program or challenge displayed in the library, the system should show both Start and Edit action buttons that are clearly distinguishable and functional
**Validates: Requirements 2.1, 4.2**

**Property 3: Edit button navigation**
_For any_ program or challenge Edit button that is tapped (in library or detail screen), the system should navigate to the appropriate program edit screen
**Validates: Requirements 1.4, 2.3**

**Property 4: Program execution initialization**
_For any_ program that is started, the system should begin execution with the first session (index 1) of that program
**Validates: Requirements 1.5**

**Property 5: Multi-session navigation capability**
_For any_ program with multiple sessions, the system should allow navigation between all sessions in the program
**Validates: Requirements 1.6**

**Property 6: Program type interaction consistency**
_For any_ program (regular or challenge), the system should provide the same interaction patterns for starting, editing, and navigation
**Validates: Requirements 2.4, 4.4**

**Property 7: Home screen program inclusion**
_For any_ created program (regular or challenge), when programs exist, the system should display them as selectable options on the home screen
**Validates: Requirements 3.1, 3.4**

**Property 8: Home screen program execution**
_For any_ program selected from the home screen, the system should immediately start that program's execution
**Validates: Requirements 3.2**

**Property 9: Program prioritization ordering**
_For any_ set of programs displayed on the home screen, recently used or favorited programs should appear before less recently used programs
**Validates: Requirements 3.5**

**Property 10: Navigation back behavior**
_For any_ program execution session, navigating back should return the user to the screen they came from (home, library, or detail screen)
**Validates: Requirements 4.5**

## Error Handling

### Navigation Errors

- **Invalid Program ID**: Display error screen with "Program not found" message
- **Invalid Session Index**: Redirect to first session or show error
- **Missing Program Data**: Show loading state until data is available

### UI State Errors

- **Empty Program Lists**: Display appropriate empty state messaging with creation prompts
- **Action Button Failures**: Ensure Start/Edit buttons remain functional even if one fails
- **Navigation Stack Issues**: Ensure proper back navigation even if navigation stack is corrupted

### Data Consistency Errors

- **Program Type Mismatches**: Handle cases where program type changes between views
- **Session Data Corruption**: Validate session data before starting execution
- **Concurrent Modifications**: Handle cases where programs are modified while being viewed

## Testing Strategy

### Unit Tests

Unit tests will focus on specific examples and edge cases:

- Empty state rendering when no programs exist
- UI element presence (start buttons, edit buttons, inline actions)
- Navigation parameter validation
- Error state handling

### Property-Based Tests

Property-based tests will verify universal behaviors across all inputs:

- Navigation consistency across different program types and contexts
- Program execution initialization with various program configurations
- Inline action button functionality across different interaction scenarios
- Home screen program display and prioritization logic

**Testing Configuration:**

- Use **Vitest** with **fast-check** for property-based testing
- Minimum 100 iterations per property test
- Each property test tagged with: **Feature: program-execution-access, Property {number}: {property_text}**

**Test Coverage:**

- Navigation flows between all screens
- Program execution initialization and session management
- UI interaction patterns (tap actions, inline buttons)
- Data consistency across program types
- Error handling and edge cases

The dual testing approach ensures both concrete functionality (unit tests) and universal correctness (property tests) are validated, providing comprehensive coverage of the program execution access feature.
