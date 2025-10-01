import { View } from "react-native";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import FastSquircleView from "react-native-fast-squircle";

export default function Card({ onPress, children, style = {}, onLongPress = () => { } }) {
    const { colors, dimensions } = useTheme();
    if (!!onPress) {
        return (
            <Pressable style={{
                backgroundColor: colors.backgroundSecondary,
                overflow: 'hidden', borderRadius: 10, elevation: 2, ...style
            }} android_ripple={{ color: colors.ripple, foreground: true, borderless: false }} onLongPress={onLongPress} onPress={onPress}>
                {children}
            </Pressable>
        );
    } else {
        return (
            <FastSquircleView cornerSmoothing={0.6} style={{
                backgroundColor: colors.backgroundSecondary,
                overflow: 'hidden', borderRadius: dimensions.largeRadius, elevation: 2, ...style
            }}>
                {children}
            </FastSquircleView>
        );
    }
}