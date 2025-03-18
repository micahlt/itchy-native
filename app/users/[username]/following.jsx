import { View, ScrollView, Text } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import UserList from "../../../components/UserList";

export default function Following() {
    const { username } = useLocalSearchParams();
    const { colors } = useTheme();
    const [following, setFollowing] = useState([]);
    const [page, setPage] = useState(1);
    useEffect(() => {
        getFollowing();
    }, [username]);

    const getFollowing = () => {
        ScratchAPIWrapper.user.getFollowing(username, page).then((data) => {
            setFollowing([...following, ...data]);
            setPage(page + 1);
        }).catch(console.error);
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: `${username}'s Following`
                }}
            />
            {following.length > 0 && <UserList users={following} onEndReached={getFollowing} />}
        </View>
    );
}