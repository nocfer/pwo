import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Theme tokens (mirror theme.colors.session)

extension Color {
  init(hex: UInt32) {
    self.init(
      .sRGB,
      red: Double((hex >> 16) & 0xff) / 255,
      green: Double((hex >> 8) & 0xff) / 255,
      blue: Double(hex & 0xff) / 255,
      opacity: 1
    )
  }
  static let pwoCyan = Color(hex: 0x56E0F0)
  static let pwoRingTrack = Color(hex: 0x1A1E24)
  static let pwoLime = Color(hex: 0xC6F24E)
  static let pwoText = Color(hex: 0xF2F3F5)
  static let pwoSubtext = Color(hex: 0x9A9DAB)
  static let pwoPanel = Color(hex: 0x0C1416)
}

// MARK: - Shared bits

@available(iOS 16.2, *)
private func restEndDate(_ state: WorkoutActivityAttributes.ContentState) -> Date {
  Date(timeIntervalSince1970: state.restEndsAt)
}

@available(iOS 16.2, *)
private struct CountdownText: View {
  let state: WorkoutActivityAttributes.ContentState
  var font: Font = .system(size: 30, weight: .semibold, design: .rounded)

  var body: some View {
    // Ticks every second on-device with no push — the core of the spec.
    Text(timerInterval: Date()...restEndDate(state), countsDown: true)
      .font(font)
      .monospacedDigit()
      .foregroundStyle(Color.pwoCyan)
      .multilineTextAlignment(.center)
  }
}

@available(iOS 16.2, *)
private struct RestRing: View {
  let state: WorkoutActivityAttributes.ContentState
  var size: CGFloat = 64

  var body: some View {
    ZStack {
      Circle()
        .stroke(Color.pwoRingTrack, lineWidth: size * 0.11)
      // Snapshot fraction at push time; the number below ticks continuously.
      ProgressView(
        timerInterval: Date()...restEndDate(state),
        countsDown: true
      ) { EmptyView() } currentValueLabel: { EmptyView() }
        .progressViewStyle(.circular)
        .tint(Color.pwoCyan)
        .labelsHidden()
    }
    .frame(width: size, height: size)
  }
}

// MARK: - Lock screen / banner

@available(iOS 16.2, *)
struct LockScreenLiveActivityView: View {
  let context: ActivityViewContext<WorkoutActivityAttributes>

  var body: some View {
    Group {
      if context.state.isResting {
        restingBody(context.state)
      } else {
        inProgressBody(context.state)
      }
    }
    .padding(16)
    .activityBackgroundTint(Color.pwoPanel.opacity(0.82))
    .activitySystemActionForegroundColor(
      context.state.isResting ? Color.pwoCyan : Color.pwoLime
    )
  }

  @ViewBuilder
  private func restingBody(
    _ state: WorkoutActivityAttributes.ContentState
  ) -> some View {
    HStack(spacing: 16) {
      ZStack {
        RestRing(state: state, size: 64)
        CountdownText(
          state: state,
          font: .system(size: 17, weight: .semibold, design: .rounded)
        )
      }

      VStack(alignment: .leading, spacing: 3) {
        Text("PWO · \(context.attributes.programName)")
          .font(.system(size: 11, weight: .semibold))
          .foregroundStyle(Color.pwoSubtext)
        Text("RESTING")
          .font(.system(size: 10, weight: .bold))
          .tracking(1.4)
          .foregroundStyle(Color.pwoCyan)
        Text("Next · Set \(state.setNumber)")
          .font(.system(size: 15, weight: .semibold))
          .foregroundStyle(Color.pwoText)
        Text("\(state.exerciseName) · \(Int(state.weight)) lb × \(state.reps)")
          .font(.system(size: 12))
          .foregroundStyle(Color.pwoSubtext)
          .lineLimit(1)
      }

      Spacer(minLength: 0)

      if #available(iOS 17.0, *) {
        VStack(spacing: 8) {
          Button(intent: ExtendRestIntent()) {
            Text("+15s").font(.system(size: 13, weight: .semibold))
          }
          .tint(Color.pwoCyan)
          Button(intent: SkipRestIntent()) {
            Text("Skip").font(.system(size: 13, weight: .semibold))
          }
          .tint(Color.pwoSubtext)
        }
        .buttonStyle(.bordered)
      }
    }
  }

  @ViewBuilder
  private func inProgressBody(
    _ state: WorkoutActivityAttributes.ContentState
  ) -> some View {
    HStack(spacing: 16) {
      Image(systemName: "figure.strengthtraining.traditional")
        .font(.system(size: 26))
        .foregroundStyle(Color.pwoLime)

      VStack(alignment: .leading, spacing: 3) {
        Text("PWO · \(context.attributes.programName)")
          .font(.system(size: 11, weight: .semibold))
          .foregroundStyle(Color.pwoSubtext)
        Text("IN PROGRESS")
          .font(.system(size: 10, weight: .bold))
          .tracking(1.4)
          .foregroundStyle(Color.pwoLime)
        Text("Set \(state.setNumber) · \(state.exerciseName)")
          .font(.system(size: 15, weight: .semibold))
          .foregroundStyle(Color.pwoText)
          .lineLimit(1)
      }

      Spacer(minLength: 0)
    }
  }
}

// MARK: - Widget (lock screen + Dynamic Island)

@available(iOS 16.2, *)
struct WorkoutLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
      LockScreenLiveActivityView(context: context)
    } dynamicIsland: { context in
      let state = context.state
      let resting = state.isResting
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          if resting {
            RestRing(state: state, size: 48)
          } else {
            Image(systemName: "figure.strengthtraining.traditional")
              .font(.system(size: 22))
              .foregroundStyle(Color.pwoLime)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          if resting, #available(iOS 17.0, *) {
            Button(intent: ExtendRestIntent()) {
              Image(systemName: "goforward.15")
            }
            .tint(Color.pwoCyan)
            .buttonStyle(.bordered)
          }
        }
        DynamicIslandExpandedRegion(.center) {
          VStack(spacing: 2) {
            if resting {
              CountdownText(
                state: state,
                font: .system(size: 22, weight: .semibold, design: .rounded)
              )
              Text("RESTING")
                .font(.system(size: 9, weight: .bold))
                .tracking(1.2)
                .foregroundStyle(Color.pwoCyan)
            } else {
              Text("IN PROGRESS")
                .font(.system(size: 11, weight: .bold))
                .tracking(1.2)
                .foregroundStyle(Color.pwoLime)
            }
          }
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text("Set \(state.setNumber) · \(state.exerciseName)")
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(Color.pwoSubtext)
            .lineLimit(1)
        }
      } compactLeading: {
        Image(systemName: resting ? "timer" : "figure.strengthtraining.traditional")
          .foregroundStyle(resting ? Color.pwoCyan : Color.pwoLime)
      } compactTrailing: {
        if resting {
          CountdownText(
            state: state,
            font: .system(size: 13, weight: .semibold, design: .rounded)
          )
          .frame(maxWidth: 44)
        }
      } minimal: {
        Image(systemName: resting ? "timer" : "figure.strengthtraining.traditional")
          .foregroundStyle(resting ? Color.pwoCyan : Color.pwoLime)
      }
      .keylineTint(resting ? Color.pwoCyan : Color.pwoLime)
    }
  }
}

// MARK: - Bundle entry point

@main
struct WorkoutWidgetBundle: WidgetBundle {
  var body: some Widget {
    if #available(iOS 16.2, *) {
      WorkoutLiveActivityWidget()
    }
  }
}
