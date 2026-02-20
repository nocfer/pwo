# Design Document: Delete UI for Programs and Exercises

## Overview

This feature adds comprehensive delete functionality to the Progressive Workout app, enabling users to safely remove user-created programs and exercises from their library. The implementation focuses on preventing accidental data loss through confirmation dialogs, dependency validation, and clear error messaging while maintaining consistency with the app's design system.

The delete functionality will be accessible from two primary locations:

1. **Library List View**: Quick delete actions for individual items via the UnifiedDataManager component
2. **Edit Screens**: Delete buttons on the exercise and program edit screens for contextual deletion

The implementation leverages existing infrastructure including the DataContext's `deleteExercise` and `deleteProgram` actions, the `canSafelyDelete` dependency checker, and the established design patterns for modals and buttons.

## Architecture

### Component Structure

The delete functionality will be implemented through three new components and modifications to existing screens:

```
components/
├── common/
│   ├── ConfirmationModal.tsx       [NEW] - Reusable confirmation dialog
│   └── DependencyErrorModal.tsx    [NEW] - Displays dependency blocking errors
├── data/
│   ├── UnifiedDataManager.tsx      [MODIFIED] - Add delete buttons to list items
│   └── DataList.tsx                [MODIFIED] - Support delete action callbacks
app/
├── library/
│   ├── exercises/[id]/edit.tsx     [MODIFIED] - Add delete button
│   └── programs/[id]/edit.tsx      [MODIFIED] - Add delete button
```

### Data Flow

```
User Action (Delete Button Press)
    ↓
Dependency Validation (canSafelyDelete)
    ↓
├─→ Has Dependencies → Show DependencyErrorModal → Cancel
│
└─→ No Dependencies → Show ConfirmationModal
        ↓
    User Confirms
        ↓
    DataContext.deleteExercise/deleteProgram
        ↓
    ├─→ Success → Haptic Feedback → Navigate/Refresh → Show Success Toast
    │
    └─→ Error → Show Error Toast → Keep Item
```

### State Management

Delete operations will use existing DataContext actions without additional global state:

- `deleteExercise(id: string): Promise<void>` - Already implements dependency checking
- `deleteProgram(id: string): Promise<void>` - Already implements permission checking
- Local component state for modal visibility and loading states

## Components and Interfaces

### 1. ConfirmationModal Component

A reusable modal for confirming destructive actions.

**Props Interface:**

```typescript
interface ConfirmationModalProps {
  visible: boolean
  title: string
  message: string
  itemName?: string
  itemType?: 'exercise' | 'program'
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}
```

**Behavior:**

- Displays a modal overlay with blur effect
- Shows item name and type prominently
- Confirm button styled as destructive (danger color)
- Cancel button styled as secondary (safe default)
- Disables buttons and shows loading state during async operations
- Dismissible via cancel button or backdrop tap
- Provides haptic feedback on button presses

**Styling:**

- Modal container: `borderRadius: theme.radius.xl`, `padding: theme.spacing.lg`
- Shadow: `theme.shadows.md`
- Confirm button: `backgroundColor: theme.colors.danger`
- Cancel button: `backgroundColor: theme.colors.surface`, `borderColor: theme.colors.border`
- Minimum touch targets: 44px height

### 2. DependencyErrorModal Component

Displays blocking errors when items cannot be deleted due to dependencies.

**Props Interface:**

```typescript
interface DependencyErrorModalProps {
  visible: boolean
  itemName: string
  itemType: 'exercise' | 'program'
  dependentPrograms: Program[]
  onDismiss: () => void
}
```

**Behavior:**

- Shows error icon and clear error message
- Lists dependent programs by name (max 5, then "and X more...")
- Single "Got It" button to dismiss
- Non-dismissible via backdrop (must use button)
- Provides haptic feedback on dismiss

**Styling:**

- Error icon: `Ionicons` "alert-circle" in `theme.colors.danger`
- Warning background: `theme.colors.dangerLight`
- List items: `theme.typography.caption`, `theme.colors.subtext`
- Dismiss button: Secondary variant

### 3. DeleteButton Component

A reusable delete button with consistent styling.

**Props Interface:**

```typescript
interface DeleteButtonProps {
  onPress: () => void
  variant?: 'icon' | 'text' | 'inline'
  size?: 'sm' | 'md'
  disabled?: boolean
  loading?: boolean
}
```

**Variants:**

- `icon`: Icon-only button (trash icon) for list items
- `text`: Full button with "Delete" label for edit screens
- `inline`: Compact button for inline actions

**Styling:**

- Icon color: `theme.colors.danger`
- Text button: `backgroundColor: theme.colors.dangerLight`, `color: theme.colors.danger`
- Minimum touch target: 44px × 44px
- Pressed state: `opacity: 0.7`, `scale: 0.96`

### 4. Modified UnifiedDataManager

**Changes:**

- Add delete button to each list item (icon variant)
- Handle delete button press with dependency check
- Show appropriate modal based on validation result
- Refresh list after successful deletion
- Display toast notification for success/error

