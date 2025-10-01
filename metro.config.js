// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require("path");
const {
    wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.watchFolders = [
    path.resolve(__dirname, "../react-native-bottom-tabs") // path to your local package
];

config.resolver = {
    ...config.resolver,
    // Allow metro to resolve symlinked packages
    nodeModulesPaths: [
        path.resolve(__dirname, "node_modules"),
        path.resolve(__dirname, "../react-native-bottom-tabs"),
    ],
    alias: {
        'react': require.resolve('react'),
        'react-native': require.resolve('react-native'),
    },
};

module.exports = wrapWithReanimatedMetroConfig(config);
