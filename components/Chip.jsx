import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../utils/theme";
import { MaterialIcons } from "@expo/vector-icons";
import tinycolor from "tinycolor2";
import { useMemo } from "react";

const ImageChip = ({ imageURL, text = "", onPress = () => { }, textStyle }) => {
    const { colors } = useTheme();
    return <View style={{ borderRadius: 20, height: 32, overflow: "hidden" }}>
        <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.backgroundSecondary, paddingRight: 12, borderRadius: 20, height: 32 }} android_ripple={{ color: colors.ripple, borderless: false }} onPress={onPress}>
            <Image source={{ uri: imageURL }} style={{ width: 32, aspectRatio: 1, borderRadius: 16 }} />
            <Text style={{ color: colors.text, marginLeft: 4, ...textStyle }}>{text}</Text>
        </Pressable>
    </View>;
};

const IconChip = ({ icon, text = "", onPress = () => { }, color = "#ff656d", mode = "outlined", textStyle = {} }) => {
    const { colors, isDark } = useTheme();
    const bg = useMemo(() => {
        if (isDark) {
            return tinycolor(color).darken(45).toHexString();
        } else {
            return tinycolor(color).setAlpha(0.2).toRgbString();
        }
    }, [color, isDark])
    return <View style={{ borderRadius: 20, height: 32, overflow: "hidden" }}>
        <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: mode == "filled" ? bg : "transparent", paddingRight: 12, borderColor: color, borderWidth: 1, borderRadius: 20, height: 32, }} android_ripple={{ color: colors.ripple, foreground: true, borderless: false }} onPress={onPress}>
            <MaterialIcons name={icon} size={20} color={color} style={{ paddingLeft: 8 }} />
            <Text style={{ color: color }}>{text}</Text>
        </Pressable>
    </View>;
};

const Chip = {
    Image: ImageChip,
    Icon: IconChip
};

export default Chip;