**New State:**

```typescript
const [deleteModalVisible, setDeleteModalVisible] = useState(false)
const [dependencyErrorVisible, setDependencyErrorVisible] = useState(false)
const [itemToDelete, setItemToDelete] = useState<{
  id: string
  name: string
  type: DataType
} | null>(null)
const [dependentPrograms, setDependentPrograms] = useState<Program[]>([])
const [deleting, setDeleting] = useState(false)
```

**New Methods:**

```typescript
const handleDeletePress = async (item: Exercise | Program) => {
  // Check if built-in
  if (item.source === 'builtin') {
    showToast('Built-in items cannot be deleted', 'error')
    return
  }

  // Check dependencies
  const check = canSafelyDelete(
    activeTab,
    item.id,
    state.exercises,
    state.programs
  )

  if (!check.canDelete) {
    setItemToDelete({ id: item.id, name: item.name, type: activeTab })
    setDependentPrograms(check.dependencies.programs || [])
    setDependencyErrorVisible(true)
    haptics.error()
  } else {
    setItemToDelete({ id: item.id, name: item.name, type: activeTab })
    setDeleteModalVisible(true)
    haptics.warning()
  }
}

const handleConfirmDelete = async () => {
  if (!itemToDelete) return

  setDeleting(true)
  try {
    if (itemToDelete.type === 'exercises') {
      await actions.deleteExercise(itemToDelete.id)
    } else {
      await actions.deleteProgram(itemToDelete.id)
    }

    haptics.success()
    showToast(`${itemToDelete.name} deleted`, 'success')
    setDeleteModalVisible(false)
    setItemToDelete(null)
  } catch (error) {
    haptics.error()
    showToast(error.message || 'Failed to delete item', 'error')
  } finally {
    setDeleting(false)
  }
}
```

### 5. Modified Edit Screens

Both `app/library/exercises/[id]/edit.tsx` and `app/library/programs/[id]/edit.tsx` will be modified to add delete functionality.

**Changes:**

- Add delete button in header or footer area
- Implement same delete flow as UnifiedDataManager
- Navigate back to library after successful deletion
- Show confirmation modal before deletion
- Show dependency error modal if applicable

**New State:**

```typescript
const [deleteModalVisible, setDeleteModalVisible] = useState(false)
const [dependencyErrorVisible, setDependencyErrorVisible] = useState(false)
const [dependentPrograms, setDependentPrograms] = useState<Program[]>([])
const [deleting, setDeleting] = useState(false)
```

**Layout Addition:**

```tsx
{
  /* Delete Button - Only for user content */
}
{
  exercise.source === 'user' && (
    <View style={styles.deleteSection}>
      <DeleteButton
        variant="text"
        onPress={handleDeletePress}
        disabled={saving || deleting}
        loading={deleting}
      />
    </View>
  )
}
```

## Data Models

No new data models are required. The implementation uses existing types:

