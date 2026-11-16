---
name: Android SDK setup
description: Compatibility guidance for Android SDK setup in the APK workflow.
---

For `android-actions/setup-android@v3`, set `packages: ''` when no additional SDK packages are needed. Its default package list includes `tools`, which current Android SDK repositories no longer provide; leaving the default causes `sdkmanager` to fail with “Failed to find package 'tools'.”

The APK workflow generates the Android project during CI rather than keeping a Gradle project checked in. Avoid enabling Gradle dependency caching before the Gradle wrapper exists. This workspace also installs pnpm without a lockfile, so do not enable setup-node pnpm caching without adding a lockfile.

**Why:** Recent CI runs exposed multiple setup steps that assumed files or SDK packages removed from the current runner environment.

**How to apply:** Keep CI setup limited to tools available before Expo prebuild; add caches only after their required files are generated or checked in.
