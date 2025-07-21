import { Image } from "expo-image";
import { Text, View } from "react-native";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { MaterialIcons } from "@expo/vector-icons";
import tinycolor from "tinycolor2";
import { useCallback, useMemo } from "react";

const ImageChip = ({ imageURL = "", text = "", onPress = () => { }, textStyle, mode = "filled", style = {}, provider = "native" }) => {
    const { colors } = useTheme();
    const onPressFn = useCallback(() => {
        onPress();
    }, [onPress]);
    return <View style={{ marginRight: "auto", flexDirection: "row", borderRadius: 20, height: 32, overflow: "visible", borderColor: mode == "outlined" ? colors.backgroundTertiary : "transparent", borderWidth: mode == "outlined" ? 1 : 0, ...style }}>
        <Pressable provider={provider} style={{ alignItems: "center", gap: 5, paddingRight: 12, borderRadius: 20, height: 32, marginRight: "auto" }} android_ripple={{ borderless: false }} onPress={onPressFn}>
            <View style={{ flexDirection: "row", alignItems: "center", height: 32, gap: 5 }}>
                <Image source={{ uri: imageURL }} style={{ width: 32, height: 32, aspectRatio: 1, borderRadius: 16, backgroundColor: '#ffffff' }} />
                <Text style={{ color: colors.text, marginLeft: 4, ...textStyle }}>{text}</Text>
            </View>
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
    const onPressFn = useCallback(() => {
        onPress();
    }, [onPress]);

    return <View style={{ borderRadius: 20, height: 32, overflow: "hidden", flexDirection: 'row' }}>
        <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: mode == "filled" ? bg : "transparent", paddingRight: 12, borderColor: color, borderWidth: 1, borderRadius: 20, height: 32, }} android_ripple={{ color: colors.ripple, foreground: true, borderless: false }} onPress={onPressFn}>
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