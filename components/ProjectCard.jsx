import { TouchableOpacity, View } from "react-native";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { Image } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import FastSquircleView from "react-native-fast-squircle";

export default function ProjectCard({ project, width = 250, style = {} }) {
    const { colors, dimensions } = useTheme();
    const router = useRouter();
    const childPressedRef = useRef(false);

    const openProject = useCallback(() => {
        if (childPressedRef.current) {
            childPressedRef.current = false;
            return;
        }
        router.push(`/projects/${project.id}`);
    }, [project]);

    const openProfile = useCallback(() => {
        childPressedRef.current = true;
        router.push(`/users/${project.creator || project.author?.username}`)
    }, [project]);

    if (!!project) {
        return (
            <FastSquircleView cornerSmoothing={0.6} style={{ width, borderRadius: 16, overflow: "hidden", ...style }}>
                <Pressable
                    provider="gesture-handler"
                    android_ripple={{ borderless: true, foreground: true, color: colors.ripple }}
                    onPress={openProject}
                >
                    <FastSquircleView cornerSmoothing={0.6} style={{
                        backgroundColor: colors.background, borderRadius: 16, overflow: "hidden", width: width, borderColor: colors.outline, borderWidth: dimensions.outlineWidth, ...style
                    }}>
                        <Image placeholder={require("../assets/project.png")} placeholderContentFit="cover" source={{ uri: project.thumbnail_url ? `https:${project.thumbnail_url}` : project.image }} style={{ width: width, aspectRatio: "4 / 3" }} contentFit="fill" />
                        {project?.title && project.title.trim() && <ItchyText style={{ color: colors.text, padding: 10, paddingBottom: (project.creator || project.label || project.author?.username) ? 0 : 10, fontWeight: "bold", fontSize: 16 }} numberOfLines={1}>{project.title}</ItchyText>}
                        {(project.creator || project.author?.username) && <TouchableOpacity
                            onPress={() => openProfile()}
                            style={{ padding: 10, paddingTop: 2, backgroundColor: "transparent" }}
                        >
                            <ItchyText style={{ color: colors.accent, fontSize: 14 }} numberOfLines={1}>{project.creator || project.author?.username}</ItchyText>
                        </TouchableOpacity>}
                        {project.label && <ItchyText style={{ color: colors.text, padding: 10, paddingTop: project.title.trim() ? 5 : 10, fontSize: 12, opacity: 0.7 }} numberOfLines={1}>{project.label}</ItchyText>}
                    </FastSquircleView>
                </Pressable>
            </FastSquircleView>
        );
    }
}