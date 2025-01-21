import { View, useWindowDimensions, ScrollView, Text, Pressable, Linking } from "react-native";
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

export default function User() {
    const { username } = useLocalSearchParams();
    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const [profile, setProfile] = useState(null);
    const [projects, setProjects] = useState(null);
    const [favorites, setFavorites] = useState(null);
    useEffect(() => {
        ScratchAPIWrapper.user.getCompleteProfile(username).then((d) => {
            setProfile(d);
        }).catch(console.error)
        ScratchAPIWrapper.user.getProjects(username).then((d) => {
            setProjects(d);
        }).catch(console.error)
        ScratchAPIWrapper.user.getFavorites(username).then((d) => {
            setFavorites(d);
        }).catch(console.error)
    }, [username]);

    const openProfile = () => {
        linkWithFallback(`https://scratch.mit.edu/users/${username}`, colors.accent);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: username,
                    headerRight: () => <View style={{ overflow: 'hidden', height: 36, width: 36, borderRadius: 20 }}>
                        <Pressable onPress={openProfile} style={{ padding: 6 }} android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}>
                            <MaterialIcons name='launch' size={24} color={colors.textSecondary} />
                        </Pressable></View>
                }}
            />
            {!!profile && (
                <ScrollView>
                    <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 0 }}>
                        <Image source={{ uri: profile.profile.images["90x90"] }} placeholder={require("../../../assets/avatar.png")} placeholderContentFit="cover" style={{ height: 75, width: 75, borderRadius: 75, marginRight: 25, backgroundColor: "white" }} />
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginRight: 10, flex: 1 }}>
                            <View style={{ alignItems: "center" }}>
                                <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{approximateNumber(profile.followers)}</Text>
                                <Text style={{ color: colors.text, fontSize: 12 }}>Followers</Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{approximateNumber(profile.following)}</Text>
                                <Text style={{ color: colors.text, fontSize: 12 }}>Following</Text>
                            </View>
                            <View style={{ alignItems: "center" }}>
                                <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}>{new Date(profile.history.joined).getFullYear()}</Text>
                                <Text style={{ color: colors.text, fontSize: 12 }}>Joined </Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 15, columnGap: 10, paddingHorizontal: 20 }}>
                        <View style={{ flex: 1, borderRadius: 10, backgroundColor: colors.backgroundSecondary, overflow: 'hidden', elevation: 2 }}>
                            <Pressable android_ripple={{ color: colors.ripple, borderless: true, foreground: true }} style={{ padding: 8 }}>
                                <Text style={{ color: colors.text, flex: 1, textAlign: "center", fontWeight: "bold" }}>Follow</Text>
                            </Pressable>
                        </View>
                        <View style={{ flex: 1, borderRadius: 10, backgroundColor: colors.backgroundSecondary, overflow: 'hidden', elevation: 2 }}>
                            <Pressable android_ripple={{ color: colors.ripple, borderless: true, foreground: true }} style={{ padding: 8 }} onPress={() => router.push(`/user/${username}/about`)}>
                                <Text style={{ color: colors.text, flex: 1, textAlign: "center", fontWeight: "bold" }}>About</Text>
                            </Pressable>
                        </View>
                    </View>
                    {profile.featuredProject && <ProjectCard project={profile.featuredProject} width={width - 40} style={{ margin: "auto", marginTop: 10 }} />}
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
                </ScrollView>
            )}
        </View>
    );
}