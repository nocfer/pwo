/**
 * Widget extension target for the workout Live Activity / Dynamic Island.
 * Consumed by @bacons/apple-targets at prebuild — generates the Xcode target
 * from the Swift files in this directory.
 *
 * The App Group is only included when PWO_APP_GROUP=1 (simulator builds). A
 * free Apple ID can't sign it on-device, so device builds omit it — the widget
 * still renders; the +15s / Skip App Intents become no-ops (their
 * UserDefaults(suiteName:) calls return nil and bail). See app.config.js.
 *
 * @type {import('@bacons/apple-targets/app.plugin').Config}
 */
const withAppGroup = process.env.PWO_APP_GROUP === '1';

module.exports = {
  type: 'widget',
  name: 'WorkoutWidget',
  deploymentTarget: '16.2',
  ...(withAppGroup
    ? {
        entitlements: {
          'com.apple.security.application-groups': [
            'group.com.anonymous.progressiveworkout',
          ],
        },
      }
    : {}),
};
