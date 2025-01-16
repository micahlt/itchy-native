import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../utils/theme";
import { MaterialIcons } from "@expo/vector-icons";

const ImageChip = ({ imageURL, text = "", onPress = () => { } }) => {
    const { colors } = useTheme();
    return <View style={{ borderRadius: 20, height: 32, overflow: "hidden" }}>
        <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.backgroundSecondary, paddingRight: 12, borderRadius: 20, height: 32 }} android_ripple={{ color: colors.ripple, borderless: false }} onPress={onPress}>
            <Image source={{ uri: imageURL }} style={{ width: 32, aspectRatio: 1, borderRadius: 16 }} />
            <Text style={{ color: colors.text }}>{text}</Text>
        </Pressable>
    </View>;
};

const IconChip = ({ icon, text = "", onPress = () => { }, color = "#ff656d", mode = "outlined" }) => {
    const { colors } = useTheme();
    return <View style={{ borderRadius: 20, height: 32, overflow: "hidden" }}>
        <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "transparent", paddingRight: 12, borderColor: color, borderWidth: 1, borderRadius: 20, height: 32, }} android_ripple={{ color: colors.ripple, foreground: true, borderless: false }} onPress={onPress}>
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