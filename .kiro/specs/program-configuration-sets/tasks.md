# Implementation Plan: Program Configuration with Sets and Rest Timers

## Overview

This implementation plan breaks down the feature into discrete coding tasks that build incrementally. Each task extends the previous work, starting with type definitions, then form updates, then execution logic, and finally testing.

## Tasks

- [x] 1. Extend Program Type Definitions
  - Add `initialWarmup` field to Program type
  - Add `defaultRestBetweenExercises` field to Program type
  - Add `sets` and `restBetweenSets` fields to ProgramExerciseBlock type
  - Update type exports in types/index.ts
  - _Requirements: 3.1, 3.2, 6.1, 6.2, 6.3_

- [x] 2. Update ProgramForm Component - Initial Warmup Support
  - Add state for warmup configuration toggle
  - Add button to activate/deactivate warmup configuration
  - Display warmup configuration section when activated
  - Allow editing warmup duration
  - _Requirements: 1.1, 1.2_

- [x] 3. Update ProgramForm Component - Default Rest Timer Support
  - Add state for default rest timer configuration
  - Add button/menu to activate rest configuration
  - Display default rest timer input when activated
  - Allow editing default rest duration
  - _Requirements: 2.1_

- [x] 4. Update ProgramForm Component - Exercise Block Extensions
  - Add "Sets" field to exercise blocks (default: 1)
  - Add "Rest Between Sets" field to exercise blocks (default: 60)
  - Display both fields in exercise block configuration
  - Validate numeric inputs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Update ProgramForm Component - Validation and Defaults
  - Implement validation for sets (positive integer)
  - Implement validation for rest durations (non-negative)
  - Apply sensible defaults when creating new blocks
  - Apply sensible defaults when creating new programs
  - _Requirements: 3.3, 3.4, 7.1, 7.2, 7.3, 7.4_

- [x] 6. Extend useWorkoutSteps Hook - Block Expansion Logic
  - Implement block expansion algorithm
  - For each exercise block with sets > 1, create multiple steps
  - Insert rest blocks between consecutive sets
  - Insert rest blocks between different exercises
  - Apply default rest timer between exercises
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Update WorkoutStep Type - Set Information
  - Add `setNumber` field to exercise steps
  - Add `totalSets` field to exercise steps
  - Add `restContext` field to rest steps
  - Update step generation to include this information
  - _Requirements: 4.4, 4.5, 4.6_

- [x] 8. Update ProgramSessionView Component - Display Set Information
  - Display set numbers in exercise blocks (e.g., "Set 1 of 3")
  - Display rest context in rest blocks (between sets or between exercises)
  - Apply distinct styling for warmup blocks
  - _Requirements: 1.3, 1.5, 4.4, 4.5, 4.6, 5.4, 5.5_

- [x] 9. Update Program Execution Display - Warmup Styling
  - Apply warmup-specific color to warmup blocks
  - Display warmup label (e.g., "Warmup - 5 minutes")
  - Ensure warmup appears first in execution
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 10. Update Data Persistence - Storage Integration
  - Update storage layer to persist new fields
  - Ensure new fields are included in serialization
  - Test loading programs with new fields
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Checkpoint - Ensure all code compiles
  - Run `npm run compile` and fix all TypeScript errors
  - Run `npm run lint:fix` to fix linting issues
  - Verify no type errors remain

- [ ] 12. Write Property Tests - Block Expansion
  - **Property 1: Block Expansion Completeness**
  - **Validates: Requirements 4.1, 4.2, 4.3**
  - Generate random programs with various set configurations
  - Verify expanded steps include all sets and rest periods
  - Verify step count is correct

- [ ]* 12.1 Write Property Tests - Set Numbering
  - **Property 2: Set Numbering Accuracy**
  - **Validates: Requirements 4.4**
  - Generate random exercise blocks with 1-10 sets
  - Verify set numbers are sequential from 1 to N
  - Verify each set is labeled correctly

- [ ]* 12.2 Write Property Tests - Rest Period Insertion
  - **Property 3: Rest Period Insertion**
  - **Validates: Requirements 4.2, 4.3, 4.5, 4.6**
  - Generate random programs with various rest configurations
  - Verify rest blocks appear between consecutive sets
  - Verify rest blocks appear between different exercises
  - Verify rest durations match configuration

- [ ]* 12.3 Write Property Tests - Default Rest Application
  - **Property 4: Default Rest Application**
  - **Validates: Requirements 2.2, 2.3, 2.4**
  - Generate programs with default rest timer set
  - Verify all exercise transitions use default rest
  - Verify explicit rest overrides default

- [ ]* 12.4 Write Property Tests - Warmup Display
  - **Property 5: Warmup Display Distinctness**
  - **Validates: Requirements 1.3, 1.5**
  - Generate programs with and without warmup
  - Verify warmup appears first when configured
  - Verify warmup has distinct visual styling

- [ ]* 12.5 Write Property Tests - Configuration Persistence
  - **Property 6: Configuration Persistence Round Trip**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  - Generate random program configurations
  - Save and load programs
  - Verify all configuration values match original

- [ ]* 12.6 Write Property Tests - Sensible Defaults
  - **Property 7: Sensible Defaults Application**
  - **Validates: Requirements 7.1, 7.2**
  - Create new exercise blocks without explicit configuration
  - Verify defaults are applied (1 set, 60 sec rest)

- [ ]* 12.7 Write Property Tests - Default Rest Timer
  - **Property 8: Default Rest Timer Application**
  - **Validates: Requirements 7.3**
  - Create new programs without explicit default rest
  - Verify default is applied (60 seconds)

- [ ] 13. Write Unit Tests - ProgramForm Component
  - Test adding/removing exercise blocks
  - Test updating sets and rest between sets values
  - Test toggling warmup configuration
  - Test toggling rest configuration
  - Test validation of numeric inputs
  - Test default values are applied correctly
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3_

- [ ]* 13.1 Write Unit Tests - useWorkoutSteps Hook
  - Test block expansion with various set configurations
  - Test rest period insertion between sets
  - Test rest period insertion between exercises
  - Test default rest timer application
  - Test warmup block handling
  - Test edge cases (single set, zero rest, etc.)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 13.2 Write Unit Tests - Data Persistence
  - Test saving program with new configuration fields
  - Test loading program preserves all values
  - Test export/import includes new fields
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14. Integration Test - Complete Program Creation Flow
  - Test creating program with warmup
  - Test creating program with default rest timer
  - Test creating program with exercise blocks (sets and rest)
  - Test executing program with expanded blocks
  - Test navigation between creation and execution
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 15. Final Checkpoint - Ensure all tests pass
  - Run `npm run test:run` and verify all tests pass
  - Run `npm run compile` and verify no errors
  - Run `npm run lint:fix` and verify no linting issues
  - Verify property tests run with minimum 100 iterations

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All styling should follow the design rules steering document
- Reuse existing components and patterns where possible
- Prioritize user comfort and ease of use in UX decisions
