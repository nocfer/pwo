import AppIntents
import Foundation

// Shared App Group — the widget's interactive buttons can't touch the RN
// reducer directly, so they record a pending action here. The app drains it on
// next foreground (LiveActivityModule.consumePendingAction) and dispatches the
// real EXTEND_REST / DISMISS_REST_TIMER, keeping the reducer the source of truth.
let kAppGroup = "group.com.anonymous.progressiveworkout"
let kPendingRestActionKey = "pendingRestAction"

func recordPendingRestAction(_ action: String) {
  guard let defaults = UserDefaults(suiteName: kAppGroup) else { return }
  defaults.set(action, forKey: kPendingRestActionKey)
}

@available(iOS 17.0, *)
struct ExtendRestIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Add 15 seconds"

  func perform() async throws -> some IntentResult {
    recordPendingRestAction("extend")
    return .result()
  }
}

@available(iOS 17.0, *)
struct SkipRestIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Skip rest"

  func perform() async throws -> some IntentResult {
    recordPendingRestAction("skip")
    return .result()
  }
}
