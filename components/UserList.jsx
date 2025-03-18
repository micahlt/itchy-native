import { FlatList } from "react-native";
import Chip from "./Chip";
import { useTheme } from "../utils/theme";
import { useRouter } from "expo-router";

export default function UserList({ users = [], onEndReached }) {
    const { colors } = useTheme();
    const router = useRouter();

    return <FlatList data={users} renderItem={({ item: user }) => {
        if (user.profile.images["60x60"][0] != "h") {
            user.profile.images["60x60"] = "https:" + user.profile.images["60x60"];
        }
        return <Chip.Image imageURL={user.profile.images["60x60"]} text={user.username} textStyle={{ fontWeight: "bold" }} style={{ backgroundColor: colors.backgroundSecondary }} onPress={() => router.push(`/users/${user.username}`)} />
    }} numColumns={2} style={{ flex: 1 }} contentContainerStyle={{ padding: 15, gap: 10, paddingTop: 5 }} columnWrapperStyle={{ gap: 10 }} onEndReached={onEndReached} onEndReachedThreshold={0.4} />
}