import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../utils/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export default function StudioCard({ studio, width = 250, style = {} }) {
    const { colors } = useTheme();
    const router = useRouter();
    const openProject = useCallback(() => {
        router.push(`/studios/${studio.id}`);
    }, [studio]);

    if (!!studio) {
        return (
            <Pressable style={{
                overflow: 'hidden', borderRadius: 10, elevation: 2,
                ...style
            }} android_ripple={{ color: colors.ripple, foreground: true, borderless: false }} onPress={openProject}>
                <View style={{
                    backgroundColor: colors.backgroundSecondary, borderRadius: 10, overflow: "hidden", width: width
                }} >
                    <Image placeholder={require("../assets/project.png")} placeholderContentFit="cover" source={{ uri: `https://uploads.scratch.mit.edu/galleries/thumbnails/${studio.id}.png` }} style={{ width: width, aspectRatio: "1.7 / 1", contentFit: "stretch" }} />
                    {studio?.title && studio.title.trim() && <Text style={{ color: colors.text, padding: 10, paddingBottom: (studio.creator || studio.label || studio.author?.username) ? 0 : 10, fontWeight: "bold", fontSize: 16 }} numberOfLines={1}>{studio.title}</Text>}
                </View>
            </Pressable>
        );
    }
}