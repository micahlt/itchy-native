import { View } from "react-native";
import { useTheme } from "../utils/theme";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable";

export default function TexturedButton({ style = {}, onPress = () => { }, textStyle = {}, children }) {
    const { colors, dimensions } = useTheme();
    return <View style={{ borderRadius: 100, overflow: "hidden", outlineColor: colors.outline, outlineWidth: dimensions.outlineWidth, backgroundColor: colors.backgroundSecondary, borderColor: colors.backgroundSecondary, borderWidth: 0.1, borderTopWidth: 2, borderTopColor: colors.highlight, ...style }}>
        <Pressable style={{ paddingHorizontal: 12, paddingBottom: 8, paddingTop: 6, }} onPress={onPress} android_ripple={{ color: colors.ripple, borderless: true, foreground: true }}>
            <ItchyText style={{ color: colors.text, fontSize: 16, fontWeight: "bold", textAlign: "center", ...textStyle }}>{children}</ItchyText>
        </Pressable>
    </View>
}