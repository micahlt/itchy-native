import { View } from "react-native";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { useEffect, useState } from "react";
import APIExplore from "../utils/api-wrapper/explore";
import { useMMKVString } from "react-native-mmkv";
import FeedItem from "./FeedItem";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SquircleView from "react-native-fast-squircle";
import TexturedButton from "./TexturedButton";

export default function Feed({ username, style, rerender }) {
    const { colors, dimensions } = useTheme();
    const [feed, setFeed] = useState([]);
    const [token] = useMMKVString("token");
    const router = useRouter();

    useEffect(() => {
        if (rerender < 1) return;
        console.log("rerendering", rerender)
        APIExplore.getFeed(username, token).then((f) => {
            setFeed(f);
        })
    }, [rerender]);

    return <>
        <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 4, gap: 10, marginBottom: 10, marginTop: 5, ...style }}>
            <Ionicons name="file-tray" size={24} color={colors.text} />
            <ItchyText style={{ color: colors.text, fontSize: 20, fontWeight: "bold", flexGrow: 1 }}>What's Happening</ItchyText>
            <TexturedButton onPress={() => router.push("feed")} icon="arrow-forward">More</TexturedButton>
        </View>
        <SquircleView cornerSmoothing={0.6} style={{ backgroundColor: colors.accent, padding: 10, borderRadius: dimensions.mediumRadius, marginTop: 0, ...style, marginBottom: 10 }}>
            {feed.map((item) => <FeedItem key={item.id} item={item} />)}
        </SquircleView>
    </>
}

Feed.whyDidYouRender = true;