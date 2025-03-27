import { View, Text, useWindowDimensions, ScrollView, Share } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from 'expo-sharing';
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import WebView from "react-native-webview";
import Chip from "../../../components/Chip";
import Card from "../../../components/Card";
import approximateNumber from "approximate-number";
import { useMMKVString } from "react-native-mmkv";
import storage from "../../../utils/storage";
import useTurbowarpLink from "../../../utils/hooks/useTurbowarpLink";
import { MaterialIcons } from "@expo/vector-icons";
import timeago from "time-ago";

export default function Project() {
    const { id } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const { width } = useWindowDimensions();
    const [metadata, setMetadata] = useState(null);
    const [interactions, setInteractions] = useState({ loved: false, favorited: false });
    const [username] = useMMKVString("username");
    const [token] = useMMKVString("token");
    const router = useRouter();
    const twLink = useTurbowarpLink(id);

    const dateInfo = useMemo(() => {
        return {
            created: timeago.ago(metadata?.history?.created),
            modified: timeago.ago(metadata?.history?.modified)
        }
    }, [metadata?.history]);

    useEffect(() => {
        if (!id) return;
        ScratchAPIWrapper.project.getProject(id).then((d) => {
            if (d.code == "NotFound") {
                router.replace("/error?errorText=Couldn't find that project.");
                return;
            } else if (!!d?.code) {
                return;
            }
            setMetadata(d);
        }).catch(console.error);
        if (!!username) {
            ScratchAPIWrapper.project.getInteractions(id, username, token).then((d) => {
                setInteractions(d);
            }).catch(console.error);
        }
    }, [id]);

    const toggleInteraction = (interaction) => {
        if (interaction == "love") {
            ScratchAPIWrapper.project.setInteraction("loves", !interactions.loved, id, username, token, storage.getString("csrfToken"), storage.getString("cookieSet")).then((d) => {
                if (!d.statusChanged) return;
                setInteractions({ ...interactions, loved: !interactions.loved });
                setMetadata({ ...metadata, stats: { ...metadata.stats, loves: metadata.stats.loves + (interactions.loved ? -1 : 1) } });
            });
        } else if (interaction == "favorite") {
            ScratchAPIWrapper.project.setInteraction("favorites", !interactions.favorited, id, username, token, storage.getString("csrfToken"), storage.getString("cookieSet")).then((d) => {
                if (!d.statusChanged) return;
                setInteractions({ ...interactions, loved: !interactions.favorited });
                setMetadata({ ...metadata, stats: { ...metadata.stats, favorites: metadata.stats.favorites + (interactions.favorited ? -1 : 1) } });
            });
        }
    }

    const twJSInject = `
    document.documentElement.style.setProperty('--ui-white', '${colors.backgroundSecondary}');
    document.querySelector("img[title='Open advanced settings']").style.filter = "invert(0.7)";
    document.querySelector("img[title='Full Screen Control']").style.filter = "contrast(0) brightness(1.4)";
    `

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: metadata?.title || "Loading...",
                    headerRight: () => <MaterialIcons.Button onPressIn={() => router.push(`/projects/${id}/comments`)} name='question-answer' size={22} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} />
                }}
            />
            <ScrollView>
                <WebView source={{ uri: twLink }} containerStyle={{ flex: 0, marginTop: 5, width: width - 20, aspectRatio: 480 / 425, margin: "auto", borderRadius: 10 }} androidLayerType="hardware" renderToHardwareTextureAndroid={true} bounces={false} scrollEnabled={false} overScrollMode="never" allowsFullscreenVideo={true} style={{ backgroundColor: "transparent", }} injectedJavaScript={twJSInject} />
                {metadata && <ScrollView horizontal contentContainerStyle={{ padding: 10, columnGap: 10 }} showsHorizontalScrollIndicator={false}>
                    <Chip.Image imageURL={metadata.author?.profile?.images["32x32"]} text={metadata.author?.username} onPress={() => router.push(`/users/${metadata?.author?.username}`)} textStyle={{ fontWeight: 'bold' }} />
                    <Chip.Icon icon='favorite' text={approximateNumber(metadata.stats.loves)} color="#ff4750" mode={interactions.loved ? "filled" : "outlined"} onPress={() => toggleInteraction("love")} />
                    <Chip.Icon icon='star' text={approximateNumber(metadata.stats.favorites)} color="#ddbf37" mode={interactions.favorited ? "filled" : "outlined"} onPress={() => toggleInteraction("favorite")} />
                    <Chip.Icon icon='sync' text={approximateNumber(metadata.stats.remixes)} color={isDark ? "#32ee87" : "#0ca852"} mode="filled" />
                    <Chip.Icon icon='visibility' text={approximateNumber(metadata.stats.views)} color="#47b5ff" mode="filled" />
                    <Chip.Icon icon='share' text="Share" color="#7847ff" mode="filled" onPress={() => Share.share({
                        url: `https://scratch.mit.edu/projects/${id}`,
                        title: "Share this project"
                    }, {
                        dialogTitle: "Share this project",
                        tintColor: colors.accent
                    })} />
                </ScrollView>}
                {metadata?.instructions && <Card style={{ margin: 10, marginTop: 0, padding: 16 }}>
                    <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 16, marginBottom: 10 }}>Instructions</Text>
                    <Text style={{ color: colors.text, }}>{metadata?.instructions}</Text>
                </Card>}
                {metadata?.description && <Card style={{ margin: 10, marginTop: 0, padding: 16 }}>
                    <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 16, marginBottom: 10 }}>Credits</Text>
                    <Text style={{ color: colors.text }}>{metadata?.description}</Text>
                </Card>}
                {dateInfo && <Card style={{ margin: 10, marginTop: 0, marginBottom: 30, padding: 16 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Created {dateInfo.created}</Text>
                    {dateInfo.modified != dateInfo.created && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Modified {dateInfo.modified}</Text>}
                </Card>}
            </ScrollView>
        </View>
    );
}