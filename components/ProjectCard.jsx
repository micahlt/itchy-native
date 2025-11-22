import { View } from "react-native";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { Image } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import SquircleView from "./SquircleView";
import { TouchableOpacity } from "react-native-gesture-handler";
import * as Clipboard from "expo-clipboard";
import TexturedButton from "./TexturedButton";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { getLiquidPlusPadding } from "../utils/platformUtils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { impactAsync, ImpactFeedbackStyle } from "expo-haptics";

export default function ProjectCard({ project, width = 250, style = {} }) {
    const { colors, dimensions, isDark } = useTheme();
    const router = useRouter();
    const bottomSheetModalRef = useRef(null);
    const insets = useSafeAreaInsets();

    const openProject = useCallback(() => {
        console.log("openproject")
        router.push(`/projects/${project.id}`);
    }, [project]);

    const openProfile = useCallback(() => {
        router.push(`/users/${project.creator || project.author?.username}`);
    }, [project]);

    const handleLongPress = useCallback(() => {
        impactAsync(ImpactFeedbackStyle.Medium);
        bottomSheetModalRef.current?.present();
    }, []);

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.6}
            />
        ),
        []
    );

    if (!project) return null;

    const username = project.creator || project.author?.username;

    return (
        <>
            <SquircleView cornerSmoothing={0.6} style={{ width, borderRadius: 16, overflow: "hidden", ...style }}>
                {/* Outer Pressable for ripple effect only */}
                <Pressable
                    provider="native"
                    android_ripple={{ borderless: true, foreground: true, color: colors.ripple }}
                    onPress={() => { }}
                    onLongPress={handleLongPress}
                >
                    <SquircleView cornerSmoothing={0.6} style={{
                        backgroundColor: colors.background,
                        borderRadius: 16,
                        overflow: "hidden",
                        width: width,
                        borderColor: colors.outline,
                        borderWidth: dimensions.outlineWidth,
                        ...style
                    }}>
                        {/* Project thumbnail - clickable to open project */}
                        <Pressable onPress={openProject} onLongPress={handleLongPress} provider="gesture-handler">
                            <Image
                                placeholder={require("../assets/project.png")}
                                placeholderContentFit="cover"
                                source={{ uri: project.thumbnail_url ? `https:${project.thumbnail_url}` : project.image }}
                                style={{ width: width, aspectRatio: "4 / 3" }}
                                contentFit="fill"
                            />
                        </Pressable>

                        {/* Project title - clickable to open project */}
                        {project?.title && project.title.trim() ? (
                            <Pressable onPress={openProject} onLongPress={handleLongPress} provider="gesture-handler">
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
                            </Pressable>
                        ) : <></>}

                        {/* Username - clickable to open profile */}
                        {username ? (
                            <TouchableOpacity
                                onPress={openProfile}
                                onLongPress={handleLongPress}
                                style={{
                                    padding: 10,
                                    paddingTop: 0,
                                    marginTop: -2,
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
                        ) : <></>}

                        {/* Project label - clickable to open project */}
                        {project.label ? (
                            <Pressable onPress={openProject} onLongPress={handleLongPress} provider="gesture-handler">
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
                            </Pressable>
                        ) : <></>}
                    </SquircleView>
                </Pressable>
            </SquircleView>
            <BottomSheetModal
                ref={bottomSheetModalRef}
                enableDynamicSizing={true}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: colors.backgroundSecondary }}
                handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
            >
                <BottomSheetView
                    style={{
                        paddingTop: getLiquidPlusPadding(0, 0),
                        paddingBottom: insets.bottom,
                        paddingHorizontal: 20,
                        backgroundColor: colors.backgroundSecondary,
                    }}
                >
                    <ItchyText style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: colors.text }}>Options</ItchyText>
                    <TexturedButton onPress={async () => {
                        await Clipboard.setStringAsync(`https://scratch.mit.edu/projects/${project.id}`);
                        bottomSheetModalRef.current?.dismiss();
                    }} style={{ marginBottom: 10 }} icon="link" iconSide="left">Copy Link</TexturedButton>
                    <TexturedButton onPress={() => {
                        router.push(`/projects/${project.id}/comments`);
                        bottomSheetModalRef.current?.dismiss();
                    }} style={{ marginBottom: 10 }} icon="chatbubbles" iconSide="left">Open Comments</TexturedButton>
                    <TexturedButton onPress={() => {
                        openProfile();
                        bottomSheetModalRef.current?.dismiss();
                    }} style={{ marginBottom: 10 }} icon="person" iconSide="left">Open User</TexturedButton>
                </BottomSheetView>
            </BottomSheetModal>
        </>
    );
}