import { View } from "react-native";
import { useTheme } from "../utils/theme";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable";
import { Ionicons } from "@expo/vector-icons";

export default function TexturedButton({ style = {}, onPress = () => { }, textStyle = {}, icon = false, iconSide = "right", size = 12, provider = "native", children }) {
    const { colors, dimensions, isDark } = useTheme();
    return <View style={{ borderRadius: 100, overflow: "hidden", outlineColor: colors.outline, outlineWidth: dimensions.outlineWidth, backgroundColor: colors.backgroundSecondary, borderColor: colors.backgroundSecondary, borderWidth: 0, borderTopWidth: 0, borderTopColor: isDark ? colors.backgroundTertiary : colors.highlight, boxShadow: `0px 2px 4px 0px #ffffff22 inset, 0px 2px 0px 0px ${colors.topLight} inset`, ...style }}>
        <Pressable style={{ paddingHorizontal: size, paddingBottom: size / 1.5, paddingTop: size / 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center" }} onPress={onPress} android_ripple={{ color: colors.ripple, borderless: true, foreground: true }} provider={provider}>
            {icon && iconSide == "left" ? <Ionicons name={icon} color={colors.text} size={size * 1.25} style={{ marginRight: children == null ? 0 : size * 0.5 }} /> : <></>}
            <ItchyText style={{ color: colors.text, fontSize: size * 1.25, fontWeight: "bold", textAlign: "center", ...textStyle }}>{children}</ItchyText>
            {icon && iconSide == "right" ? <Ionicons name={icon} color={colors.text} size={size * 1.25} style={{ marginLeft: children == null ? 0 : size * 0.5 }} /> : <></>}
        </Pressable>
    </View>
}