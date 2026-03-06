# Implementation Plan: Delete UI for Programs and Exercises

## Overview

This implementation adds comprehensive delete functionality to the Progressive Workout app, enabling users to safely remove user-created programs and exercises. The implementation follows a bottom-up approach, building foundational components first, then integrating them into existing screens. All delete operations leverage existing DataContext actions and backend APIs.

## Tasks

- [x] 1. Create foundational modal components
  - [x] 1.1 Implement ConfirmationModal component
    - Create `components/common/ConfirmationModal.tsx` with TypeScript interface
    - Implement modal overlay with blur effect and backdrop dismissal
    - Add confirm button (danger styling) and cancel button (secondary styling)
    - Include loading state with ActivityIndicator during async operations
    - Display item name and type prominently in modal content
    - Provide haptic feedback on button presses (warning for confirm, tap for cancel)
    - Follow design system: `borderRadius: theme.radius.xl`, `shadow: theme.shadows.md`
    - Ensure minimum touch targets of 44px height for accessibility
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 9.2, 9.3, 9.5, 9.6_

  - [ ]\* 1.2 Write property test for ConfirmationModal
    - **Property 5: Confirmation Modal Contains Item Details**
    - **Validates: Requirements 3.1, 3.2**
    - Test that modal displays both item name and item type for any valid input
    - Use fast-check to generate random item names and types
    - _Requirements: 3.1, 3.2_

  - [x] 1.3 Implement DependencyErrorModal component
    - Create `components/common/DependencyErrorModal.tsx` with TypeScript interface
    - Display error icon (Ionicons "alert-circle") in danger color
    - Show item name in highlighted container with danger background
    - List dependent programs (max 5 visible, then "and X more...")
    - Include program count in error message
    - Add single "Got It" dismiss button (non-dismissible via backdrop)
    - Provide haptic feedback on dismiss (error on show, tap on dismiss)
    - Use ScrollView for program list with max height constraint
    - _Requirements: 4.2, 4.5, 4.6, 5.4, 9.2, 9.5_

  - [ ]\* 1.4 Write property test for DependencyErrorModal
    - **Property 9: Dependency Error Displays Dependent Programs**
    - **Property 12: Dependency Error Shows Count**
    - **Validates: Requirements 4.2, 4.5**
    - Test that error modal displays program list and count for any dependency set
    - Use fast-check to generate arrays of programs with varying lengths
    - _Requirements: 4.2, 4.5_

  - [x] 1.5 Implement DeleteButton component
    - Create `components/common/DeleteButton.tsx` with three variants: icon, text, inline
    - Icon variant: trash icon only, 44px × 44px touch target, for list items
    - Text variant: icon + "Delete" label, danger background, for edit screens
    - Inline variant: compact icon + text, for inline actions
    - Support two sizes: sm (40px) and md (44px)
    - Include loading state with ActivityIndicator
    - Add disabled state with reduced opacity
    - Use danger color for icon and text
    - Implement pressed state: opacity 0.7, scale 0.96-0.98
    - Include descriptive accessibility labels
    - _Requirements: 1.4, 1.5, 2.6, 8.1, 8.3, 9.1, 9.4_

  - [ ]\* 1.6 Write property test for DeleteButton accessibility
    - **Property 22: Delete Buttons Have Accessibility Labels**
    - **Validates: Requirements 8.1**
    - Test that all button variants have descriptive accessibility labels
    - Use fast-check to generate different item names and verify labels include them
    - _Requirements: 8.1_

- [x] 2. Implement toast notification system
  - [x] 2.1 Install and configure react-native-toast-message
    - Run `npm install react-native-toast-message`
    - Add Toast component to `app/_layout.tsx` root layout
    - Configure toast styling to match design system
    - Success toast: `backgroundColor: theme.colors.successLight`, `color: theme.colors.success`
    - Error toast: `backgroundColor: theme.colors.dangerLight`, `color: theme.colors.danger`
    - Warning toast: `backgroundColor: theme.colors.warningLight`, `color: theme.colors.warning`
    - Set duration: 3000ms for success, 5000ms for errors
    - Position at top of screen with safe area insets
    - _Requirements: 5.4, 6.4, 6.5, 8.5_

  - [x] 2.2 Create toast utility wrapper
    - Create `lib/toast.ts` with typed showToast function
    - Export convenience functions: showSuccess, showError, showWarning
    - Include item name and type in toast messages
    - _Requirements: 5.4, 6.4, 6.5_

