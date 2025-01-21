import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../utils/theme";
import { useMemo } from "react";
import { decode } from 'html-entities';
import { useRouter } from "expo-router";
import { useMMKVString } from "react-native-mmkv";
import linkWithFallback from "../utils/linkWithFallback";

export default function Message({ message }) {
    const { colors } = useTheme();
    const router = useRouter();
    const [username] = useMMKVString("username");

    const headerText = useMemo(() => {
        if (message.type === "admin") {
            return "Message from Scratch Team";
        } else if (message.type === "studioactivity") {
            return message.title;
        } else {
            return message.actor_username;
        }
    }, [message]);

    const bodyText = useMemo(() => {
        switch (message.type) {
            case "followuser":
                return `followed you`;
            case "loveproject":
                return `loved ${message.title}`;
            case "favoriteproject":
                return `favorited ${message.project_title}`;
            case "addcomment":
                return decode(message.comment_fragment).trim();
            case "studioactivity":
                return `new activity in studio`;
            case "remixproject":
                return `remixed ${message.parent_title}`;
            case "curatorinvite":
                return `invited you to curate ${message.title}`;
            case "becomeownerstudio":
                return `promoted you to curator of ${message.gallery_title}`;
            case "becomehoststudio":
                return `made you host of ${message.gallery_title}`;
            case "forumpost":
                return `posted in ${message.topic_title}`;
            case "admin":
                return message.message;
        }
    }, [message]);

    const pfpLink = useMemo(() => {
        if (message.type == "studioactivity") {
            return `https://uploads.scratch.mit.edu/galleries/thumbnails/${message.gallery_id}.png`;
        } else if (message.type == "admin") {
            return `https://uploads.scratch.mit.edu/users/avatars/15883188.png`;
        } else {
            return `https://uploads.scratch.mit.edu/users/avatars/${message.actor_id}.png`;
        }
    }, [message]);

    const openAuthor = () => {
        const actor = message.type == "admin" || message.actor_username == "systemuser"
            ? "ScratchCat"
            : message.actor_username
        router.push(`/user/${actor}/profile`);
    };

    return (
        <View style={{ paddingHorizontal: 10, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.backgroundTertiary, backgroundColor: colors.backgroundSecondary, flexDirection: "row" }}>
            <View style={{ marginRight: 20, borderRadius: 25, overflow: "hidden", height: 36, width: 36 }}>
                <Pressable android_ripple={{ color: colors.ripple, foreground: true }} onPress={openAuthor}>
                    <Image source={{ uri: pfpLink }} placeholder={require("../assets/avatar.png")} placeholderContentFit="cover" style={{ width: 36, height: 36, backgroundColor: "white" }} />
                </Pressable>
            </View>
            <View style={{ maxWidth: "90%" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: colors.text, fontWeight: 'bold' }}>{headerText}</Text>
                    {message.type == "addcomment" && message?.comment_type === 0 && <>
                        <Text style={{ color: colors.text, fontStyle: 'italic', opacity: 0.6 }}> on</Text>
                        <TouchableOpacity onPress={() => router.push(`/project/${comment_obj_id}`)}>
                            <Text style={{ color: colors.text, fontStyle: 'italic', opacity: 0.6, fontWeight: "bold" }}> {message.comment_obj_title}</Text>
                        </TouchableOpacity>
                    </>}
                    {message.type == "addcomment" && message?.comment_type === 1 && <>
                        <Text style={{ color: colors.text, fontStyle: 'italic', opacity: 0.6 }}> on</Text>
                        <TouchableOpacity onPress={() => router.push(`/user/${username}/profile`)}>
                            <Text style={{ color: colors.accent, fontStyle: 'italic', opacity: 0.6, fontWeight: "bold" }}> your profile</Text>
                        </TouchableOpacity>
                    </>}
                    {message.type == "addcomment" && message?.comment_type === 2 && <>
                        <Text style={{ color: colors.text, fontStyle: 'italic', opacity: 0.6 }}> in</Text>
                        <TouchableOpacity onPress={() => linkWithFallback(`https://scratch.mit.edu/studios/${message.comment_obj_id}/comments/#comments-${message.comment_id}`, colors.accent)}>
                            <Text style={{ color: colors.accent, fontStyle: 'italic', opacity: 0.6, fontWeight: "bold" }}> {message.comment_obj_title}</Text>
                        </TouchableOpacity>
                    </>}
                </View>
                {message.type == "addcomment" ? <View style={{ padding: 8, borderRadius: 5, marginTop: 5, marginRight: "auto", borderColor: colors.backgroundTertiary, borderWidth: 1 }}>
                    <Text style={{ color: colors.text, marginRight: "auto" }}>{bodyText}</Text>
                </View> : <Text style={{ color: colors.text, marginRight: 64 }}>{bodyText}</Text>}
            </View>
        </View >
    )
}