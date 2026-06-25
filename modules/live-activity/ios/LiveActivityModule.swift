import ActivityKit
import ExpoModulesCore
import Foundation

// JS-facing record mirroring LiveActivityContent in modules/live-activity/index.ts.
struct LiveActivityContentRecord: Record {
  @Field var programName: String = ""
  @Field var isResting: Bool = false
  /// Epoch milliseconds when rest ends (matches JS Date.now() units).
  @Field var restEndsAtMs: Double = 0
  /// Epoch milliseconds the workout started (Android in-progress chronometer; unused on iOS).
  @Field var startedAtMs: Double = 0
  @Field var setNumber: Int = 1
  @Field var exerciseName: String = ""
  @Field var weight: Double = 0
  @Field var reps: Int = 0
}

public class LiveActivityModule: Module {
  // Tracks the single in-flight activity so update/end target the right one.
  private var currentActivityId: String?

  public func definition() -> ModuleDefinition {
    Name("LiveActivityModule")

    Function("startActivity") { (content: LiveActivityContentRecord) -> String? in
      guard #available(iOS 16.2, *) else { return nil }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return nil }
      // One activity at a time — reuse via update if one is already live.
      if self.currentActivityId != nil {
        self.applyUpdate(content)
        return self.currentActivityId
      }

      let attributes = WorkoutActivityAttributes(programName: content.programName)
      let state = self.makeState(content)
      do {
        let activity = try Activity.request(
          attributes: attributes,
          content: .init(state: state, staleDate: nil)
        )
        self.currentActivityId = activity.id
        return activity.id
      } catch {
        return nil
      }
    }

    Function("updateActivity") { (content: LiveActivityContentRecord) in
      self.applyUpdate(content)
    }

    Function("endActivity") {
      guard #available(iOS 16.2, *) else { return }
      Task {
        for activity in Activity<WorkoutActivityAttributes>.activities {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
        self.currentActivityId = nil
      }
    }

    // Drains the pending action recorded by the widget's +15s / Skip App Intents
    // (see targets/widget/RestActionsIntent.swift). Returns "extend" | "skip" |
    // nil; the JS side dispatches the corresponding reducer action.
    Function("consumePendingAction") { () -> String? in
      let group = "group.com.anonymous.progressiveworkout"
      let key = "pendingRestAction"
      guard let defaults = UserDefaults(suiteName: group),
            let action = defaults.string(forKey: key)
      else {
        return nil
      }
      defaults.removeObject(forKey: key)
      return action
    }
  }

  @available(iOS 16.2, *)
  private func makeState(
    _ content: LiveActivityContentRecord
  ) -> WorkoutActivityAttributes.ContentState {
    WorkoutActivityAttributes.ContentState(
      restEndsAt: content.restEndsAtMs / 1000.0,
      isResting: content.isResting,
      setNumber: content.setNumber,
      exerciseName: content.exerciseName,
      weight: content.weight,
      reps: content.reps
    )
  }

  private func applyUpdate(_ content: LiveActivityContentRecord) {
    guard #available(iOS 16.2, *) else { return }
    let state = self.makeState(content)
    Task {
      for activity in Activity<WorkoutActivityAttributes>.activities {
        await activity.update(.init(state: state, staleDate: nil))
      }
    }
  }
}