```typescript
// From types/enhanced.ts
interface DependencyCheck {
  canDelete: boolean
  dependencies: {
    programs?: Program[]
    challenges?: Program[]
  }
  warnings: string[]
}

// Component-specific types
interface DeleteState {
  itemToDelete: {
    id: string
    name: string
    type: 'exercise' | 'program'
  } | null
  dependentPrograms: Program[]
  modalVisible: boolean
  errorVisible: boolean
  deleting: boolean
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

- Properties 1.2, 2.3 are inverses of 1.1 and 2.1 respectively - covered by testing source filtering
- Property 2.4 duplicates 1.3 - confirmation should apply to all delete buttons
- Property 2.2 can be combined with 2.1 - both test edit screen delete buttons
- Property 6.3 duplicates 2.5 - navigation after deletion from edit screen
- Properties 3.2 can be combined with 3.1 - both test modal content display

The following properties provide unique validation value:

### Property 1: Delete Button Visibility Based on Source

_For any_ item (exercise or program) in the library list, a delete button should be visible if and only if the item's source is 'user'.

**Validates: Requirements 1.1, 1.2**

### Property 2: Confirmation Dialog Precedes Deletion

_For any_ delete button press (in list view or edit screen), the app should display a confirmation dialog before executing any deletion operation.

**Validates: Requirements 1.3, 2.4**

### Property 3: Edit Screen Delete Button Visibility

_For any_ item (exercise or program) on an edit screen, a delete button should be visible if and only if the item's source is 'user'.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Navigation After Successful Edit Screen Deletion

_For any_ successful deletion initiated from an edit screen, the app should navigate back to the library screen.

**Validates: Requirements 2.5, 6.3**

### Property 5: Confirmation Modal Contains Item Details

_For any_ deletion confirmation dialog, the modal should display both the item name and item type (exercise or program).

**Validates: Requirements 3.1, 3.2**

### Property 6: Cancel Preserves Item

_For any_ confirmation dialog, pressing the cancel button should close the dialog without deleting the item, and the item should remain in the data store.

**Validates: Requirements 3.4**

### Property 7: Confirm Executes Deletion

_For any_ confirmation dialog, pressing the delete button should permanently remove the item from the data store.

**Validates: Requirements 3.5**

### Property 8: Dependency Check Before Exercise Deletion

_For any_ exercise deletion attempt, the app should check if any programs reference that exercise before showing the confirmation dialog.

**Validates: Requirements 4.1**

### Property 9: Dependency Error Displays Dependent Programs

_For any_ exercise that is used by one or more programs, attempting to delete it should display an error message that lists the dependent programs.

**Validates: Requirements 4.2**

### Property 10: Dependencies Block Deletion

_For any_ exercise that is used by one or more programs, the deletion should be prevented (no confirmation dialog shown, item remains in data store).

**Validates: Requirements 4.3**

### Property 11: No Dependencies Allow Deletion

_For any_ exercise that is not used by any programs, the deletion attempt should proceed to the confirmation dialog.

**Validates: Requirements 4.4**

### Property 12: Dependency Error Shows Count

_For any_ exercise with dependencies, the error message should include the count of programs using that exercise.

**Validates: Requirements 4.5**

### Property 13: Failed Deletion Preserves Item

_For any_ deletion operation that fails (network, auth, or permission error), the item should remain in the data store unchanged.

**Validates: Requirements 5.5**

### Property 14: Successful List Deletion Removes Item

_For any_ successful deletion initiated from the list view, the item should be immediately removed from the displayed list.

**Validates: Requirements 6.2**

### Property 15: Success Message Contains Item Details

_For any_ successful deletion, the success message should include both the item name and item type.

**Validates: Requirements 6.4, 6.5**

### Property 16: Bulk Delete Button Appears With Selection

_For any_ library list state where one or more items are selected, a bulk delete button should be visible.

**Validates: Requirements 7.1**

### Property 17: Bulk Confirmation Shows Count

_For any_ bulk delete operation, the confirmation dialog should display the count of items to be deleted.

**Validates: Requirements 7.2**

### Property 18: Bulk Deletion Validates All Dependencies

_For any_ bulk delete operation that includes exercises, the app should validate dependencies for all selected exercises before deletion.

**Validates: Requirements 7.3**

### Property 19: Bulk Error Lists Blocked Items

_For any_ bulk delete operation where some exercises have dependencies, the error message should list which specific exercises cannot be deleted.

**Validates: Requirements 7.4**

### Property 20: Partial Bulk Deletion

_For any_ bulk delete operation with mixed dependency status, only items without dependencies should be deleted, while items with dependencies should remain selected.

**Validates: Requirements 7.5**

### Property 21: Bulk Success Clears Selection

_For any_ successful bulk deletion, the selection should be cleared and a success message should display the count of deleted items.

**Validates: Requirements 7.6**

### Property 22: Delete Buttons Have Accessibility Labels

_For any_ delete button (icon or text variant), the button should have a descriptive accessibility label that identifies both the action and the target item.

**Validates: Requirements 8.1**

## Error Handling

### Error Categories

The delete functionality must handle four categories of errors:

#### 1. Permission Errors

- **Trigger**: Attempting to delete built-in content
- **Detection**: Check `item.source === 'builtin'` before showing confirmation
- **Response**: Show toast message "Built-in [type] cannot be deleted"
- **Recovery**: No action needed, item remains unchanged

#### 2. Dependency Errors

- **Trigger**: Attempting to delete an exercise used by programs
- **Detection**: Call `canSafelyDelete()` before showing confirmation
- **Response**: Show `DependencyErrorModal` with list of dependent programs
- **Recovery**: User must remove exercise from programs first, or cancel

#### 3. Network Errors

- **Trigger**: API call fails due to connectivity issues
- **Detection**: Catch network errors from `deleteExercise`/`deleteProgram`
- **Response**: Show toast "Failed to delete [name]. Check your connection and try again."
- **Recovery**: User can retry the deletion

#### 4. Authentication Errors

- **Trigger**: User is not authenticated when attempting deletion
- **Detection**: Catch auth errors from DataContext actions
- **Response**: Show toast "You must be signed in to delete items"
- **Recovery**: User must sign in, then retry

### Error Display Strategy

All errors will be displayed using a toast notification system (to be implemented or using existing toast library):

```typescript
interface ToastOptions {
  message: string
  type: 'success' | 'error' | 'warning'
  duration?: number
}

function showToast(message: string, type: ToastOptions['type']) {
  // Implementation using react-native-toast-message or similar
}
```

**Toast Styling:**

- Success: `backgroundColor: theme.colors.successLight`, `color: theme.colors.success`
- Error: `backgroundColor: theme.colors.dangerLight`, `color: theme.colors.danger`
- Warning: `backgroundColor: theme.colors.warningLight`, `color: theme.colors.warning`
- Duration: 3000ms for success, 5000ms for errors
- Position: Top of screen with safe area insets

### Error Recovery Flows

```
Permission Error Flow:
User presses delete → Check source → Show toast → End

