import { View, Image, FlatList } from "react-native";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable"
import { useTheme } from "../utils/theme";
import { useRouter } from "expo-router";

export default function UserList({ users = [], onEndReached, contentStyle = {} }) {
    const { colors } = useTheme();
    const router = useRouter();

    return <FlatList data={users} renderItem={({ item: user }) => {
        if (user.profile.images["60x60"][0] != "h") {
            user.profile.images["60x60"] = "https:" + user.profile.images["60x60"];
        }
        return <Pressable android_ripple={{ color: colors.ripple, foreground: true }} onPress={() => router.push(`/users/${user.username}`)}>
            <View style={{ paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.backgroundTertiary, backgroundColor: colors.background, flexDirection: "row", alignItems: 'center' }}>
                <View style={{ marginRight: 15, borderRadius: 25, overflow: "hidden", height: 36, width: 36 }}>
                    <Image source={{ uri: user.profile.images["60x60"] }} placeholder={require("../assets/avatar.png")} placeholderContentFit="cover" style={{ width: 36, height: 36, backgroundColor: "white" }} />
                </View>
                <ItchyText style={{ fontSize: 14, fontWeight: "bold", color: colors.text }}>{user.username}</ItchyText>
            </View>
        </Pressable>
    }} style={{ flex: 1 }} contentContainerStyle={contentStyle} onEndReached={onEndReached} onEndReachedThreshold={1.2} />
}