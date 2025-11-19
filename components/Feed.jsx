import { View } from "react-native";
import ItchyText from "./ItchyText";
import { useTheme } from "../utils/theme";
import APIExplore from "../utils/api-wrapper/explore";
import { useMMKVString } from "react-native-mmkv";
import FeedItem from "./FeedItem";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SquircleView from "./SquircleView";
import TexturedButton from "./TexturedButton";
import useSWR from "swr";
import { getCrashlytics, log } from "@react-native-firebase/crashlytics";

const c = getCrashlytics();

export default function Feed({ username, style }) {
    const { colors, dimensions } = useTheme();
    const [token] = useMMKVString("token");
    const router = useRouter();

    // SWR data fetching with shared key for external refresh
    const { data: rawFeed, isLoading } = useSWR(
        username && token ? ['feed', username, token] : null,
        () => {
            log(c, "Refreshing feed")
            return APIExplore.getFeed(username, token)
        },
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
        }
    );

    // Ensure feed is always an array
    const feed = Array.isArray(rawFeed) ? rawFeed : [];

    // Don't render anything if we're loading and have no content, or if no username
    if ((isLoading && feed.length === 0) || !username || !feed) {
        return <>
            <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 4, gap: 10, marginBottom: 10, marginTop: 5, ...style }}>
                <Ionicons name="file-tray" size={24} color={colors.text} />
                <ItchyText style={{ color: colors.text, fontSize: 20, fontWeight: "bold", flexGrow: 1 }}>What's Happening</ItchyText>
                <TexturedButton onPress={() => router.push("feed")} icon="arrow-forward">More</TexturedButton>
            </View>
            <SquircleView style={{ backgroundColor: colors.accent, padding: 10, borderRadius: dimensions.mediumRadius, marginTop: 0, ...style, marginBottom: 10 }}>
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
                            borderRadius: dimensions.mediumRadius,
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
        <SquircleView style={{
            backgroundColor: colors.accent,
            padding: 10,
            paddingTop: 10,
            borderRadius: dimensions.mediumRadius,
            marginTop: 0,
            borderWidth: 0,
            borderTopWidth: 0,
            borderColor: colors.ripple,
            outlineColor: colors.outlineFill,
            outlineWidth: dimensions.outlineWidth,
            ...style,
            marginBottom: 10,
            minHeight: feed.length === 0 ? 100 : 'auto',
            boxShadow: "0px 8px 6px 0px #ffffff22 inset, 0px 2px 0px 0px #FFFFFF33 inset"
        }}>
            {feed.length === 0 || !feed ? (
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
                feed.map((item, index) => <FeedItem key={item.id || `feed-item-${index}`} item={item} backgroundColor={colors.accent} />)
            )}
        </SquircleView>
    </>
}