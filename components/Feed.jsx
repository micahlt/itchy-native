import { Text, View } from "react-native";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { useEffect, useState } from "react";
import APIExplore from "../utils/api-wrapper/explore";
import { useMMKVString } from "react-native-mmkv";
import FeedItem from "./FeedItem";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Feed({ username, style, rerender }) {
    const { colors } = useTheme();
    const [feed, setFeed] = useState([]);
    const [token] = useMMKVString("token");
    const router = useRouter();

    useEffect(() => {
        APIExplore.getFeed(username, token).then((f) => {
            setFeed(f);
        })
    }, [rerender]);

    return <View style={{ backgroundColor: colors.accent, padding: 10, borderRadius: 10, ...style }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 4, gap: 10, marginBottom: 5 }}>
            <MaterialIcons name='timeline' size={24} color="white" />
            <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", flexGrow: 1 }}>What's Happening</Text>
            <View style={{ flexDirection: "row", alignItems: "center", borderColor: "white", borderWidth: 1, borderRadius: 16, overflow: "hidden", height: 30 }}>
                <Pressable onPress={() => router.push("feed")} android_ripple={{ color: 'white' }} style={{ alignItems: 'center', flexDirection: 'row', gap: 4, height: 32, paddingVertical: 4, paddingHorizontal: 10, }}>
                    <Text style={{ color: "white", fontSize: 14 }}>More</Text>
                    <MaterialIcons name='arrow-forward' size={14} color="white" />
                </Pressable>
            </View>
        </View>
        {feed.map((item) => <FeedItem key={item.id} item={item} />)}
    </View>
}