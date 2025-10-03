import { useMMKVString } from "react-native-mmkv";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useTheme } from "../../../utils/theme";
import FeedItem from "../../../components/FeedItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import APIUser from "../../../utils/api-wrapper/user";
import { Stack, useLocalSearchParams } from "expo-router";

export default function UserActivity({ }) {
    const { username } = useLocalSearchParams();
    const { colors } = useTheme();
    const [feed, setFeed] = useState([]);
    const [token] = useMMKVString("token");
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!token || !username) return;
        APIUser.getActivity(username).then((f) => {
            setFeed(f);
        }).catch((e) => {
            console.error("Error fetching user activity: ", e);
            setFeed([]);
        });
    }, [username, token]);

    return <>
        <Stack.Screen
            options={{
                title: `${username}'s Activity`,
            }}
        />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: insets.bottom + 35 }}>
            {feed.map((item) => <FeedItem key={item.id} item={item} textColor={colors.text} backgroundColor={colors.background} type="useractivity" />)}
        </ScrollView>
    </>
}