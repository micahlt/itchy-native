import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { TouchableOpacity, View } from "react-native";

export default function AvatarWithIcon({ src = "", size = 36, onPress = () => { }, style = { marginRight: 10 }, iconColor = "white", overColor = "white", icon = "" }) {
    return <TouchableOpacity onPress={onPress} style={{ ...style, position: "relative" }}>
        <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size, backgroundColor: "white" }} />
        <View style={{ position: "absolute", top: size / 2.5, left: size / 2.5, justifyContent: "center", alignItems: "center" }}>
            <View style={{ backgroundColor: overColor, height: size / 1.7, width: size / 1.7, position: "absolute", top: size / 4.5, left: size / 4.5, borderRadius: "100%" }}></View>
            <Ionicons name={icon} color={iconColor} style={{ position: "absolute", top: size / 3, left: size / 3 }} size={size / 2.5} />
        </View>
    </TouchableOpacity>
}