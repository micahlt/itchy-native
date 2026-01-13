import { View, Platform } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import UserList from "../../../components/UserList";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Followers() {
    const { username } = useLocalSearchParams();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [followers, setFollowers] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        getFollowers();
    }, [username]);

    const getFollowers = () => {
        if (loading) return;
        setLoading(true);
        ScratchAPIWrapper.user.getFollowers(username, page).then((data) => {
            setFollowers([...followers, ...data]);
            setPage(page + 1);
            setLoading(false);
        }).catch(console.error);
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: `${username}'s Followers`
                }}
            />
            {followers.length > 0 ? <UserList users={followers} onEndReached={getFollowers} contentStyle={{ paddingTop: Platform.OS == "ios" ? insets.top + 5 : 5 }} /> : <></>}
        </View>
    );
}