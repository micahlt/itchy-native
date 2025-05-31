# Itchy Native

Itchy Native is an experimental multiplatform rewrite of the [Itchy Ionic](https://github.com/scratch-client-4/itchy-ionic) app, built with React Native + Expo.

## Installation

We're not currently publishing public APK or IPA files, but you're welcome to build your own from this codebase or [join the beta on the Google Play Store](https://play.google.com/apps/testing/org.scratchclient4.itchy).

## Development

### Android

1. Clone the repository and run `npm install`.
2. Set up your environment according to the [Expo Android docs](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated&mode=development-build&buildEnv=local).
3. If are on Windows, due to path limits you should map the repository to a drive letter and work from there: `subst I: "C:\Users\myuser\repos\itchy-native"`
4. In the `android` directory, create a new file called `key.properties`.  Inside of it, place information about your signing keystore in this format:
```
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

### iOS

There aren't any iOS build instructions yet since the app hasn't been signed and is not on the App Store.
