import { Linking } from 'react-native';
import { openBrowser } from '@swan-io/react-native-browser';
export default function linkWithFallback(url, accentColor) {
    openBrowser(url, {
        barTintColor: accentColor
    }).catch(() => {
        Linking.openURL(url);
    })
}