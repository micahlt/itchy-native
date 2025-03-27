import { View, useWindowDimensions, ScrollView, Text, RefreshControl } from "react-native";
import Pressable from "../../../components/Pressable";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import ProjectCard from "../../../components/ProjectCard";
import { Image } from "expo-image";
import approximateNumber from "approximate-number";
import { MaterialIcons } from "@expo/vector-icons";
import linkWithFallback from "../../../utils/linkWithFallback";
import Card from "../../../components/Card";
import LinkifiedText from "../../../utils/regex/LinkifiedText";

export default function Studio() {
    const { id } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const { width } = useWindowDimensions();
    const [studio, setStudio] = useState(null);
    const [projects, setProjects] = useState(null);
    const [loading, setLoading] = useState(false);
    const load = () => {
        setProjects(null);
        setStudio(null);
        if (loading) return;
        setLoading(true);
        ScratchAPIWrapper.studio.getStudio(id).then((d) => {
            if (d.code == "NotFound") {
                router.replace("/error?errorText=Couldn't find that studio.");
                return;
            }
            setStudio(d);
            setLoading(false);
        }).catch(console.error);
        ScratchAPIWrapper.studio.getProjects(id).then((d) => {
            setProjects(d);
        }).catch(console.error);
    }

    useEffect(() => {
        load();
    }, [id]);


    const openStudio = () => {
        linkWithFallback(`https://scratch.mit.edu/studios/${id}`, colors.accent);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: studio?.title || "Loading...",
                    headerRight: () => <MaterialIcons.Button onPressIn={openStudio} name='launch' size={22} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} />
                }}
            />
            <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} progressBackgroundColor={colors.accent} colors={isDark ? ["black"] : ["white"]} />}>
                {studio &&
                    <>
                        <Image source={{ uri: `https://uploads.scratch.mit.edu/galleries/thumbnails/${id}.png` }} style={{ width: width, aspectRatio: 1.7 / 1 }} />
                        <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 0 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginRight: 10, flex: 1 }}>
                                {studio?.stats?.followers && <View style={{ alignItems: "center" }}>
                                    <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{approximateNumber(studio.stats.followers)}</Text>
                                    <Text style={{ color: colors.text, fontSize: 12 }}>Followers</Text>
                                </View>}
                                {studio?.stats?.managers && <View style={{ alignItems: "center" }}>
                                    <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{approximateNumber(studio.stats.managers)}</Text>
                                    <Text style={{ color: colors.text, fontSize: 12 }}>Managers</Text>
                                </View>
                                }
                                {studio?.history?.created && <View style={{ alignItems: "center" }}>
                                    <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{new Date(studio.history.created).getFullYear()}</Text>
                                    <Text style={{ color: colors.text, fontSize: 12 }}>Created</Text>
                                </View>}
                            </View>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 15, columnGap: 10, paddingHorizontal: 20 }}>
                            <View style={{ flex: 1, borderRadius: 10, backgroundColor: colors.backgroundSecondary, overflow: 'hidden', elevation: 2 }}>
                                <Pressable android_ripple={{ color: colors.ripple, borderless: true, foreground: true }} style={{ padding: 8 }} onPress={() => router.push(`/studios/${id}/comments`)}>
                                    <Text style={{ color: colors.text, flex: 1, textAlign: "center", fontWeight: "bold", fontSize: 12 }}>Comments</Text>
                                </Pressable>
                            </View>
                            <View style={{ flex: 1, borderRadius: 10, backgroundColor: colors.backgroundSecondary, overflow: 'hidden', elevation: 2 }}>
                                <Pressable android_ripple={{ color: colors.ripple, borderless: true, foreground: true }} style={{ padding: 8 }} onPress={() => router.push(`/studios/${id}/activity`)}>
                                    <Text style={{ color: colors.text, flex: 1, textAlign: "center", fontWeight: "bold", fontSize: 12 }}>Activity</Text>
                                </Pressable>
                            </View>
                        </View>
                        <Card style={{ padding: 20, marginHorizontal: 20 }}>
                            <LinkifiedText style={{ color: colors.text }} text={studio.description} />
                        </Card>
                        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 30, paddingBottom: 0, gap: 10 }}>
                            <MaterialIcons name='video-library' size={24} color={colors.text} />
                            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Projects <Text style={{ color: colors.textSecondary, fontWeight: "normal" }}>({studio.stats.projects == 100 ? "100+" : studio.stats.projects})</Text></Text>
                        </View>
                        <ScrollView horizontal contentContainerStyle={{ padding: 20, columnGap: 10 }} showsHorizontalScrollIndicator={false}>
                            {projects?.map((project) => (<ProjectCard project={{ ...project }} key={project.id} />))}
                        </ScrollView>
                    </>}
            </ScrollView>
        </View>
    );
}