import { TouchableOpacity, View, TouchableWithoutFeedback } from "react-native";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { Image } from "react-native";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import FastSquircleView from "react-native-fast-squircle";

export default function ProjectCard({ project, width = 250, style = {} }) {
    const { colors, dimensions } = useTheme();
    const router = useRouter();

    const openProject = useCallback(() => {
        router.push(`/projects/${project.id}`);
    }, [project]);

    const openProfile = useCallback(() => {
        router.push(`/users/${project.creator || project.author?.username}`);
    }, [project]);

    if (!project) return null;

    const username = project.creator || project.author?.username;

    return (
        <FastSquircleView cornerSmoothing={0.6} style={{ width, borderRadius: 16, overflow: "hidden", ...style }}>
            {/* Outer Pressable for ripple effect only */}
            <Pressable
                provider="gesture-handler"
                android_ripple={{ borderless: true, foreground: true, color: colors.ripple }}
                onPress={() => { }}
            >
                <FastSquircleView cornerSmoothing={0.6} style={{
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    overflow: "hidden",
                    width: width,
                    borderColor: colors.outline,
                    borderWidth: dimensions.outlineWidth,
                    ...style
                }}>
                    {/* Project thumbnail - clickable to open project */}
                    <TouchableWithoutFeedback onPress={openProject}>
                        <Image
                            placeholder={require("../assets/project.png")}
                            placeholderContentFit="cover"
                            source={{ uri: project.thumbnail_url ? `https:${project.thumbnail_url}` : project.image }}
                            style={{ width: width, aspectRatio: "4 / 3" }}
                            contentFit="fill"
                        />
                    </TouchableWithoutFeedback>

                    {/* Project title - clickable to open project */}
                    {project?.title && project.title.trim() && (
                        <TouchableWithoutFeedback onPress={openProject}>
                            <View>
                                <ItchyText
                                    style={{
                                        color: colors.text,
                                        padding: 10,
                                        paddingBottom: (username || project.label) ? 0 : 10,
                                        fontWeight: "bold",
                                        fontSize: 16
                                    }}
                                    numberOfLines={1}
                                >
                                    {project.title}
                                </ItchyText>
                            </View>
                        </TouchableWithoutFeedback>
                    )}

                    {/* Username - clickable to open profile */}
                    {username && (
                        <TouchableOpacity
                            onPress={openProfile}
                            style={{
                                padding: 10,
                                paddingTop: 2,
                                backgroundColor: "transparent",
                                zIndex: 10 // Ensure this is above other elements
                            }}
                            activeOpacity={0.6}
                        >
                            <ItchyText
                                style={{ color: colors.accent, fontSize: 14 }}
                                numberOfLines={1}
                            >
                                {username}
                            </ItchyText>
                        </TouchableOpacity>
                    )}

                    {/* Project label - clickable to open project */}
                    {project.label && (
                        <TouchableWithoutFeedback onPress={openProject}>
                            <View>
                                <ItchyText
                                    style={{
                                        color: colors.text,
                                        padding: 10,
                                        paddingTop: project.title.trim() ? 5 : 10,
                                        fontSize: 12,
                                        opacity: 0.7
                                    }}
                                    numberOfLines={1}
                                >
                                    {project.label}
                                </ItchyText>
                            </View>
                        </TouchableWithoutFeedback>
                    )}
                </FastSquircleView>
            </Pressable>
        </FastSquircleView>
    );
}