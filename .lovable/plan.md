

## Fix: High Severity Vulnerability in `vite-plugin-pwa`

### The Problem
The security scan flags `vite-plugin-pwa` at version `0.19.8` as having a high severity vulnerability. The latest version is `1.2.0`.

### The Challenge
- `vite-plugin-pwa` v1.0.0+ requires **Vite 6 or higher**
- The project currently uses **Vite 5** (`^5.4.19`)
- Upgrading Vite from 5 to 6 is a breaking change that may affect other plugins (like `lovable-tagger`, `vitest`, etc.)

### Plan

**Step 1: Upgrade Vite to v6**
- Update `vite` from `^5.4.19` to `^6.x` in `package.json`
- Check and update any Vite 6-incompatible plugins or config

**Step 2: Upgrade `vite-plugin-pwa` to v1.2.0**
- Update from `0.19.8` to `^1.2.0` in `package.json`

**Step 3: Verify `vite.config.ts`**
- Ensure PWA config is compatible with the new plugin version (API is mostly the same)
- Verify `workbox` options still work (v1.0.0 updated workbox to 7.3)

**Step 4: Test the build**
- Ensure no build errors after the upgrades

### Risk
Vite 5 → 6 is a major version bump. If other dependencies break, we may need to update them too. If the upgrade proves too risky, the alternative is to mark this finding as "ignored" since it's a dev dependency that doesn't directly affect production security.

