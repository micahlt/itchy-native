import { useMMKVString } from "react-native-mmkv";
import { useEffect, useState } from "react";
import { Text, ScrollView } from "react-native";
import { useTheme } from "../../../utils/theme";
import FeedItem from "../../../components/FeedItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import { Stack, useLocalSearchParams } from "expo-router";
import StudioFeedItem from "../../../components/StudioFeedItem";

export default function StudioActivity() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const [feed, setFeed] = useState([]);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!id) return;
        ScratchAPIWrapper.studio.getActivity(id).then((f) => {
            setFeed(f);
        }).catch((e) => {
            console.error("Error fetching studio activity: ", e);
            setFeed([]);
        });
    }, [id]);

    return <>
        <Stack.Screen
            options={{
                title: `Activity`,
            }}
        />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: insets.bottom + 35 }}>
            {feed.map((item) => <StudioFeedItem key={item.id} item={item} />)}
        </ScrollView>
    </>
}