Dependency Error Flow:
User presses delete → Check dependencies → Show modal with programs → User dismisses → End

Network Error Flow:
User confirms delete → API call fails → Show toast with retry message → User can retry

Auth Error Flow:
User confirms delete → Auth check fails → Show toast → User signs in → Retry
```

## Testing Strategy

### Dual Testing Approach

This feature will use both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** will focus on:

- Specific examples of delete flows (user content, built-in content)
- Edge cases (empty lists, single item, network failures)
- Component rendering (modal visibility, button states)
- Integration points (DataContext actions, navigation)

**Property-Based Tests** will focus on:

- Universal properties across all inputs (any item, any dependency state)
- Comprehensive input coverage through randomization
- Validation of correctness properties defined above

### Property-Based Testing Configuration

**Library**: `fast-check` (already in use per tech.md)

**Configuration**:

- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: delete-ui-for-programs-exercises, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check'
import { describe, it, expect } from 'vitest'

describe('Feature: delete-ui-for-programs-exercises', () => {
  it('Property 1: Delete button visibility based on source', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string(),
          name: fc.string(),
          source: fc.constantFrom('builtin', 'user', 'pt')
        }),
        item => {
          const shouldShowDelete = item.source === 'user'
          const actuallyShows = checkDeleteButtonVisible(item)
          expect(actuallyShows).toBe(shouldShowDelete)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Test Coverage

**Component Tests**:

- `ConfirmationModal.test.tsx`: Modal rendering, button interactions, loading states
- `DependencyErrorModal.test.tsx`: Error display, program list rendering, dismiss behavior
- `DeleteButton.test.tsx`: Variant rendering, disabled states, press handling

**Integration Tests**:

- `UnifiedDataManager.delete.test.tsx`: Delete flow from list view, dependency checking, success/error handling
- `EditExerciseScreen.delete.test.tsx`: Delete flow from edit screen, navigation after deletion
- `EditProgramScreen.delete.test.tsx`: Delete flow from edit screen, navigation after deletion

**Edge Cases**:

- Deleting the last item in a list
- Deleting while offline (network error)
- Deleting while not authenticated
- Attempting to delete built-in content
- Bulk delete with all items having dependencies
- Bulk delete with mixed dependency status

### Test Data Generators

For property-based tests, we'll create generators for:

```typescript
// Exercise generator
const exerciseArb = fc.record({
  id: fc.string(),
  name: fc.string({ minLength: 1 }),
  category: fc.constantFrom('strength', 'cardio', 'flexibility'),
  icon: fc.string(),
  source: fc.constantFrom('builtin', 'user', 'pt')
})

// Program generator
const programArb = fc.record({
  id: fc.string(),
  name: fc.string({ minLength: 1 }),
  description: fc.string(),
  blocks: fc.array(blockArb),
  source: fc.constantFrom('builtin', 'user', 'pt')
})

// Program with exercise dependencies
const programWithDepsArb = (exerciseIds: string[]) =>
  fc.record({
    id: fc.string(),
    name: fc.string({ minLength: 1 }),
    blocks: fc.array(
      fc.record({
        type: fc.constant('exercise'),
        exerciseId: fc.constantFrom(...exerciseIds)
      })
    ),
    source: fc.constant('user')
  })
```

### Testing Accessibility

Accessibility requirements will be tested using:

- `@testing-library/react-native` for accessibility queries
- Manual testing with VoiceOver (iOS) and TalkBack (Android)
- Automated checks for minimum touch target sizes
- Verification of accessibility labels on all interactive elements

**Automated Accessibility Tests**:

```typescript
it('delete buttons have minimum touch target size', () => {
  const { getByLabelText } = render(<DeleteButton onPress={jest.fn()} />)
  const button = getByLabelText(/delete/i)
  const { width, height } = button.props.style
  expect(width).toBeGreaterThanOrEqual(44)
  expect(height).toBeGreaterThanOrEqual(44)
})

