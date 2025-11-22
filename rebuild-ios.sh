#!/usr/bin/env bash
set -euo pipefail

# Remove existing iOS native folder
rm -rf ios

# Install JS dependencies
npm install

# Regenerate native iOS/Android projects
npx expo prebuild

# Install CocoaPods dependencies for iOS
cd ios
pod install
cd ..

xed ios
