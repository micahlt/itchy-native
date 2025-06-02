import { Text, TouchableOpacity, View } from "react-native";
import Pressable from "./Pressable";
import { useMemo } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import timeago from "time-ago";
import { useTheme } from "../utils/theme";

export default function FeedItem({ item, textColor = "white", type = "whatshappening" }) {
    const router = useRouter();
    const { colors } = useTheme();
    const activityType = useMemo(() => {
        switch (item.type) {
            case "favoriteproject":
                return "favorited";
            case "loveproject":
                return "loved";
            case "shareproject":
                return "shared";
            case "followuser":
                return "followed";
            case "becomecurator":
                return "became a curator of";
            case "followstudio":
                return "followed";
            case "addproject":
                return "added";
            case "remixproject":
                return "remixed";
            case "becomeownerstudio":
                return "was promoted to manager of";
        }
    }, [item.type]);

    const preposition = useMemo(() => {
        switch (item.type) {
            case "addproject":
                return " to ";
            case "remixproject":
                return " as ";
            default:
                return false;
        }
    }, [item.type]);

    const routerLink = useMemo(() => {
        switch (item.type) {
            case "favoriteproject":
            case "loveproject":
            case "shareproject":
            case "remixproject":
                return `/projects/${item.project_id}`;
            case "followstudio":
            case "becomecurator":
            case "becomeownerstudio":
            case "addproject":
                return `/studios/${item.gallery_id}`;
            case "followuser":
                return `/users/${item.followed_username}`;

        }
    }, [item]);

    return <View style={{ borderRadius: 10, overflow: "hidden" }}>
        <Pressable android_ripple={{ color: colors.ripple, borderless: true, foreground: true }} style={{ borderRadius: 10 }} onPress={() => router.push(routerLink)}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 4 }}>
                <TouchableOpacity onPress={() => router.push(`/users/${item.actor_username || item.recipient_username}`)}>
                    <Image source={{ uri: `https://uploads.scratch.mit.edu/get_image/user/${item.actor_id || item.recipient_id}_50x50.png` }} style={{ width: 36, height: 36, borderRadius: 25, backgroundColor: "white", marginRight: 10 }} />
                </TouchableOpacity>
                <View style={{ width: "85%" }}>
                    <Text style={{ color: textColor, fontSize: 14, fontWeight: "bold" }}>{item.actor_username || item.recipient_username} <Text style={{ fontWeight: "normal" }}>{activityType}</Text> {item.followed_username || item.parent_title || item.title || item.project_title || item.gallery_title}{preposition && <><Text style={{ fontWeight: "normal" }}>{preposition}</Text>{item.gallery_title || item.title}</>}</Text>
                    <Text style={{ fontWeight: "normal", color: textColor, fontSize: 10 }}>{type === "useractivity" ? item.datetime_created : timeago.ago(item.datetime_created)}</Text>
                </View>
            </View>
        </Pressable>
    </View>
};