it('delete buttons have descriptive labels', () => {
  const item = { id: '1', name: 'Push-ups', source: 'user' }
  const { getByLabelText } = render(<DeleteButton item={item} />)
  expect(getByLabelText('Delete Push-ups')).toBeTruthy()
})
```

## Implementation Details

### Component Implementation Order

1. **ConfirmationModal** (foundational component)
2. **DependencyErrorModal** (foundational component)
3. **DeleteButton** (reusable button component)
4. **Toast notification system** (if not already present)
5. **UnifiedDataManager modifications** (list view delete)
6. **Edit screen modifications** (edit view delete)
7. **Bulk delete functionality** (advanced feature)

### ConfirmationModal Implementation

**File**: `components/common/ConfirmationModal.tsx`

```typescript
import { theme } from '@/theme/theme'
import { Modal, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { haptics } from '@/lib/haptics'

interface ConfirmationModalProps {
  visible: boolean
  title: string
  message: string
  itemName?: string
  itemType?: 'exercise' | 'program'
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ConfirmationModal({
  visible,
  title,
  message,
  itemName,
  itemType,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false
}: ConfirmationModalProps) {
  const handleConfirm = async () => {
    haptics.warning()
    await onConfirm()
  }

  const handleCancel = () => {
    haptics.buttonTap()
    onCancel()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.danger} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Item Details */}
          {itemName && (
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{itemName}</Text>
              {itemType && (
                <Text style={styles.itemType}>
                  {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                </Text>
              )}
            </View>
          )}

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.buttonPressed
              ]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled
              ]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.primaryTextOn} />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.md
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm
  },
  itemDetails: {
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center'
  },
  itemName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  itemType: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: theme.spacing.xl
  },
  buttons: {
    flexDirection: 'row',
    gap: theme.spacing.md
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  confirmButton: {
    backgroundColor: theme.colors.danger
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }]
  },
  buttonDisabled: {
    opacity: 0.5
  },
  cancelButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  confirmButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  }
})
```

### DependencyErrorModal Implementation

**File**: `components/common/DependencyErrorModal.tsx`

```typescript
import { theme } from '@/theme/theme'
import { Program } from '@/types'
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { haptics } from '@/lib/haptics'

interface DependencyErrorModalProps {
  visible: boolean
  itemName: string
  itemType: 'exercise' | 'program'
  dependentPrograms: Program[]
  onDismiss: () => void
}

export function DependencyErrorModal({
  visible,
  itemName,
  itemType,
  dependentPrograms,
  onDismiss
}: DependencyErrorModalProps) {
  const handleDismiss = () => {
    haptics.buttonTap()
    onDismiss()
  }

  const displayPrograms = dependentPrograms.slice(0, 5)
  const remainingCount = dependentPrograms.length - 5

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.danger} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Cannot Delete {itemType}</Text>

          {/* Item Name */}
          <View style={styles.itemNameContainer}>
            <Text style={styles.itemName}>{itemName}</Text>
          </View>

          {/* Message */}
          <Text style={styles.message}>
            This {itemType} is used by {dependentPrograms.length} program
            {dependentPrograms.length === 1 ? '' : 's'} and cannot be deleted.
          </Text>

          {/* Program List */}
          <View style={styles.programListContainer}>
            <Text style={styles.programListTitle}>Used by:</Text>
            <ScrollView style={styles.programList} showsVerticalScrollIndicator={false}>
              {displayPrograms.map((program) => (
                <View key={program.id} style={styles.programItem}>
                  <Ionicons name="barbell" size={16} color={theme.colors.subtext} />
                  <Text style={styles.programName}>{program.name}</Text>
                </View>
              ))}
              {remainingCount > 0 && (
                <Text style={styles.remainingText}>
                  and {remainingCount} more...
                </Text>
              )}
            </ScrollView>
          </View>

          {/* Dismiss Button */}
          <Pressable
            style={({ pressed }) => [
              styles.dismissButton,
              pressed && styles.dismissButtonPressed
            ]}
            onPress={handleDismiss}
          >
            <Text style={styles.dismissButtonText}>Got It</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...theme.shadows.md
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md
  },
  itemNameContainer: {
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center'
  },
  itemName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: theme.spacing.lg
  },
  programListContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    maxHeight: 200
  },
  programListTitle: {
    ...theme.typography.captionBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm
  },
  programList: {
    maxHeight: 150
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  programName: {
    ...theme.typography.caption,
    color: theme.colors.subtext,
    flex: 1
  },
  remainingText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs
  },
  dismissButton: {
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dismissButtonPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  dismissButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  }
})
```

### DeleteButton Implementation

**File**: `components/common/DeleteButton.tsx`

```typescript
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'

interface DeleteButtonProps {
  onPress: () => void
  variant?: 'icon' | 'text' | 'inline'
  size?: 'sm' | 'md'
  disabled?: boolean
  loading?: boolean
  accessibilityLabel?: string
  style?: ViewStyle
}

