# Product Overview

Progressive Workout is a React Native fitness application built with Expo that helps users track and complete workout programs.

## Core Features

- **Program Management**: Create, edit, and run structured workout programs with exercise blocks, rest periods, and warmups
- **Exercise Library**: Built-in and user-created exercises with categories and icons
- **Progress Tracking**: Personal records (PRs), consistency heatmaps, exercise progression charts, and weekly statistics
- **Workout Management**: Real-time workout sessions with timers, set completion tracking, and state persistence
- **Data Import/Export**: QR code sharing and program import functionality

## User Flow

1. Users select from built-in programs or create custom ones
2. Programs consist of exercise blocks, rest periods, and warmups
3. During workouts, users complete sets with rep tracking and timing
4. Progress is automatically tracked with PR detection and analytics

## Data Model

The app manages three primary data types:

- **Exercises**: Individual movements with categories and metadata
- **Programs**: Structured workout plans with exercise blocks
- **Progress**: Historical data, PRs, and completion tracking

Built-in content is read-only while user-created content supports full CRUD operations.
