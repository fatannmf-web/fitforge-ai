import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fitforgeai.app",
  appName: "FitForge AI",
  webDir: "dist/client",
  bundledWebRuntime: false,

  server: {
    // În development poți pune URL-ul Replit/Railway
    // url: "https://fitforge-ai.com",
    // cleartext: true,
  },

  plugins: {
    // Push Notifications
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    // Status bar styling
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0a",
    },
    // Splash screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // Keyboard behavior
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    // Local Notifications
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#22c55e",
      sound: "beep.wav",
    },
  },

  // iOS specific
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    backgroundColor: "#0a0a0a",
    allowsLinkPreview: false,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
  },

  // Android specific
  android: {
    backgroundColor: "#0a0a0a",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