export function DeleteButton({
  onPress,
  variant = 'icon',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel = 'Delete',
  style
}: DeleteButtonProps) {
  const iconSize = size === 'sm' ? 18 : 20

  if (variant === 'icon') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.iconButton,
          size === 'sm' && styles.iconButtonSm,
          pressed && !disabled && styles.iconButtonPressed,
          disabled && styles.buttonDisabled,
          style
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.danger} />
        ) : (
          <Ionicons name="trash-outline" size={iconSize} color={theme.colors.danger} />
        )}
      </Pressable>
    )
  }

  if (variant === 'inline') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.inlineButton,
          pressed && !disabled && styles.inlineButtonPressed,
          disabled && styles.buttonDisabled,
          style
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.danger} />
        ) : (
          <>
            <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
            <Text style={styles.inlineButtonText}>Delete</Text>
          </>
        )}
      </Pressable>
    )
  }

  // text variant
  return (
    <Pressable
      style={({ pressed }) => [
        styles.textButton,
        size === 'sm' && styles.textButtonSm,
        pressed && !disabled && styles.textButtonPressed,
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.danger} />
      ) : (
        <>
          <Ionicons name="trash-outline" size={iconSize} color={theme.colors.danger} />
          <Text style={styles.textButtonText}>Delete</Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconButtonSm: {
    width: 40,
    height: 40
  },
  iconButtonPressed: {
    backgroundColor: theme.colors.dangerLight,
    transform: [{ scale: 0.96 }]
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    height: 44,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.dangerLight
  },
  textButtonSm: {
    height: 40,
    paddingHorizontal: theme.spacing.md
  },
  textButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }]
  },
  textButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.danger
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm
  },
  inlineButtonPressed: {
    opacity: 0.7
  },
  inlineButtonText: {
    ...theme.typography.caption,
    color: theme.colors.danger
  },
  buttonDisabled: {
    opacity: 0.5
  }
})
```

### UnifiedDataManager Modifications

**Changes to**: `components/data/UnifiedDataManager.tsx`

Add the following imports:

```typescript
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { DependencyErrorModal } from '@/components/common/DependencyErrorModal'
import { DeleteButton } from '@/components/common/DeleteButton'
import { canSafelyDelete } from '@/lib/dependencyChecker'
```

Add state for delete modals:

```typescript
const [deleteModalVisible, setDeleteModalVisible] = useState(false)
const [dependencyErrorVisible, setDependencyErrorVisible] = useState(false)
const [itemToDelete, setItemToDelete] = useState<{
  id: string
  name: string
  type: DataType
} | null>(null)
const [dependentPrograms, setDependentPrograms] = useState<Program[]>([])
const [deleting, setDeleting] = useState(false)
```

Add delete handlers:

```typescript
const handleDeletePress = useCallback(
  async (item: Exercise | Program) => {
    // Check if built-in
    if (item.source === 'builtin') {
      // Show toast: "Built-in items cannot be deleted"
      haptics.error()
      return
    }

    // Check dependencies
    const check = canSafelyDelete(
      activeTab,
      item.id,
      state.exercises,
      state.programs
    )

    if (!check.canDelete) {
      setItemToDelete({ id: item.id, name: item.name, type: activeTab })
      setDependentPrograms(check.dependencies.programs || [])
      setDependencyErrorVisible(true)
      haptics.error()
    } else {
      setItemToDelete({ id: item.id, name: item.name, type: activeTab })
      setDeleteModalVisible(true)
      haptics.warning()
    }
  },
  [activeTab, state.exercises, state.programs]
)

const handleConfirmDelete = useCallback(async () => {
  if (!itemToDelete) return

  setDeleting(true)
  try {
    if (itemToDelete.type === 'exercises') {
      await actions.deleteExercise(itemToDelete.id)
    } else {
      await actions.deleteProgram(itemToDelete.id)
    }

    haptics.success()
    // Show toast: `${itemToDelete.name} deleted`
    setDeleteModalVisible(false)
    setItemToDelete(null)
  } catch (error: any) {
    haptics.error()
    // Show toast: error.message || 'Failed to delete item'
  } finally {
    setDeleting(false)
  }
}, [itemToDelete, actions])

const handleCancelDelete = useCallback(() => {
  setDeleteModalVisible(false)
  setItemToDelete(null)
}, [])

const handleDismissDependencyError = useCallback(() => {
  setDependencyErrorVisible(false)
  setItemToDelete(null)
  setDependentPrograms([])
}, [])
```

Pass `onDelete` callback to DataList:

```typescript
<DataList
  dataType={activeTab}
  data={currentData}
  searchState={searchState}
  selectedItems={selectedItems}
  onSelectionChange={handleSelectionChange}
  onItemPress={handleItemPress}
  onItemEdit={handleItemEdit}
  onItemDelete={handleDeletePress}  // NEW
  showInlineActions={activeTab === 'programs'}
  isLoading={isLoading}
  style={styles.dataList}
/>
```

Add modals before closing component:

```typescript
{/* Confirmation Modal */}
<ConfirmationModal
  visible={deleteModalVisible}
  title="Delete Item?"
  message="This action cannot be undone."
  itemName={itemToDelete?.name}
  itemType={itemToDelete?.type === 'exercises' ? 'exercise' : 'program'}
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
  loading={deleting}
/>

{/* Dependency Error Modal */}
<DependencyErrorModal
  visible={dependencyErrorVisible}
  itemName={itemToDelete?.name || ''}
  itemType={itemToDelete?.type === 'exercises' ? 'exercise' : 'program'}
  dependentPrograms={dependentPrograms}
  onDismiss={handleDismissDependencyError}