- [x] 3. Checkpoint - Verify foundational components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add delete functionality to library list view
  - [x] 4.1 Modify DataList component to support delete actions
    - Add `onItemDelete` prop to DataList component interface
    - Add delete button to list item rendering (icon variant, size sm)
    - Only show delete button when `item.source === 'user'` and `onItemDelete` is provided
    - Set accessibility label: `Delete ${item.name}`
    - Position delete button in list item layout (right side)
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 8.1, 8.3_

  - [ ]\* 4.2 Write property test for delete button visibility
    - **Property 1: Delete Button Visibility Based on Source**
    - **Validates: Requirements 1.1, 1.2**
    - Test that delete button is visible if and only if item source is 'user'
    - Use fast-check to generate items with different source values
    - _Requirements: 1.1, 1.2_

  - [x] 4.3 Add delete state and handlers to UnifiedDataManager
    - Import ConfirmationModal, DependencyErrorModal, DeleteButton, canSafelyDelete
    - Add state: deleteModalVisible, dependencyErrorVisible, itemToDelete, dependentPrograms, deleting
    - Implement handleDeletePress: check built-in source, validate dependencies, show appropriate modal
    - Implement handleConfirmDelete: call deleteExercise/deleteProgram, show success toast, handle errors
    - Implement handleCancelDelete: close modal, clear state
    - Implement handleDismissDependencyError: close error modal, clear state
    - Use haptics: error for built-in/dependencies, warning for confirmation, success for completion
    - Pass onItemDelete={handleDeletePress} to DataList
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.5, 6.1, 6.2_

  - [ ]\* 4.4 Write property tests for delete flow from list view
    - **Property 2: Confirmation Dialog Precedes Deletion**
    - **Property 6: Cancel Preserves Item**
    - **Property 7: Confirm Executes Deletion**
    - **Property 8: Dependency Check Before Exercise Deletion**
    - **Property 10: Dependencies Block Deletion**
    - **Property 11: No Dependencies Allow Deletion**
    - **Property 13: Failed Deletion Preserves Item**
    - **Property 14: Successful List Deletion Removes Item**
    - **Validates: Requirements 1.3, 3.4, 3.5, 4.1, 4.3, 4.4, 5.5, 6.2**
    - Test confirmation flow, cancel behavior, dependency validation, error handling
    - Use fast-check to generate exercises with varying dependency states
    - _Requirements: 1.3, 3.4, 3.5, 4.1, 4.3, 4.4, 5.5, 6.2_

  - [x] 4.5 Add modals to UnifiedDataManager render
    - Add ConfirmationModal with delete state bindings
    - Add DependencyErrorModal with dependency state bindings
    - Position modals at end of component JSX
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.5_

- [-] 5. Add delete functionality to exercise edit screen
  - [x] 5.1 Add delete state and handlers to exercise edit screen
    - Import ConfirmationModal, DependencyErrorModal, DeleteButton, canSafelyDelete
    - Import useDataContext to access exercises and programs for dependency checking
    - Add state: deleteModalVisible, dependencyErrorVisible, dependentPrograms, deleting
    - Implement handleDeletePress: validate dependencies using canSafelyDelete, show appropriate modal
    - Implement handleConfirmDelete: call deleteExercise, navigate back on success, show error toast on failure
    - Use haptics: error for dependencies, warning for confirmation, success for completion
    - _Requirements: 2.1, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.5_

  - [x] 5.2 Add delete button to exercise edit screen layout
    - Add delete section with top border separator
    - Only render when `exercise.source === 'user'`
    - Use DeleteButton text variant with accessibility label
    - Disable button when saving or deleting
    - Show loading state during deletion
    - Position in footer area with proper spacing
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 8.1, 8.3, 9.1, 9.4_

  - [x] 5.3 Add modals to exercise edit screen
    - Add ConfirmationModal with exercise-specific messaging
    - Add DependencyErrorModal for dependency errors
    - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.5_

  - [ ]\* 5.4 Write property tests for exercise edit screen delete
    - **Property 3: Edit Screen Delete Button Visibility**
    - **Property 4: Navigation After Successful Edit Screen Deletion**
    - **Property 15: Success Message Contains Item Details**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 6.4, 6.5**
    - Test button visibility based on source, navigation after deletion, success messaging
    - Use fast-check to generate exercises with different sources
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 6.4, 6.5_

