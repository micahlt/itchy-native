import { View, useWindowDimensions, ScrollView, Text, Pressable } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import Card from "../../../components/Card";
import ProjectCard from "../../../components/ProjectCard";
import { Image } from "expo-image";
import approximateNumber from "approximate-number";
import timeago from "time-ago";
import { flag } from "country-emoji";

export default function User() {
    const { username } = useLocalSearchParams();
    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const [profile, setProfile] = useState(null);
    useEffect(() => {
        ScratchAPIWrapper.user.getProfile(username).then((d) => {
            setProfile(d);
        }).catch(console.error)
    }, [username]);
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: `About ${username}`
                }}
            />
            {!!profile && (
                <ScrollView style={{ padding: 10 }}>
                    <Card style={{ marginBottom: 10, padding: 16 }}>
                        <Text style={{ fontWeight: "bold", color: colors.accent, fontSize: 16, marginBottom: 10 }}>About Me</Text>
                        <Text style={{ color: colors.text, }}>{profile.profile.bio}</Text>
                    </Card>
                    <Card style={{ marginBottom: 10, padding: 16 }}>
                        <Text style={{ fontWeight: "bold", color: colors.accent, fontSize: 16, marginBottom: 10 }}>What I'm Working On</Text>
                        <Text style={{ color: colors.text, }}>{profile.profile.status}</Text>
                    </Card>
                    <Card style={{ marginBottom: 10, padding: 16 }}>
                        <Text style={{ color: colors.text }}>Joined <Text style={{ fontWeight: "bold" }}>{timeago.ago(profile.history.joined)}</Text>   |   from <Text style={{ fontWeight: "bold" }}>{profile.profile.country}  {flag(profile.profile.country)}</Text></Text>
                    </Card>
                </ScrollView>
            )}
        </View>
    );
}