/>
```

### DataList Modifications

**Changes to**: `components/data/DataList.tsx`

Add `onItemDelete` prop:

```typescript
interface DataListProps {
  // ... existing props
  onItemDelete?: (item: Exercise | Program) => void
}
```

Add delete button to list item rendering:

```typescript
{/* Delete Button - Only for user content */}
{item.source === 'user' && onItemDelete && (
  <DeleteButton
    variant="icon"
    size="sm"
    onPress={() => onItemDelete(item)}
    accessibilityLabel={`Delete ${item.name}`}
  />
)}
```

### Edit Screen Modifications

**Changes to**: `app/library/exercises/[id]/edit.tsx` and `app/library/programs/[id]/edit.tsx`

Add imports:

```typescript
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { DependencyErrorModal } from '@/components/common/DependencyErrorModal'
import { DeleteButton } from '@/components/common/DeleteButton'
import { canSafelyDelete } from '@/lib/dependencyChecker'
import { useDataContext } from '@/context/DataContext'
```

Add state:

```typescript
const [deleteModalVisible, setDeleteModalVisible] = useState(false)
const [dependencyErrorVisible, setDependencyErrorVisible] = useState(false)
const [dependentPrograms, setDependentPrograms] = useState<Program[]>([])
const [deleting, setDeleting] = useState(false)
const { state } = useDataContext()
```

Add delete handlers (similar to UnifiedDataManager):

```typescript
const handleDeletePress = () => {
  // For exercises: check dependencies
  // For programs: proceed to confirmation
  const check = canSafelyDelete(
    'exercises', // or 'programs'
    id,
    state.exercises,
    state.programs
  )

  if (!check.canDelete) {
    setDependentPrograms(check.dependencies.programs || [])
    setDependencyErrorVisible(true)
    haptics.error()
  } else {
    setDeleteModalVisible(true)
    haptics.warning()
  }
}

const handleConfirmDelete = async () => {
  setDeleting(true)
  try {
    await actions.deleteExercise(id) // or deleteProgram
    haptics.success()
    router.back()
  } catch (error: any) {
    haptics.error()
    // Show toast with error
  } finally {
    setDeleting(false)
  }
}
```

Add delete button to layout:

```typescript
{/* Delete Section - Only for user content */}
{exercise.source === 'user' && (
  <View style={styles.deleteSection}>
    <DeleteButton
      variant="text"
      onPress={handleDeletePress}
      disabled={saving || deleting}
      loading={deleting}
      accessibilityLabel={`Delete ${exercise.name}`}
    />
  </View>
)}
```

Add modals:

```typescript
<ConfirmationModal
  visible={deleteModalVisible}
  title="Delete Exercise?"
  message="This action cannot be undone."
  itemName={exercise.name}
  itemType="exercise"
  onConfirm={handleConfirmDelete}
  onCancel={() => setDeleteModalVisible(false)}
  loading={deleting}
/>

<DependencyErrorModal
  visible={dependencyErrorVisible}
  itemName={exercise.name}
  itemType="exercise"
  dependentPrograms={dependentPrograms}
  onDismiss={() => setDependencyErrorVisible(false)}
/>
```

Add styles:

```typescript
deleteSection: {
  marginTop: theme.spacing.xl,
  paddingTop: theme.spacing.xl,
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
  alignItems: 'center'
}
```

## Integration with Existing Systems

### Backend API Integration

This feature integrates with the following backend DELETE APIs defined in `lib/api.ts`:

**Exercise Deletion API:**

```typescript
// DELETE /api/v1/exercises/:id
async function deleteExercise(id: string): Promise<void>
```

- **Endpoint**: `DELETE /api/v1/exercises/{id}`
- **Authentication**: Requires Firebase auth token (Bearer token)
- **Response**: 204 No Content on success
- **Error Codes**:
  - 401: Not authenticated
  - 403: Insufficient permissions (admin only)
  - 404: Exercise not found
  - 409: Exercise has dependencies (used by programs)

**Program (Workout) Deletion API:**

```typescript
// DELETE /api/v1/workouts/:id
async function deleteWorkout(id: string): Promise<void>
```

- **Endpoint**: `DELETE /api/v1/workouts/{id}`
- **Authentication**: Requires Firebase auth token (Bearer token)
- **Response**: 204 No Content on success
- **Error Codes**:
  - 401: Not authenticated
  - 403: Insufficient permissions (user must own the workout)
  - 404: Workout not found

### DataContext Integration

The delete functionality integrates seamlessly with the existing DataContext:

**Existing Actions Used:**

- `deleteExercise(id: string): Promise<void>` - Already implements:
  - Permission checking via `validateModificationPermissions`
  - Dependency checking via `canSafelyDelete`
  - **Backend API call** to `api.deleteExercise(id)` (DELETE /api/v1/exercises/:id)
  - Automatic list refresh after deletion
- `deleteProgram(id: string): Promise<void>` - Already implements:
  - Built-in source checking
  - **Backend API call** to `api.deleteWorkout(id)` (DELETE /api/v1/workouts/:id)
  - Automatic list refresh after deletion

**No Changes Required** to DataContext - the existing implementation already provides all necessary functionality including backend API integration.

### Dependency Checker Integration

The `lib/dependencyChecker.ts` module provides the `canSafelyDelete` function:

```typescript
canSafelyDelete(
  type: DataType,
  id: string,
  exercises: Exercise[],
  programs: Program[]
): DependencyCheck
```

**Returns:**

```typescript
{
  canDelete: boolean
  dependencies: {
    programs?: Program[]
    challenges?: Program[]
  }
  warnings: string[]
}
```

This function is called before showing the confirmation modal to determine:

1. Whether deletion should be blocked (show DependencyErrorModal)
2. Which programs depend on the exercise (for error display)

### Haptics Integration

The existing `lib/haptics.ts` module provides feedback functions:

```typescript
haptics.warning() // When showing confirmation modal
haptics.error() // When showing dependency error
haptics.success() // After successful deletion
haptics.buttonTap() // For cancel/dismiss actions
```

### Navigation Integration

Uses Expo Router's `router.back()` for navigation after deletion from edit screens:

```typescript
// After successful deletion
router.back() // Returns to library screen
```

### Toast Notification System

If a toast system doesn't exist, implement using `react-native-toast-message`:

```bash
npm install react-native-toast-message
```

**Setup in** `app/_layout.tsx`:

```typescript
import Toast from 'react-native-toast-message'

