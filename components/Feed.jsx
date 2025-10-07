import { View } from "react-native";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { forwardRef, useImperativeHandle } from "react";
import APIExplore from "../utils/api-wrapper/explore";
import { useMMKVString } from "react-native-mmkv";
import FeedItem from "./FeedItem";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SquircleView from "react-native-fast-squircle";
import TexturedButton from "./TexturedButton";
import useSWR from "swr";

const Feed = forwardRef(function Feed({ username, style }, ref) {
    const { colors, dimensions } = useTheme();
    const [token] = useMMKVString("token");
    const router = useRouter();

    // SWR data fetching
    const { data: feed = [], isLoading, mutate } = useSWR(
        username && token ? ['feed', username, token] : null,
        () => APIExplore.getFeed(username, token),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Expose refresh method to parent
    useImperativeHandle(ref, () => ({
        refresh: () => {
            console.log("Feed: Refreshing with SWR mutate");
            mutate();
        }
    }), [mutate]);

    // Don't render anything if we're loading and have no content, or if no username
    if ((isLoading && feed.length === 0) || !username) {
        return <>
            <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 4, gap: 10, marginBottom: 10, marginTop: 5, ...style }}>
                <Ionicons name="file-tray" size={24} color={colors.text} />
                <ItchyText style={{ color: colors.text, fontSize: 20, fontWeight: "bold", flexGrow: 1 }}>What's Happening</ItchyText>
                <TexturedButton onPress={() => router.push("feed")} icon="arrow-forward">More</TexturedButton>
            </View>
            <SquircleView cornerSmoothing={0.6} style={{ backgroundColor: colors.accent, padding: 10, borderRadius: dimensions.mediumRadius, marginTop: 0, ...style, marginBottom: 10 }}>
                {!username ? (
                    <View style={{
                        padding: 20,
                        alignItems: 'center',
                        opacity: 0.6
                    }}>
                        <ItchyText style={{ color: colors.text, textAlign: 'center' }}>
                            Sign in to see your feed
                        </ItchyText>
                    </View>
                ) : (
                    /* Skeleton loading items */
                    [1, 2, 3].map((index) => (
                        <View key={`skeleton-${index}`} style={{
                            height: 60,
                            backgroundColor: colors.backgroundSecondary,
                            borderRadius: 8,
                            marginBottom: index < 3 ? 8 : 0,
                            opacity: 0.6
                        }} />
                    ))
                )}
            </SquircleView>
        </>
    }

    return <>
        <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 4, gap: 10, marginBottom: 10, marginTop: 5, ...style }}>
            <Ionicons name="file-tray" size={24} color={colors.text} />
            <ItchyText style={{ color: colors.text, fontSize: 20, fontWeight: "bold", flexGrow: 1 }}>What's Happening</ItchyText>
            <TexturedButton onPress={() => router.push("feed")} icon="arrow-forward">More</TexturedButton>
        </View>
        <SquircleView cornerSmoothing={0.6} style={{
            backgroundColor: colors.accent,
            padding: 10,
            paddingTop: 3,
            borderRadius: dimensions.mediumRadius,
            marginTop: 0,
            borderWidth: 0.1,
            borderTopWidth: 4,
            borderColor: colors.ripple,
            outlineColor: colors.outline,
            outlineWidth: dimensions.outlineWidth,
            ...style,
            marginBottom: 10,
            minHeight: feed.length === 0 ? 100 : 'auto'
        }}>
            {feed.length === 0 ? (
                <View style={{
                    padding: 20,
                    alignItems: 'center',
                    opacity: 0.6
                }}>
                    <ItchyText style={{ color: colors.text, textAlign: 'center' }}>
                        No recent activity
                    </ItchyText>
                </View>
            ) : (
                feed.map((item) => <FeedItem key={item.id} item={item} backgroundColor={colors.accent} />)
            )}
        </SquircleView>
    </>
});

Feed.whyDidYouRender = true;

export default Feed;