import ItchyText from "./ItchyText";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import FastSquircleView from "react-native-fast-squircle";

export default function StudioCard({ studio, width = 250, style = {} }) {
    const { colors, dimensions } = useTheme();
    const router = useRouter();
    const openStudio = useCallback(() => {
        router.push(`/studios/${studio.id}`);
    }, [studio]);

    if (!!studio) {
        return (
            <FastSquircleView cornerSmoothing={0.6} style={{ width, ...style, borderRadius: 16, overflow: "hidden" }}>
                <Pressable
                    provider="gesture-handler"
                    style={{
                        overflow: 'hidden', borderRadius: 10,
                        ...style
                    }}
                    android_ripple={{ borderless: false, foreground: true, color: colors.ripple }}
                    onPress={openStudio}
                >
                    <FastSquircleView cornerSmoothing={0.6} style={{
                        backgroundColor: colors.background, borderRadius: 16, overflow: "hidden", width: width, borderColor: colors.outline, borderWidth: dimensions.outlineWidth
                    }}>
                        <Image placeholder={require("../assets/project.png")} placeholderContentFit="cover" source={{ uri: `https://uploads.scratch.mit.edu/galleries/thumbnails/${studio.id}.png` }} style={{ width: width, aspectRatio: "1.7 / 1" }} contentFit="fill" />
                        {studio?.title && studio.title.trim() && <ItchyText style={{ color: colors.text, padding: 10, paddingBottom: (studio.creator || studio.label || studio.author?.username) ? 0 : 10, fontWeight: "bold", fontSize: 14 }} numberOfLines={1}>{studio.title}</ItchyText>}
                    </FastSquircleView>
                </Pressable>
            </FastSquircleView>
        );
    }
}