export default function RootLayout() {
  return (
    <>
      {/* ... existing layout */}
      <Toast />
    </>
  )
}
```

**Usage**:

```typescript
import Toast from 'react-native-toast-message'

Toast.show({
  type: 'success',
  text1: 'Exercise deleted',
  text2: exercise.name,
  visibilityTime: 3000
})

Toast.show({
  type: 'error',
  text1: 'Failed to delete',
  text2: error.message,
  visibilityTime: 5000
})
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Use `useCallback` for delete handlers to prevent unnecessary re-renders
2. **Lazy Loading**: Modals only render when visible
3. **Dependency Checking**: Performed synchronously using in-memory data (no API calls)
4. **List Updates**: DataContext automatically refreshes after deletion (existing behavior)

### Memory Management

- Modals unmount when not visible (controlled by `visible` prop)
- Delete state is local to components (no global state pollution)
- Dependent program lists are cleared after modal dismissal

### Network Efficiency

- Single API call per deletion (existing DataContext behavior)
- No additional network requests for dependency checking (uses local data)
- Optimistic UI updates not used (wait for API confirmation to ensure data integrity)

## Security Considerations

### Permission Validation

All delete operations validate permissions at multiple levels:

1. **UI Level**: Delete buttons only shown for user content (`source === 'user'`)
2. **Handler Level**: Check `source` before showing confirmation
3. **DataContext Level**: `validateModificationPermissions` checks source before API call
4. **API Level**: Backend validates ownership and permissions

### Data Integrity

- Dependency checking prevents orphaned references
- Failed deletions don't modify local state
- API is source of truth (no optimistic updates)
- Automatic list refresh ensures consistency

### User Protection

- Confirmation modal prevents accidental deletion
- Clear messaging about permanent action
- Dependency errors block unsafe deletions
- Cancel is always available and safe default

## Accessibility Compliance

### WCAG 2.1 Level AA Requirements

**Perceivable:**

- All delete buttons have descriptive labels
- Error messages clearly communicate blocking conditions
- Success feedback provided via toast notifications
- Color is not the only indicator (icons + text used)

**Operable:**

- Minimum touch target size: 44px × 44px
- Keyboard navigation supported (React Native default)
- Sufficient time to read and use content (no auto-dismiss on errors)
- Modals dismissible via standard gestures

**Understandable:**

- Clear, concise language in all messages
- Consistent delete button placement and styling
- Predictable behavior (confirmation always shown)
- Error messages explain why action is blocked

**Robust:**

- Semantic HTML/accessibility roles used
- Screen reader announcements for state changes
- Compatible with assistive technologies
- Graceful degradation for errors

### Testing with Assistive Technologies

Manual testing required with:

- **iOS**: VoiceOver
- **Android**: TalkBack

Verify:

- Delete buttons are announced with item name
- Modal content is read in logical order
- Focus moves appropriately when modals open/close
- Error messages are announced immediately

## Future Enhancements

### Phase 2 Features (Not in Current Scope)

1. **Undo Functionality**: Toast with "Undo" button for 5 seconds after deletion
2. **Bulk Delete**: Select multiple items and delete in one operation
3. **Archive Instead of Delete**: Soft delete with ability to restore
4. **Delete History**: Log of deleted items with timestamps
5. **Cascade Delete**: Option to delete programs when deleting their exercises
6. **Export Before Delete**: Automatic backup before deletion

### Potential Improvements

1. **Optimistic UI Updates**: Remove from list immediately, rollback on error
2. **Batch API Calls**: Bulk delete endpoint for multiple items
3. **Progressive Disclosure**: Show dependency count before opening error modal
4. **Smart Suggestions**: Suggest alternative exercises when blocking deletion
5. **Confirmation Preferences**: "Don't ask again" option for power users
