import { View, useWindowDimensions, ScrollView, RefreshControl } from "react-native";
import ItchyText from "../../../components/ItchyText";
import Pressable from "../../../components/Pressable";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import ProjectCard from "../../../components/ProjectCard";
import { Image } from "expo-image";
import approximateNumber from "approximate-number";
import { Ionicons } from "@expo/vector-icons";
import linkWithFallback from "../../../utils/linkWithFallback";
import { useMMKVString } from "react-native-mmkv";
import HorizontalContentScroller from "../../../components/HorizontalContentScroller";
import TexturedButton from "../../../components/TexturedButton";

export default function User() {
    const { username } = useLocalSearchParams();
    const [myUsername] = useMMKVString("username");
    const [csrfToken] = useMMKVString("csrfToken");
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState(null);
    const [favorites, setFavorites] = useState(null);
    const [curatedStudios, setCuratedStudios] = useState(null);
    const [followingStatus, setFollowingStatus] = useState(undefined);
    const [loading, setLoading] = useState(false);

    const load = () => {
        if (!!loading) return;
        setLoading(true);
        ScratchAPIWrapper.user.getCompleteProfile(username).then((d) => {
            setProfile(d);
        }).catch(console.error)
        ScratchAPIWrapper.user.amIFollowing(username).then((d) => {
            setFollowingStatus(d);
        }).catch(console.error)
        ScratchAPIWrapper.user.getProjects(username).then((d) => {
            setProjects(d);
        }).catch(console.error)
        ScratchAPIWrapper.user.getFavorites(username).then((d) => {
            setFavorites(d);
        }).catch(console.error)
        ScratchAPIWrapper.user.getCuratedStudios(username).then((d) => {
            setCuratedStudios(d);
        }).catch(console.error)
    };

    const profileStats = useMemo(() => {
        let stats = {};
        if (!profile) return stats;
        if (profile.followers === -1) stats.followers = "∞";
        else stats.followers = approximateNumber(profile.followers);
        if (profile.following === -1) stats.following = "∞";
        else stats.following = approximateNumber(profile.following);
        return stats;
    }, [profile]);

    useEffect(() => {
        if (!loading) return;
        if (!!profile && !!projects && !!favorites) {
            setLoading(false);
        }
    }, [profile, projects, favorites]);

    useEffect(() => {
        load();
    }, [username]);

    const openProfile = () => {
        linkWithFallback(`https://scratch.mit.edu/users/${username}`, colors.accent);
    };

    const changeFollowingStatus = () => {
        if (followingStatus === undefined) return;
        if (followingStatus === true) {
            ScratchAPIWrapper.user.unfollow(username, myUsername, csrfToken).then(() => {
                setFollowingStatus(!followingStatus);
            }).catch(console.error)
        } else {
            ScratchAPIWrapper.user.follow(username, myUsername, csrfToken).then(() => {
                setFollowingStatus(!followingStatus);
            }).catch(console.error)
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: username,
                    headerRight: () => <>
                        <Ionicons.Button onPressIn={() => router.push(`/users/${username}/comments`)} name='chatbubble-ellipses' size={22} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} />
                        <Ionicons.Button onPressIn={openProfile} name='open' size={24} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} />,
                    </>
                }}
            />

            <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} progressBackgroundColor={colors.accent} colors={isDark ? ["black"] : ["white"]} />} contentContainerStyle={{ paddingBottom: 100 }}>
                {!!profile && (<>
                    <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 0 }}>
                        <Image source={{ uri: profile.profile.images["90x90"] }} placeholder={require("../../../assets/avatar.png")} placeholderContentFit="cover" style={{ height: 75, width: 75, borderRadius: 75, marginRight: 25, backgroundColor: "white" }} />
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginRight: 10, flex: 1 }}>
                            <Pressable style={{ alignItems: "center" }} onPress={() => router.push(`users/${username}/followers`)} android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}>
                                <ItchyText style={{ color: colors.accent, fontWeight: "bold", fontSize: 20 }}>{profileStats?.followers}</ItchyText>
                                <ItchyText style={{ color: colors.text, fontSize: 12 }}>Followers</ItchyText>
                            </Pressable>
                            <Pressable style={{ alignItems: "center" }} onPress={() => router.push(`users/${username}/following`)} android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}>
                                <ItchyText style={{ color: colors.accent, fontWeight: "bold", fontSize: 20 }}>{profileStats?.following}</ItchyText>
                                <ItchyText style={{ color: colors.text, fontSize: 12 }}>Following</ItchyText>
                            </Pressable>
                            <View style={{ alignItems: "center" }}>
                                <ItchyText style={{ color: colors.accent, fontWeight: "bold", fontSize: 20 }}>{new Date(profile.history.joined).getFullYear()}</ItchyText>
                                <ItchyText style={{ color: colors.text, fontSize: 12 }}>Joined </ItchyText>
                            </View>
                        </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 15, columnGap: 10, paddingHorizontal: 20 }}>
                        {myUsername === username && <TexturedButton size={10} style={{ flex: 1 }} onPress={openProfile}>Edit Profile</TexturedButton>}
                        <TexturedButton size={11} style={{ flex: 1 }} onPress={() => router.push(`/users/${username}/about`)}>About</TexturedButton>
                        <TexturedButton size={11} style={{ flex: 1 }} onPress={() => router.push(`/users/${username}/activity`)}>Activity</TexturedButton>
                        {followingStatus !== undefined && <TexturedButton size={11} style={{ flex: 1 }} onPress={changeFollowingStatus}>{followingStatus === true ? "Unfollow" : "Follow"}</TexturedButton>}
                    </View>
                    {profile.featuredProject && <ProjectCard project={profile.featuredProject} width={width - 40} style={{ margin: "auto", marginTop: 0 }} />}

                    <HorizontalContentScroller title="Created Projects" data={projects} iconName="sparkles" headerStyle={{ marginTop: 16 }} onShowMore={() => router.push(`/users/${username}/projects`)} />

                    <HorizontalContentScroller title="Favorites" data={favorites} iconName="star" headerStyle={{ marginTop: 5 }} onShowMore={() => router.push(`/users/${username}/favorites`)} />

                    <HorizontalContentScroller title="Curated Studios" data={curatedStudios} itemType="studios" iconName="albums" headerStyle={{ marginTop: 5 }} onShowMore={() => router.push(`/users/${username}/studios`)} />
                </>)}
            </ScrollView>

        </View>
    );
}