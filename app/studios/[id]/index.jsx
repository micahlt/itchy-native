import { View, useWindowDimensions, ScrollView, RefreshControl } from "react-native";
import ItchyText from "../../../components/ItchyText";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import { Image } from "expo-image";
import approximateNumber from "approximate-number";
import { Ionicons } from "@expo/vector-icons";
import linkWithFallback from "../../../utils/linkWithFallback";
import Card from "../../../components/Card";
import LinkifiedText from "../../../utils/regex/LinkifiedText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMMKVString } from "react-native-mmkv";
import HorizontalContentScroller from "../../../components/HorizontalContentScroller";
import TexturedButton from "../../../components/TexturedButton";
import FastSquircleView from "react-native-fast-squircle";

export default function Studio() {
    const { id } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const { width } = useWindowDimensions();
    const [studio, setStudio] = useState(null);
    const [projects, setProjects] = useState(null);
    const [loading, setLoading] = useState(false);
    const [followingStatus, setFollowingStatus] = useState(undefined);
    const [myUsername] = useMMKVString("username");
    const [csrfToken] = useMMKVString("csrfToken");
    const [token] = useMMKVString("token");
    const insets = useSafeAreaInsets();

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
        ScratchAPIWrapper.studio.getRelationship(myUsername, id, token).then((d) => {
            if (d.following) {
                setFollowingStatus(true);
            } else {
                setFollowingStatus(false);
            }
        })
        ScratchAPIWrapper.studio.getProjects(id).then((d) => {
            setProjects(d);
        }).catch(console.error);
    }

    useEffect(() => {
        load();
    }, [id]);

    const changeFollowingStatus = () => {
        if (followingStatus === undefined) return;
        if (followingStatus === true) {
            ScratchAPIWrapper.studio.unfollow(id, myUsername, csrfToken).then(() => {
                setFollowingStatus(!followingStatus);
            }).catch(console.error)
        } else {
            ScratchAPIWrapper.studio.follow(id, myUsername, csrfToken).then(() => {
                setFollowingStatus(!followingStatus);
            }).catch(console.error)
        }
    }

    const openStudio = () => {
        linkWithFallback(`https://scratch.mit.edu/studios/${id}`, colors.accent);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: studio?.title ? "" : "Loading...",
                    headerRight: () => <>
                        <Ionicons.Button onPressIn={() => router.push(`/studios/${id}/comments`)} name='chatbubble-ellipses' size={22} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} />
                        <Ionicons.Button onPressIn={openStudio} name='open' size={24} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} />
                    </>
                }}
            />
            <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} progressBackgroundColor={colors.accent} colors={isDark ? ["black"] : ["white"]} />} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} style={{ flex: 1 }}>
                {studio &&
                    <>
                        <ItchyText style={{ color: colors.text, fontSize: 24, fontWeight: 'bold', marginHorizontal: 'auto', textAlign: "center", paddingHorizontal: 15, marginBottom: 15 }}>{studio.title}</ItchyText>
                        <FastSquircleView co style={{ width: width - 30, aspectRatio: 1.7 / 1, borderRadius: 15, overflow: "hidden", margin: "auto" }} cornerSmoothing={0.6}>
                            <Image source={{ uri: `https://uploads.scratch.mit.edu/galleries/thumbnails/${id}.png` }} style={{ width: "100%", height: "100%" }} />
                        </FastSquircleView>
                        <View style={{ flexDirection: "row", alignItems: "center", padding: 15, paddingBottom: 0 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginRight: 10, flex: 1 }}>
                                {studio?.stats?.followers && <View style={{ alignItems: "center" }}>
                                    <ItchyText style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{approximateNumber(studio.stats.followers)}</ItchyText>
                                    <ItchyText style={{ color: colors.text, fontSize: 12 }}>Followers</ItchyText>
                                </View>}
                                {studio?.stats?.managers && <View style={{ alignItems: "center" }}>
                                    <ItchyText style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{approximateNumber(studio.stats.managers)}</ItchyText>
                                    <ItchyText style={{ color: colors.text, fontSize: 12 }}>Managers</ItchyText>
                                </View>
                                }
                                {studio?.history?.created && <View style={{ alignItems: "center" }}>
                                    <ItchyText style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{new Date(studio.history.created).getFullYear()}</ItchyText>
                                    <ItchyText style={{ color: colors.text, fontSize: 12 }}>Created</ItchyText>
                                </View>}
                            </View>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 15, columnGap: 10, paddingHorizontal: 15 }}>
                            <TexturedButton style={{ flex: 1 }} onPress={() => router.push(`/studios/${id}/activity`)}>Activity</TexturedButton>

                            {followingStatus !== undefined && <TexturedButton style={{ flex: 1 }} onPress={changeFollowingStatus}>{followingStatus === true ? "Unfollow" : "Follow"}</TexturedButton>}
                        </View>
                        <Card style={{ padding: 20, marginHorizontal: 15 }}>
                            <LinkifiedText style={{ color: colors.text }} text={studio.description} />
                        </Card>
                        <HorizontalContentScroller data={projects} itemType="projects" itemCount={studio.stats.projects} headerStyle={{ marginTop: 20 }} iconName="play" onShowMore={() => router.push(`/studios/${id}/projects`)} title="Projects" />
                    </>}
            </ScrollView>
        </View>
    );
}