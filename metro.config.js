const { getDefaultConfig } = require('expo/metro-config');
const {
    wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('txt');

// config.resolver = {
//     ...config.resolver,
//     alias: {
//         'react': require.resolve('react'),
//         'react-native': require.resolve('react-native'),
//     },
// };

module.exports = wrapWithReanimatedMetroConfig(config);
