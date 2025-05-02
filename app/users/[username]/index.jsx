import { View, useWindowDimensions, ScrollView, Text, RefreshControl } from "react-native";
import Pressable from "../../../components/Pressable";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import ProjectCard from "../../../components/ProjectCard";
import { Image } from "expo-image";
import approximateNumber from "approximate-number";
import { MaterialIcons } from "@expo/vector-icons";
import linkWithFallback from "../../../utils/linkWithFallback";
import StudioCard from "../../../components/StudioCard";
import { useMMKVString } from "react-native-mmkv";

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
                    headerTitleAlign: "center",
                    headerRight: () => <>
                        <MaterialIcons.Button onPressIn={() => router.push(`/users/${username}/comments`)} name='question-answer' size={22} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} />
                        <MaterialIcons.Button onPressIn={openProfile} name='launch' size={22} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} />
                    </>
                }}
            />

            <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} progressBackgroundColor={colors.accent} colors={isDark ? ["black"] : ["white"]} />} contentContainerStyle={{ paddingBottom: 20 }}>
                {!!profile && (<>
                    <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 0 }}>
                        <Image source={{ uri: profile.profile.images["90x90"] }} placeholder={require("../../../assets/avatar.png")} placeholderContentFit="cover" style={{ height: 75, width: 75, borderRadius: 75, marginRight: 25, backgroundColor: "white" }} />
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginRight: 10, flex: 1 }}>
                            <Pressable style={{ alignItems: "center" }} onPress={() => router.push(`users/${username}/followers`)} android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}>
                                <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{profileStats?.followers}</Text>
                                <Text style={{ color: colors.text, fontSize: 12 }}>Followers</Text>
                            </Pressable>
                            <Pressable style={{ alignItems: "center" }} onPress={() => router.push(`users/${username}/following`)} android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}>
                                <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{profileStats?.following}</Text>
                                <Text style={{ color: colors.text, fontSize: 12 }}>Following</Text>
                            </Pressable>
                            <View style={{ alignItems: "center" }}>
                                <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{new Date(profile.history.joined).getFullYear()}</Text>
                                <Text style={{ color: colors.text, fontSize: 12 }}>Joined </Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 15, columnGap: 10, paddingHorizontal: 20 }}>
                        {myUsername === username && <View style={{ flex: 1, borderRadius: 10, backgroundColor: colors.backgroundSecondary, overflow: 'hidden', elevation: 2 }}>
                            <Pressable android_ripple={{ color: colors.ripple, borderless: true, foreground: true }} style={{ padding: 8 }} onPress={openProfile}>
                                <Text style={{ color: colors.text, flex: 1, textAlign: "center", fontWeight: "bold", fontSize: 12 }}>Edit Profile</Text>
                            </Pressable>
                        </View>}
                        <View style={{ flex: 1, borderRadius: 10, backgroundColor: colors.backgroundSecondary, overflow: 'hidden', elevation: 2 }}>
                            <Pressable android_ripple={{ color: colors.ripple, borderless: true, foreground: true }} style={{ padding: 8 }} onPress={() => router.push(`/users/${username}/about`)}>
                                <Text style={{ color: colors.text, flex: 1, textAlign: "center", fontWeight: "bold", fontSize: 12 }}>About</Text>
                            </Pressable>
                        </View>
                        {followingStatus !== undefined && <View style={{ flex: 1, borderRadius: 10, backgroundColor: colors.backgroundSecondary, overflow: 'hidden', elevation: 2 }}>
                            <Pressable android_ripple={{ color: colors.ripple, borderless: true, foreground: true }} style={{ padding: 8 }} onPress={changeFollowingStatus}>
                                <Text style={{ color: colors.text, flex: 1, textAlign: "center", fontWeight: "bold", fontSize: 12 }}>{followingStatus === true ? "Unfollow" : "Follow"}</Text>
                            </Pressable>
                        </View>}
                    </View>
                    {profile.featuredProject && <ProjectCard project={profile.featuredProject} width={width - 40} style={{ margin: "auto", marginTop: 0 }} />}
                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 30, paddingBottom: 0, gap: 10 }}>
                        <MaterialIcons name='auto-awesome' size={24} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Created Projects</Text>
                    </View>
                    <ScrollView horizontal contentContainerStyle={{ padding: 20, columnGap: 10 }} showsHorizontalScrollIndicator={false}>
                        {projects?.map((project) => (<ProjectCard project={{ ...project }} key={project.id} />))}
                    </ScrollView>

                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 0, gap: 10 }}>
                        <MaterialIcons name='star' size={24} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Favorites</Text>
                    </View>
                    <ScrollView horizontal contentContainerStyle={{ padding: 20, columnGap: 10 }} showsHorizontalScrollIndicator={false}>
                        {favorites?.map((project) => (<ProjectCard project={{ ...project }} key={project.id} />))}
                    </ScrollView>

                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 0, gap: 10 }}>
                        <MaterialIcons name='collections' size={24} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Curated Studios</Text>
                    </View>
                    <ScrollView horizontal contentContainerStyle={{ padding: 20, columnGap: 10 }} showsHorizontalScrollIndicator={false}>
                        {curatedStudios?.map((studio) => (<StudioCard studio={{ ...studio }} key={studio.id} />))}
                    </ScrollView>
                </>)}
            </ScrollView>

        </View>
    );
}