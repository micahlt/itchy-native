import { View, Text, useWindowDimensions, ScrollView } from "react-native";
import { useTheme } from "../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScratchAPIWrapper from "../../utils/api-wrapper";
import WebView from "react-native-webview";
import Chip from "../../components/Chip";
import Card from "../../components/Card";
import approximateNumber from "approximate-number";

export default function Project() {
    const { id } = useLocalSearchParams();
    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const [metadata, setMetadata] = useState(null);
    const router = useRouter();
    useEffect(() => {
        ScratchAPIWrapper.project.getProject(id).then((d) => {
            setMetadata(d);
        }).catch(console.error)
    }, [id]);
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: metadata?.title || "Loading...",
                }}
            />
            <ScrollView>
                <WebView source={{ uri: `https://turbowarp.org/${id}/embed?fullscreen-background=${colors.background}&settings-button` }} style={{ flex: 0, width: width - 20, aspectRatio: 480 / 425, backgroundColor: "transparent", margin: "auto" }} androidLayerType="hardware" renderToHardwareTextureAndroid={true} bounces={false} scrollEnabled={false} overScrollMode="never" allowsFullscreenVideo={true} />
                {metadata && <ScrollView horizontal contentContainerStyle={{ padding: 10, columnGap: 10 }} showsHorizontalScrollIndicator={false}>
                    <Chip.Image imageURL={metadata.author?.profile?.images["32x32"]} text={metadata.author?.username} onPress={() => router.push(`/user/${metadata?.author?.username}/profile`)} />
                    <Chip.Icon icon='favorite' text={approximateNumber(metadata.stats.loves)} color="#ff4750" />
                    <Chip.Icon icon='star' text={approximateNumber(metadata.stats.favorites)} color="#ddbf37" />
                    <Chip.Icon icon='sync' text={approximateNumber(metadata.stats.remixes)} color="#47ff9a" />
                    <Chip.Icon icon='visibility' text={approximateNumber(metadata.stats.views)} color="#47b5ff" />
                </ScrollView>}
                {metadata?.instructions && <Card style={{ margin: 10, marginTop: 3, padding: 16 }}>
                    <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 16, marginBottom: 10 }}>Instructions</Text>
                    <Text style={{ color: colors.text, }}>{metadata?.instructions}</Text>
                </Card>}
                {metadata?.description && <Card style={{ margin: 10, marginTop: 3, padding: 16 }}>
                    <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 16, marginBottom: 10 }}>Credits</Text>
                    <Text style={{ color: colors.text, }}>{metadata?.description}</Text>
                </Card>}
            </ScrollView>
        </View>
    );
}