- [x] 6. Add delete functionality to program edit screen
  - [x] 6.1 Add delete state and handlers to program edit screen
    - Import ConfirmationModal, DeleteButton (no DependencyErrorModal needed for programs)
    - Add state: deleteModalVisible, deleting
    - Implement handleDeletePress: show confirmation modal (programs have no dependencies)
    - Implement handleConfirmDelete: call deleteProgram, navigate back on success, show error toast on failure
    - Use haptics: warning for confirmation, success for completion, error for failures
    - _Requirements: 2.1, 2.3, 2.4, 5.1, 5.2, 5.3, 5.5_

  - [x] 6.2 Add delete button to program edit screen layout
    - Add delete section with top border separator
    - Only render when `program.source === 'user'`
    - Use DeleteButton text variant with accessibility label
    - Disable button when saving or deleting
    - Show loading state during deletion
    - Position in footer area with proper spacing
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 8.1, 8.3, 9.1, 9.4_

  - [x] 6.3 Add ConfirmationModal to program edit screen
    - Add ConfirmationModal with program-specific messaging
    - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]\* 6.4 Write property tests for program edit screen delete
    - **Property 3: Edit Screen Delete Button Visibility**
    - **Property 4: Navigation After Successful Edit Screen Deletion**
    - **Property 15: Success Message Contains Item Details**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 6.3, 6.4, 6.5**
    - Test button visibility, navigation, and success messaging for programs
    - Use fast-check to generate programs with different sources
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 6.3, 6.4, 6.5_

- [x] 7. Checkpoint - Verify core delete functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement bulk delete functionality (advanced feature)
  - [x] 8.1 Add bulk delete UI to UnifiedDataManager
    - Add selection toolbar that appears when items are selected
    - Add bulk delete button to toolbar with trash icon and count badge
    - Position toolbar at bottom of screen with safe area insets
    - Style toolbar with surface background and shadow
    - _Requirements: 7.1, 7.7_

  - [x] 8.2 Implement bulk delete handlers
    - Implement handleBulkDeletePress: validate all selected exercises for dependencies
    - Show confirmation modal with count of items to delete
    - If any exercises have dependencies, show error listing blocked items
    - Implement handleConfirmBulkDelete: delete items without dependencies, keep blocked items selected
    - Show success toast with count of deleted items
    - Clear selection after successful deletion
    - Use haptics: warning for confirmation, error for blocked items, success for completion
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]\* 8.3 Write property tests for bulk delete
    - **Property 16: Bulk Delete Button Appears With Selection**
    - **Property 17: Bulk Confirmation Shows Count**
    - **Property 18: Bulk Deletion Validates All Dependencies**
    - **Property 19: Bulk Error Lists Blocked Items**
    - **Property 20: Partial Bulk Deletion**
    - **Property 21: Bulk Success Clears Selection**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**
    - Test bulk selection, validation, partial deletion, and success handling
    - Use fast-check to generate arrays of items with mixed dependency states
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 9. Accessibility and polish
  - [x] 9.1 Verify accessibility compliance
    - Test all delete buttons have minimum 44px × 44px touch targets
    - Verify all interactive elements have descriptive accessibility labels
    - Test confirmation modal focus management (safe action focused by default)
    - Verify modal dismissal with standard gestures
    - Test that error messages are announced to screen readers
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 9.2 Manual testing with assistive technologies
    - Test with iOS VoiceOver: verify delete buttons announced with item names
    - Test with Android TalkBack: verify modal content read in logical order
    - Verify focus moves appropriately when modals open/close
    - Verify error messages announced immediately
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 9.3 Visual consistency review
    - Verify all delete buttons follow icon button styling patterns
    - Verify modals use consistent border radius and spacing
    - Verify destructive action styling is consistent
    - Verify spacing values match design system throughout
    - Verify modal elevation and shadows match other modals
    - Verify button typography matches other action buttons
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 10. Final checkpoint - Complete feature verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check
- All delete operations use existing DataContext actions and backend APIs
- No changes required to DataContext or backend - infrastructure already exists
- Implementation follows bottom-up approach: components → list view → edit screens → bulk operations
- Bulk delete (task 8) is an advanced feature and can be deferred if needed
