const { getDefaultConfig } = require('expo/metro-config');
const {
    wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);

// config.resolver = {
//     ...config.resolver,
//     alias: {
//         'react': require.resolve('react'),
//         'react-native': require.resolve('react-native'),
//     },
// };

// 1. Point to your SDK folder
const sdkRoot = path.resolve(__dirname, '../itchy-multiplay');

// 2. Add it to the folders Metro watches
config.watchFolders = [__dirname, sdkRoot];

config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(sdkRoot, 'node_modules'),
];

module.exports = wrapWithReanimatedMetroConfig(config);
