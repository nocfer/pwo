# Requirements Document: Program Configuration with Sets and Rest Timers

## Introduction

This feature extends program configuration to support more granular control over workout structure. Users can now define initial warmups as visually distinct blocks, set global default rest timers between exercises, and configure per-exercise set counts with individual rest periods between sets. This enables more flexible and realistic workout program design.

## Glossary

- **Program**: A structured workout plan with multiple sessions containing exercise blocks, rest periods, and warmups
- **Exercise_Block**: An individual exercise within a program session with duration, sets, and rest configuration
- **Initial_Warmup**: A special first block that prepares the body before the main workout (visually distinct)
- **Default_Rest_Timer**: A global setting that applies between different exercises (not within sets)
- **Sets**: The number of repetitions of an exercise block (e.g., "3 sets")
- **Rest_Between_Sets**: The duration to rest between consecutive sets of the same exercise
- **Rest_Between_Exercises**: The duration to rest between different exercises (uses Default_Rest_Timer if not specified)
- **Program_Execution_Screen**: The interface where users view and navigate through a program's workout blocks
- **Block_Expansion**: The process of converting a single exercise block into multiple blocks (one per set) with rest periods

## Requirements

### Requirement 1: Initial Warmup Configuration

**User Story:** As a program creator, I want to optionally add an initial warmup block that is visually distinct from exercise blocks, so that users understand it's a preparation phase before the main workout.

#### Acceptance Criteria

1. WHEN creating or editing a program, THE Program_Form SHALL provide an option to add an Initial_Warmup via an existing button (not a separate dedicated field)
2. WHEN a user activates the Initial_Warmup option, THE Program_Form SHALL display it as a distinct section at the top of the program configuration
3. WHEN an Initial_Warmup is configured, THE Program_Execution_Screen SHALL display it as the first block with distinct visual styling (warmup-specific color)
4. WHEN a program has no Initial_Warmup, THE Program_Execution_Screen SHALL begin directly with the first exercise block
5. WHEN displaying the Initial_Warmup in execution, THE System SHALL show it with a warmup-specific color and label (e.g., "Warmup - 5 minutes")

### Requirement 2: Default Rest Timer Configuration

**User Story:** As a program creator, I want to set a global default rest timer between exercises, so that I don't have to manually configure rest periods for every exercise transition.

#### Acceptance Criteria

1. WHEN creating or editing a program, THE Program_Form SHALL provide an option to configure "Default Rest Between Exercises" via an additional option (e.g., triggered by a rest button or menu)
2. WHEN a Default_Rest_Timer is configured, THE System SHALL apply it between all exercise blocks unless overridden
3. WHEN an exercise block does not have an explicit rest period configured, THE System SHALL use the Default_Rest_Timer
4. WHEN displaying the program execution, THE Program_Execution_Screen SHALL show rest blocks using the Default_Rest_Timer duration
5. WHEN a Default_Rest_Timer is not configured, THE System SHALL treat it as zero (no rest between exercises)

### Requirement 3: Sets and Rest Between Sets Configuration

**User Story:** As a program creator, I want to configure the number of sets for each exercise and the rest period between sets, so that I can create realistic multi-set workout programs.

#### Acceptance Criteria

1. WHEN creating or editing an exercise block in a program, THE Program_Form SHALL provide a "Sets" field (e.g., "3 sets")
2. WHEN creating or editing an exercise block in a program, THE Program_Form SHALL provide a "Rest Between Sets" field (e.g., "60 seconds")
3. WHEN a Sets value is configured, THE System SHALL validate that it is a positive integer
4. WHEN a Rest_Between_Sets value is configured, THE System SHALL validate that it is a valid duration
5. WHEN displaying program configuration, THE Program_Form SHALL show both Sets and Rest_Between_Sets for each exercise block

### Requirement 4: Program Execution Block Expansion

**User Story:** As a user executing a program, I want to see the expanded workout structure with individual sets and rest periods clearly displayed, so that I understand exactly what to do at each step.

#### Acceptance Criteria

1. WHEN a program is executed, THE Program_Execution_Screen SHALL expand each exercise block into multiple blocks (one per set)
2. WHEN expanding exercise blocks, THE System SHALL insert rest blocks between consecutive sets using the Rest_Between_Sets duration
3. WHEN expanding exercise blocks, THE System SHALL insert rest blocks between different exercises using the Rest_Between_Exercises duration (or Default_Rest_Timer)
4. WHEN displaying an expanded set, THE Program_Execution_Screen SHALL show the set number (e.g., "Set 1 of 3")
5. WHEN displaying a rest block between sets, THE Program_Execution_Screen SHALL show it as a distinct rest block with the duration
6. WHEN displaying a rest block between exercises, THE Program_Execution_Screen SHALL show it as a distinct rest block with the duration and label it as "between exercises"

### Requirement 5: Program Execution Display

**User Story:** As a user, I want to see the complete expanded workout structure during execution, so that I can follow the program step-by-step without confusion.

#### Acceptance Criteria

1. WHEN a program is displayed in execution, THE Program_Execution_Screen SHALL show all blocks in sequence (warmup, exercises with sets, rest periods)
2. WHEN a block is completed, THE Program_Execution_Screen SHALL mark it as done and move to the next block
3. WHEN all blocks are completed, THE Program_Execution_Screen SHALL display a completion message (e.g., "Workout Complete! 🎉")
4. WHEN displaying exercise blocks, THE System SHALL show the exercise name, duration/reps, and set information
5. WHEN displaying rest blocks, THE System SHALL show the rest duration and context (between sets or between exercises)

### Requirement 6: Data Persistence

**User Story:** As a program creator, I want my program configuration (warmup, default rest, sets, and rest between sets) to be saved and loaded correctly, so that my programs are preserved across sessions.

#### Acceptance Criteria

1. WHEN a program is saved, THE System SHALL persist the Initial_Warmup configuration
2. WHEN a program is saved, THE System SHALL persist the Default_Rest_Timer configuration
3. WHEN a program is saved, THE System SHALL persist the Sets and Rest_Between_Sets for each exercise block
4. WHEN a program is loaded, THE System SHALL restore all configuration values correctly
5. WHEN a program is exported or imported, THE System SHALL include all new configuration fields in the serialized format

### Requirement 7: Sensible Defaults

**User Story:** As a program creator, I want reasonable default values for sets and rest periods, so that I can create programs quickly without configuring every detail.

#### Acceptance Criteria

1. WHEN creating a new exercise block, THE System SHALL default Sets to 1 (single set)
2. WHEN creating a new exercise block, THE System SHALL default Rest_Between_Sets to 60 seconds
3. WHEN creating a new program, THE System SHALL default Default_Rest_Timer to 60 seconds (between exercises)
4. WHEN creating a new program, THE System SHALL default Initial_Warmup to not configured (optional)
5. WHEN a user modifies any default value, THE System SHALL allow them to override it for that specific block or program
