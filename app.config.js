module.exports = {
  expo: {
    name: "Itchy",
    slug: "itchy-native",
    version: "2.7.9",
    scheme: "itchy",
    newArchEnabled: true,
    orientation: "portrait",
    plugins: [
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics",
      "./plugins/withFirebaseStaticFrameworkFix.js",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            reactNativeReleaseLevel: "experimental",
            deploymentTarget: "15.1",
          },
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            kotlinVersion: "2.2.20",
            reactNativeReleaseLevel: "experimental",
          },
        },
      ],
      "expo-router",
      "react-native-bottom-tabs",
      [
        "expo-asset",
        {
          assets: [
            "assets/icons/search_24_black.png",
            "assets/icons/search_24_white.png"
          ],
        },
      ],
      [
        "react-native-edge-to-edge",
        {
          android: {
            parentTheme: "Material3",
            enforceNavigationBarContrast: false,
          },
        },
      ],
      [
        "expo-font",
        {
          fonts: [
            "./node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf",
            "./node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf",
            "./node_modules/@expo-google-fonts/inter/900Black/Inter_900Black.ttf",
          ],
        },
      ],
      ["expo-gradle-jvmargs", { "xmx": "4g", "maxMetaspace": "1024m" }]
    ],
    splash: {
      image: "./assets/splash.png",
      backgroundColor: "#0082FF",
    },
    userInterfaceStyle: "automatic",
    android: {
      versionCode: 77,
      package: "org.scratchclient4.itchy",
      adaptiveIcon: {
        backgroundColor: "#0082FF",
        foregroundImage: "./assets/icon-foreground.png",
        monochromeImage: "./assets/icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      permissions: [
        'android.permission.VIBRATE',
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.MICROPHONE',
        'android.permission.MODIFY_AUDIO_SETTINGS',
      ]
    },
    ios: {
      bundleIdentifier: "org.scratchclient4.itchy",
      buildNumber: "77",
      icon: "./assets/iosicon.icon",
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        NSCameraUsageDescription:
          "Itchy needs access to the camera to support projects that include camera features.",
        NSMicrophoneUsageDescription:
          "Itchy needs access to your microphone to support projects that include audio features.",
        ITSAppUsesNonExemptEncryption: false
      },
      googleServicesFile:
        process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist",
    },
    extra: {
      router: {},
      eas: {
        projectId: "e49aa4db-4fa4-4ccc-a105-1a16aa4084e4",
      },
    },
    owner: "itchy-team",
  },
};
