import { View } from "react-native";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";

export default function Card({ onPress, children, style = {} }) {
    const { colors } = useTheme();
    if (!!onPress) {
        return (
            <Pressable style={{
                backgroundColor: colors.backgroundSecondary,
                overflow: 'hidden', borderRadius: 10, elevation: 2, ...style
            }} android_ripple={{ color: colors.ripple, foreground: true, borderless: false }} onPress={onPress}>
                {children}
            </Pressable>
        );
    } else {
        return (
            <View style={{
                backgroundColor: colors.backgroundSecondary,
                overflow: 'hidden', borderRadius: 10, elevation: 2, ...style
            }}>
                {children}
            </View>
        );
    }
}