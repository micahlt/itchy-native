import { useMMKVString } from "react-native-mmkv";
import APIExplore from "../utils/api-wrapper/explore";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useTheme } from "../utils/theme";
import FeedItem from "../components/FeedItem";

export default function Feed({ }) {
    const { colors } = useTheme();
    const [feed, setFeed] = useState([]);
    const [token] = useMMKVString("token");
    const [username] = useMMKVString("username");

    useEffect(() => {
        if (!token || !username) return;
        APIExplore.getFeed(username, token, 0, 40).then((f) => {
            setFeed(f);
        })
    }, [username, token]);

    return <ScrollView contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 15 }}>
        {feed.map((item) => <FeedItem key={item.id} item={item} textColor={colors.text} />)}
    </ScrollView>
}