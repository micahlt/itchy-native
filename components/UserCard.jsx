import { View } from "react-native";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import SquircleView from "./SquircleView";

export default function UserCard({ user, width = 250, style = {} }) {
    const { colors, dimensions } = useTheme();
    const router = useRouter();
    const openProject = useCallback(() => {
        router.push(`/users/${user.username}`);
    }, [user]);

    if (!!user) {
        return (
            <SquircleView cornerSmoothing={0.6} style={{ width, ...style, borderRadius: 16, overflow: "hidden" }}>
                <Pressable
                    provider="gesture-handler"
                    style={{
                        overflow: 'hidden', borderRadius: 10,
                        ...style
                    }}
                    android_ripple={{ color: colors.ripple, foreground: true, borderless: false }}
                    onPress={openProject}
                >
                    <SquircleView cornerSmoothing={0.6} style={{
                        backgroundColor: colors.backgroundSecondary, borderRadius: 16, overflow: "hidden", width: width, borderColor: colors.outline, borderWidth: dimensions.outlineWidth
                    }} >
                        <Image placeholder={require("../assets/project.png")} placeholderContentFit="cover" source={{ uri: user.featuredProject ? `https:${user.featuredProject.thumbnail_url}` : `https://uploads.scratch.mit.edu/get_image/user/${user.id}_128x128.png` }} style={{ width: width, aspectRatio: "4 / 1" }} contentFit="fill" blurRadius={5} />
                        <View style={{
                            borderRadius: 64, margin: "auto", marginTop: -32, elevation: 5
                        }}>
                            <Image placeholder={require("../assets/avatar2.png")} placeholderContentFit="cover" source={{ uri: `https://uploads.scratch.mit.edu/get_image/user/${user.id}_128x128.png` }} style={{ width: 64, height: 64, borderRadius: 64 }} />
                        </View>
                        {user?.username && <ItchyText style={{ color: colors.text, padding: 10, paddingBottom: 10, fontWeight: "bold", fontSize: 14, textAlign: "center" }} numberOfLines={1}>{user.username}</ItchyText>}
                        <View style={{ flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, paddingHorizontal: 5, gap: 10 }}>
                            <View>
                                <ItchyText style={{ color: colors.textSecondary, fontWeight: "bold", fontSize: 20, textAlign: "center" }} numberOfLines={1}>
                                    {user.followers}
                                </ItchyText>
                                <ItchyText style={{ color: colors.textSecondary, paddingBottom: 10, fontSize: 12, textAlign: "center" }} numberOfLines={1}>
                                    Followers
                                </ItchyText>
                            </View>
                            <View>
                                <ItchyText style={{ color: colors.textSecondary, fontWeight: "bold", fontSize: 20, textAlign: "center" }} numberOfLines={1}>
                                    {user.following}
                                </ItchyText>
                                <ItchyText style={{ color: colors.textSecondary, paddingBottom: 10, fontSize: 12, textAlign: "center" }} numberOfLines={1}>
                                    Following
                                </ItchyText>
                            </View>
                        </View>
                    </SquircleView>
                </Pressable>
            </SquircleView>
        );
    }
}