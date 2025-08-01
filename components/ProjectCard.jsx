import { Text, TouchableOpacity, View } from "react-native";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Chip from "./Chip";
import { useCallback, useRef } from "react";

export default function ProjectCard({ project, width = 250, style = {} }) {
    const { colors } = useTheme();
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
            <View style={{ width, ...style, borderRadius: 10, overflow: "hidden" }}>
                <Pressable
                    provider="gesture-handler"
                    android_ripple={{ borderless: false, foreground: true, color: "#ffffff" }}
                    onPress={openProject}
                >
                    <View style={{
                        backgroundColor: colors.backgroundSecondary, borderRadius: 10, overflow: "hidden", width: width
                    }} >
                        <Image placeholder={require("../assets/project.png")} placeholderContentFit="cover" source={{ uri: project.thumbnail_url ? `https:${project.thumbnail_url}` : project.image }} style={{ width: width, aspectRatio: "4 / 3", contentFit: "stretch" }} />
                        {project?.title && project.title.trim() && <Text style={{ color: colors.text, padding: 10, paddingBottom: (project.creator || project.label || project.author?.username) ? 0 : 10, fontWeight: "bold", fontSize: 14 }} numberOfLines={1}>{project.title}</Text>}
                        {project.creator && <TouchableOpacity
                            onPress={() => openProfile()}
                        >
                            <Text style={{ color: colors.accent, padding: 10, paddingTop: 2, fontSize: 12 }} numberOfLines={1}>{project.creator}</Text>
                        </TouchableOpacity>}
                        {project.author?.username && <View
                            // For Chip.Image, set childPressedRef before navigation
                            onTouchStart={() => { childPressedRef.current = true; }}
                        >
                            <Chip.Image
                                provider="gesture-handler"
                                imageURL={project.author.profile.images["90x90"]}
                                text={project.author.username}
                                onPress={openProfile}
                                textStyle={{ fontSize: 12, fontWeight: "bold", color: colors.accent }}
                                style={{ flexDirection: "row", marginRight: "auto", marginBottom: 8, marginLeft: 8, marginTop: 6, backgroundColor: colors.backgroundTertiary }}
                            />
                        </View>}
                        {project.label && <Text style={{ color: colors.text, padding: 10, paddingTop: project.title.trim() ? 5 : 10, fontSize: 12, opacity: 0.7 }} numberOfLines={1}>{project.label}</Text>}
                    </View>
                </Pressable>
            </View>
        );
    }
}