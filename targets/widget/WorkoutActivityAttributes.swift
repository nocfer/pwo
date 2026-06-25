import ActivityKit
import Foundation

// ⚠️ KEEP IN SYNC with modules/live-activity/ios/WorkoutActivityAttributes.swift —
// ActivityKit matches a running Activity to this widget by this type's name and
// shape, so the app target and the widget target must declare it identically.
@available(iOS 16.2, *)
public struct WorkoutActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// Epoch seconds when the current rest ends. 0 when not resting.
    public var restEndsAt: Double
    public var isResting: Bool
    public var setNumber: Int
    public var exerciseName: String
    public var weight: Double
    public var reps: Int

    public init(
      restEndsAt: Double,
      isResting: Bool,
      setNumber: Int,
      exerciseName: String,
      weight: Double,
      reps: Int
    ) {
      self.restEndsAt = restEndsAt
      self.isResting = isResting
      self.setNumber = setNumber
      self.exerciseName = exerciseName
      self.weight = weight
      self.reps = reps
    }
  }

  /// Static for the life of the activity.
  public var programName: String

  public init(programName: String) {
    self.programName = programName
  }
}
