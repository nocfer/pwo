/**
 * Dynamic Expo config that layers on top of the static app.json.
 *
 * app.json stays the source of truth for everything; this file only adds the
 * App Group entitlement back when PWO_APP_GROUP=1 is set in the environment.
 *
 * Why: a FREE Apple ID (personal team) cannot sign App Groups, so device
 * builds must omit it. The iOS Simulator does NOT validate provisioning
 * entitlements, so there the App Group works and the Live Activity widget's
 * +15s / Skip App Intents function end-to-end.
 *
 *   Device (free signing):   npx expo run:ios --device
 *   Simulator (full widget): PWO_APP_GROUP=1 npx expo run:ios
 *
 * The App Group id must stay in sync with the hardcoded suiteName in
 * modules/live-activity/ios/LiveActivityModule.swift and
 * targets/widget/RestActionsIntent.swift.
 */
const base = require('./app.json');

const APP_GROUP = 'group.com.anonymous.progressiveworkout';
const withAppGroup = process.env.PWO_APP_GROUP === '1';

module.exports = () => {
  const expo = { ...base.expo };

  // Free personal team id — lets @bacons/apple-targets sign the widget
  // extension at prebuild (otherwise "missing ios.appleTeamId" warning and the
  // widget target builds without a team). Override via APPLE_TEAM_ID if needed.
  expo.ios = { ...expo.ios, appleTeamId: process.env.APPLE_TEAM_ID ?? '7E7EER6C2U' };

  if (withAppGroup) {
    expo.ios = {
      ...expo.ios,
      entitlements: {
        ...(expo.ios?.entitlements ?? {}),
        'com.apple.security.application-groups': [APP_GROUP],
      },
    };
  }

  // Strip the push entitlement (added by expo-notifications) for free signing.
  // No-op when PWO_APP_GROUP=1 (simulator); see plugins/withFreeSigning.js.
  expo.plugins = [...(expo.plugins ?? []), './plugins/withFreeSigning'];

  return { expo };
};
