import { Text, View } from "react-native";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export default function UserCard({ user, width = 250, style = {} }) {
    const { colors } = useTheme();
    const router = useRouter();
    const openProject = useCallback(() => {
        router.push(`/users/${user.username}`);
    }, [user]);

    if (!!user) {
        return (
            <Pressable style={{
                overflow: 'hidden', borderRadius: 10, elevation: 2,
                ...style
            }} android_ripple={{ color: colors.ripple, foreground: true, borderless: false }} onPress={openProject}>
                <View style={{
                    backgroundColor: colors.backgroundSecondary, borderRadius: 10, overflow: "hidden", width: width
                }} >
                    <Image placeholder={require("../assets/project.png")} placeholderContentFit="cover" source={{ uri: user.featuredProject ? `https:${user.featuredProject.thumbnail_url}` : `https://uploads.scratch.mit.edu/get_image/user/${user.id}_128x128.png` }} style={{ width: width, aspectRatio: "4 / 1", contentFit: "stretch" }} blurRadius={5} />
                    <View style={{
                        borderRadius: 64, margin: "auto", marginTop: -32, elevation: 5
                    }}>
                        <Image placeholder={require("../assets/avatar2.png")} placeholderContentFit="cover" source={{ uri: `https://uploads.scratch.mit.edu/get_image/user/${user.id}_128x128.png` }} style={{ width: 64, height: 64, borderRadius: 64 }} />
                    </View>
                    {user?.username && <Text style={{ color: colors.text, padding: 10, paddingBottom: 10, fontWeight: "bold", fontSize: 14, textAlign: "center" }} numberOfLines={1}>{user.username}</Text>}
                    <View style={{ flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, paddingHorizontal: 5, gap: 10 }}>
                        <View>
                            <Text style={{ color: colors.textSecondary, fontWeight: "bold", fontSize: 20, textAlign: "center" }} numberOfLines={1}>
                                {user.followers}
                            </Text>
                            <Text style={{ color: colors.textSecondary, paddingBottom: 10, fontSize: 12, textAlign: "center" }} numberOfLines={1}>
                                Followers
                            </Text>
                        </View>
                        <View>
                            <Text style={{ color: colors.textSecondary, fontWeight: "bold", fontSize: 20, textAlign: "center" }} numberOfLines={1}>
                                {user.following}
                            </Text>
                            <Text style={{ color: colors.textSecondary, paddingBottom: 10, fontSize: 12, textAlign: "center" }} numberOfLines={1}>
                                Following
                            </Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    }
}