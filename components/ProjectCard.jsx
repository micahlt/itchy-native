import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../utils/theme";
import { Image, useImage } from "expo-image";
import { useRouter } from "expo-router";

export default function ProjectCard({ project, width = 250, style = {} }) {
    const { colors } = useTheme();
    const router = useRouter();
    if (!!project) {
        return (
            <Pressable style={{
                overflow: 'hidden', borderRadius: 10, elevation: 2,
                ...style
            }} android_ripple={{ color: colors.ripple, foreground: true, borderless: false }} onPress={() => router.push(`/project/${project.id}`)}>
                <View style={{
                    backgroundColor: colors.backgroundSecondary, borderRadius: 10, overflow: "hidden", width: width
                }} >
                    <Image placeholder={require("../assets/project.png")} placeholderContentFit="cover" source={{ uri: project.thumbnail_url ? `https:${project.thumbnail_url}` : project.image }} style={{ width: width, aspectRatio: "4 / 3", contentFit: "stretch" }} />
                    {project.title && <Text style={{ color: colors.text, padding: 10, paddingBottom: (project.creator || project.label || project.author?.username) ? 0 : 10, fontWeight: "bold", fontSize: 16 }} numberOfLines={1}>{project.title}</Text>}
                    {(project.creator || project.author?.username) && <TouchableOpacity onPress={() => router.push(`/user/${project.creator || project.author?.username}/profile`)}>
                        <Text style={{ color: colors.accent, padding: 10, paddingTop: 2, fontSize: 12 }} numberOfLines={1}>{project.creator || project.author?.username}</Text>
                    </TouchableOpacity>}
                    {project.label && <Text style={{ color: colors.text, padding: 10, paddingTop: project.title ? 5 : 10, fontSize: 12, opacity: 0.7 }} numberOfLines={1}>{project.label}</Text>}
                </View>
            </Pressable>
        );
    }
}