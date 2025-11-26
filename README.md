![](https://raw.githubusercontent.com/micahlt/itchy-native/refs/heads/master/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.webp)

# Itchy Native

[![React Native CI/CD](https://github.com/micahlt/itchy-native/actions/workflows/react-native-ci-cd.yaml/badge.svg)](https://github.com/micahlt/itchy-native/actions/workflows/react-native-ci-cd.yaml)

Itchy Native is a mobile app that acts as a client for the [Scratch](https://scratch.mit.edu) website.  It is the next-gen React Native rewrite of the original [Itchy Ionic](https://github.com/scratch-client-4/itchy-ionic) app created in 2021.

## Installation

You can install one of the CI-generated APK files from the [releases page](https://github.com/micahlt/itchy-native/releases) or you can install the app from the platforms' respective app stores below.

[<img height="50" width="180" src="https://itchy.micahlindley.com/assets/google_play.svg" />](https://play.google.com/store/apps/details?id=org.scratchclient4.itchy)
[<img height="50" width="180" src="https://itchy.micahlindley.com/assets/app_store.svg" />](https://apps.apple.com/us/app/itchy-for-scratch/id6743445859)

## Development

### Android

1. Clone the repository and run `npm install`.
2. Set up your environment according to the [Expo Android docs](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated&mode=development-build&buildEnv=local).
3. If are on Windows, due to path limits you should map the repository to a drive letter and work from there: `subst I: "C:\Users\myuser\repos\itchy-native"`
4. In the `android` directory, create a new file called `key.properties`.  Inside of it, place information about your signing keystore in this format:

```ini
storePassword=[keystore password]
keyPassword=[key password]
keyAlias=[key alias]
storeFile=[path to your keystore]
```

5. Prebuild the project with `npx expo prebuild`.
6. Run `npm run android` to run the on an emulator or device.

### iOS

1. Clone the repository and run `npm install`.
2. Set up your environment according to the [Expo iOS docs](https://docs.expo.dev/get-started/set-up-your-environment/?platform=ios&device=simulated&mode=development-build&buildEnv=local).
3. Install Ruby version 2.7.2 according to the [Ruby docs](https://www.ruby-lang.org/en/documentation/installation/#rbenv) if it's not already on your Mac.
4. Install Cocoapods with `sudo gem install cocoapods` and resolve any errors that may occur.
5. Prebuild the project with `npx expo prebuild`.
6. Run `npx expo run:ios` to run the on the XCode simulator or your device.

## Building

### Android

1. Go into the `android` directory with `cd android`.
2. Run `./gradlew assembleRelease` for an APK output or `./gradlew bundleRelease` for an Android App Bundle output.

### iOS through Xcode

1. Run `./utils/rebuild-ios.sh` in the root directory.
2. Open the `Itchy` target and select your personal development team in **Signing & Capabilities**.
3. Go to `Product/Scheme/Edit Scheme` in the Menu Bar and set the **Build Configuration** to `Release`. Disable **Debug Executable** for better performance on first launch.
4. Build the project.

### iOS through CLI

1. Run `npx expo run:ios --device --configuration Release` in the root directory.
2. Choose your preferred Device/Simulator from the interactive menu.
3. If prompted, choose what development team to use for signing.

