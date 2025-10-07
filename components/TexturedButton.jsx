import { View } from "react-native";
import { useTheme } from "../utils/theme";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable";
import { Ionicons } from "@expo/vector-icons";

export default function TexturedButton({ style = {}, onPress = () => { }, textStyle = {}, icon = false, size = 12, children }) {
    const { colors, dimensions, isDark } = useTheme();
    return <View style={{ borderRadius: 100, overflow: "hidden", outlineColor: colors.outline, outlineWidth: dimensions.outlineWidth, backgroundColor: colors.backgroundSecondary, borderColor: colors.backgroundSecondary, borderWidth: 0.1, borderTopWidth: 2, borderTopColor: isDark ? colors.backgroundTertiary : colors.highlight, ...style }}>
        <Pressable style={{ paddingHorizontal: size, paddingBottom: size / 1.5, paddingTop: size / 2, flexDirection: "row", alignItems: "center", justifyContent: "center" }} onPress={onPress} android_ripple={{ color: colors.ripple, borderless: true, foreground: true }}>
            <ItchyText style={{ color: colors.text, fontSize: size * 1.25, fontWeight: "bold", textAlign: "center", ...textStyle }}>{children}</ItchyText>
            {icon && <Ionicons name={icon} color={colors.text} size={size * 1.25} style={{ marginLeft: 3 }} />}
        </Pressable>
    </View>
}