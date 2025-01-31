import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { useMemo } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import timeago from "time-ago";

export default function FeedItem({ item, textColor = "white" }) {
    const router = useRouter();
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
        }
    }, [item.type]);

    const routerLink = useMemo(() => {
        switch (item.type) {
            case "favoriteproject":
            case "loveproject":
            case "shareproject":
                return `/projects/${item.project_id}`;
            case "followstudio":
            case "becomecurator":
            case "becomeowner":
                return `/studios/${item.gallery_id}`;
            case "followuser":
                return `/users/${item.followee_username}`;

        }
    }, [item]);

    return <View style={{ borderRadius: 10, overflow: "hidden" }}>
        <Pressable android_ripple={{ color: "white", borderless: true, foreground: true }} style={{ borderRadius: 10 }} onPress={() => router.push(routerLink)}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 4 }}>
                <TouchableOpacity onPress={() => router.push(`/users/${item.actor_username}`)}>
                    <Image source={{ uri: `https://uploads.scratch.mit.edu/get_image/user/${item.actor_id}_50x50.png` }} style={{ width: 36, height: 36, borderRadius: 25, backgroundColor: "white", marginRight: 10 }} />
                </TouchableOpacity>
                <View style={{ width: "85%" }}>
                    <Text style={{ color: textColor, fontSize: 14, fontWeight: "bold" }}>{item.actor_username} <Text style={{ fontWeight: "normal" }}>{activityType}</Text> {item.title || item.project_title}</Text>
                    <Text style={{ fontWeight: "normal", color: textColor, fontSize: 10 }}>{timeago.ago(item.datetime_created)}</Text>
                </View>
            </View>
        </Pressable>
    </View>
};