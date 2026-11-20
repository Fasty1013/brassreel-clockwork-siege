import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Android app (APK) around the web build in dist/.
 *   npm run build && npx cap sync android     — copy the game into android/
 *   cd android && ./gradlew assembleDebug     — build the APK (needs JDK 21 + Android SDK)
 * GitHub Actions does both on every push to main (.github/workflows/android.yml).
 */
const config: CapacitorConfig = {
  appId: 'com.brassreel.clockworksiege',
  appName: 'BRASSREEL',
  webDir: 'dist',
  backgroundColor: '#0b0907',
  android: {
    // the game is a single offline page: no mixed content, no remote debugging in release
    allowMixedContent: false,
    webContentsDebuggingEnabled: false
  }
};

export default config;
