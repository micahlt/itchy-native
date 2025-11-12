import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import FastSquircleView from "react-native-fast-squircle";
import ItchyText from "./ItchyText";

export default function Card({ onPress, children, style = {}, pressableStyle = {}, onLongPress = () => { } }) {
    const { colors, dimensions } = useTheme();
    if (!!onPress) {
        return (
            <FastSquircleView cornerSmoothing={0.6} style={{
                backgroundColor: colors.backgroundSecondary,
                overflow: 'hidden', borderRadius: dimensions.largeRadius, elevation: 2, ...style
            }}>
                <Pressable android_ripple={{ color: colors.ripple, foreground: true, borderless: true }} onLongPress={onLongPress} onPress={onPress} style={{ ...pressableStyle }} provider="gesture-handler">
                    {children}
                </Pressable>
            </FastSquircleView>
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