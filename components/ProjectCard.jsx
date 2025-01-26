import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../utils/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Chip from "./Chip";
import { useCallback } from "react";

export default function ProjectCard({ project, width = 250, style = {} }) {
    const { colors } = useTheme();
    const router = useRouter();
    const openProject = useCallback(() => {
        router.push(`/project/${project.id}`);
    }, [project]);

    const openProfile = useCallback(() => {
        router.push(`/user/${project.creator || project.author?.username}/profile`)
    }, [project]);

    if (!!project) {
        return (
            <Pressable style={{
                overflow: 'hidden', borderRadius: 10, elevation: 2,
                ...style
            }} android_ripple={{ color: colors.ripple, foreground: true, borderless: false }} onPress={openProject}>
                <View style={{
                    backgroundColor: colors.backgroundSecondary, borderRadius: 10, overflow: "hidden", width: width
                }} >
                    <Image placeholder={require("../assets/project.png")} placeholderContentFit="cover" source={{ uri: project.thumbnail_url ? `https:${project.thumbnail_url}` : project.image }} style={{ width: width, aspectRatio: "4 / 3", contentFit: "stretch" }} />
                    {project.title && <Text style={{ color: colors.text, padding: 10, paddingBottom: (project.creator || project.label || project.author?.username) ? 0 : 10, fontWeight: "bold", fontSize: 16 }} numberOfLines={1}>{project.title}</Text>}
                    {project.creator && <TouchableOpacity onPress={openProfile}>
                        <Text style={{ color: colors.accent, padding: 10, paddingTop: 2, fontSize: 12 }} numberOfLines={1}>{project.creator}</Text>
                    </TouchableOpacity>}
                    {project.author?.username && <Chip.Image imageURL={project.author.profile.images["90x90"]} text={project.author.username} onPress={openProfile} textStyle={{ fontSize: 12, fontWeight: "bold", color: colors.accent }} style={{ marginRight: "auto", marginBottom: 8, marginLeft: 8, marginTop: 6, backgroundColor: colors.backgroundTertiary }} />}
                    {project.label && <Text style={{ color: colors.text, padding: 10, paddingTop: project.title ? 5 : 10, fontSize: 12, opacity: 0.7 }} numberOfLines={1}>{project.label}</Text>}
                </View>
            </Pressable>
        );
    }
}