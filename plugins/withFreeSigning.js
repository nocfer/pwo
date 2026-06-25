/**
 * Strips entitlements a FREE Apple ID (personal team) cannot sign, so device
 * builds with free signing succeed. Runs at prebuild after expo-notifications
 * injects its push entitlement.
 *
 * Currently removes:
 *   - aps-environment (Push Notifications) — local notifications still work.
 *
 * Skipped entirely when PWO_APP_GROUP=1 (simulator builds), where the
 * simulator doesn't validate entitlements and full-fidelity is desirable.
 *
 * Remove this plugin from app.config.js before a paid-account / production
 * build so push is restored.
 */
const { withEntitlementsPlist } = require('@expo/config-plugins');

module.exports = function withFreeSigning(config) {
  if (process.env.PWO_APP_GROUP === '1') return config;

  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
