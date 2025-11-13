// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require("path");
const {
    wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver = {
    ...config.resolver,
    alias: {
        'react': require.resolve('react'),
        'react-native': require.resolve('react-native'),
    },
};

module.exports = wrapWithReanimatedMetroConfig(config);
