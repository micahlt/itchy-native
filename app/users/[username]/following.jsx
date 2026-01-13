import { Platform, View } from "react-native";
import ItchyText from "../../../components/ItchyText";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import UserList from "../../../components/UserList";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Following() {
    const { username } = useLocalSearchParams();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [following, setFollowing] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        getFollowing();
    }, [username]);

    const getFollowing = () => {
        if (loading) return;
        setLoading(true);
        ScratchAPIWrapper.user.getFollowing(username, page).then((data) => {
            setFollowing([...following, ...data]);
            setPage(page + 1);
            setLoading(false);
        }).catch(console.error);
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: `${username}'s Following`
                }}
            />
            {following.length > 0 && <UserList users={following} onEndReached={getFollowing} contentStyle={{ paddingTop: Platform.OS == "ios" ? insets.top + 5 : 5 }} />}
        </View>
    );
}