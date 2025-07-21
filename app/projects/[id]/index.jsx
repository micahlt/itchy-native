import { View, Text, useWindowDimensions, ScrollView, Share, Platform } from "react-native";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import LinkifiedText from "../../../utils/regex/LinkifiedText";
import RemixNotice from "../../../components/RemixNotice";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ControlsSheet from "../../../components/ControlsSheet";

export default function Project() {
    const { id } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const { width } = useWindowDimensions();
    const [metadata, setMetadata] = useState(null);
    const [interactions, setInteractions] = useState({ loved: false, favorited: false });
    const [controlsOpen, setControlsOpen] = useState(false);
    const [controlsHeight, setControlsHeight] = useState(300);
    const [username] = useMMKVString("username");
    const [token] = useMMKVString("token");
    const router = useRouter();
    const twLink = useTurbowarpLink(id);
    const insets = useSafeAreaInsets();
    const webViewRef = useRef(null);
    const { height: appHeight } = useWindowDimensions();

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
    window.ReactNativeWebView.postMessage("Itchy Custom Code initialized");
    document.documentElement.style.setProperty('--ui-white', '${colors.backgroundSecondary}');
    document.querySelector("img[title='Open advanced settings']").style.filter = "invert(0.7)";
    document.querySelector("img[title='Full Screen Control']").style.filter = "contrast(0) brightness(1.4)";
    (function () {
    if (window.itchyInputInitialized) return;
    window.itchyInputInitialized = true;

    const activeKeys = new Set();

    function updateVMKeysPressed() {
        const keyboard = window.vm?.runtime?.ioDevices?.keyboard;
        if (keyboard) {
          // Replace the internal list directly with a copy of our current set
            keyboard._keysPressed = Array.from(activeKeys);
        }
    }

    // Wait for the VM to be ready
    const waitForVM = setInterval(() => {
    const keyboard = window.vm?.runtime?.ioDevices?.keyboard;
    if (keyboard && keyboard._keysPressed) {
      clearInterval(waitForVM);

      // Start the message listener
      window.addEventListener("message", (e) => {
        try {
          const { key, type } = JSON.parse(e.data);
          if (!key || !type) return;

          if (type === "keydown") {
            activeKeys.add(keyboard._keyStringToScratchKey(key));
          } else if (type === "keyup") {
            activeKeys.delete(keyboard._keyStringToScratchKey(key));
          }

          updateVMKeysPressed();
          window.ReactNativeWebView?.postMessage("Active: [" + Array.from(activeKeys).join(", ") + "]");
        } catch (err) {
          console.error("Error parsing itchy key message:", err);
        }
      });

      // Keep syncing held keys to the VM at ~60fps
      setInterval(updateVMKeysPressed, 16);
    }   
  }, 100);
})();
true;`

    const sendKeyEvent = (key, type) => {
        const message = JSON.stringify({ key, type });
        webViewRef.current?.injectJavaScript(`
    (function(){
      window.postMessage(${JSON.stringify(message)},'*');
    })();
    true;
    `)
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen
                options={{
                    title: metadata?.title || "Loading...",
                    headerRight: () => <><MaterialIcons.Button onPressIn={() => setControlsOpen(true)} name='videogame-asset' size={24} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} /><MaterialIcons.Button onPressIn={() => router.push(`/projects/${id}/comments`)} name='question-answer' size={24} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} /></>
                }}
            />
            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}>
                <WebView
                    source={{ uri: twLink }}
                    containerStyle={{
                        flex: 0,
                        marginTop: 5,
                        width: width - 40,
                        aspectRatio: 480 / 425,
                        margin: "auto",
                        borderRadius: 10,
                    }}
                    androidLayerType="hardware"
                    renderToHardwareTextureAndroid={true}
                    bounces={false}
                    scrollEnabled={false}
                    overScrollMode="never"
                    allowsFullscreenVideo={true}
                    style={{ backgroundColor: "transparent" }}
                    injectedJavaScript={twJSInject}
                    ref={webViewRef}
                    onMessage={(e) => console.log("WebView | ", e.nativeEvent.data)}
                    onLayout={(event) => {
                        const { x, y, width, height } = event.nativeEvent.layout;
                        setControlsHeight(appHeight - (y + height + insets.top - 8)); // Update controlsHeight based on the WebView's position
                    }}
                />
                {metadata && <ScrollView horizontal contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 20, columnGap: 10 }} showsHorizontalScrollIndicator={false}>
                    <Chip.Image imageURL={metadata.author?.profile?.images["32x32"]} text={metadata.author?.username} onPress={() => router.push(`/users/${metadata?.author?.username}`)} textStyle={{ fontWeight: 'bold' }} />
                    <Chip.Icon icon='favorite' text={approximateNumber(metadata.stats.loves)} color="#ff4750" mode={interactions.loved ? "filled" : "outlined"} onPress={() => toggleInteraction("love")} />
                    <Chip.Icon icon='star' text={approximateNumber(metadata.stats.favorites)} color="#ddbf37" mode={interactions.favorited ? "filled" : "outlined"} onPress={() => toggleInteraction("favorite")} />
                    <Chip.Icon icon='sync' text={approximateNumber(metadata.stats.remixes)} color={isDark ? "#32ee87" : "#0ca852"} mode="filled" />
                    <Chip.Icon icon='visibility' text={approximateNumber(metadata.stats.views)} color="#47b5ff" mode="filled" />
                    <Chip.Icon icon='share' text="Share" color="#7847ff" mode="filled" onPress={() => Share.share(Platform.OS === "android" ? {
                        message: `https://scratch.mit.edu/projects/${id}`,
                        dialogTitle: "Share this project"
                    } : {
                        url: `https://scratch.mit.edu/projects/${id}`,
                        message: "Check out this project on Scratch!",
                    }, {
                        dialogTitle: "Share this project",
                        tintColor: colors.accent
                    })} />
                </ScrollView>}
                {metadata?.remix?.parent && <RemixNotice originalProjectID={metadata?.remix?.parent} />}
                {metadata?.instructions && <Card style={{ margin: 20, marginTop: 0, marginBottom: 10, padding: 16 }}>
                    <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 16, marginBottom: 10 }}>Instructions</Text>
                    <LinkifiedText style={{ color: colors.text }} text={metadata?.instructions} />
                </Card>}
                {metadata?.description && <Card style={{ margin: 20, marginTop: 0, marginBottom: 10, padding: 16 }}>
                    <Text style={{ fontWeight: "bold", color: colors.text, fontSize: 16, marginBottom: 10 }}>Credits</Text>
                    <LinkifiedText style={{ color: colors.text }} text={metadata?.description} />
                </Card>}
                {dateInfo && <Card style={{ margin: 20, marginTop: 0, marginBottom: 30, padding: 16 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Created {dateInfo.created}</Text>
                    {dateInfo.modified != dateInfo.created && <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Modified {dateInfo.modified}</Text>}
                </Card>}
            </ScrollView>
            <ControlsSheet onControlPress={sendKeyEvent} onClose={() => setControlsOpen(false)} opened={controlsOpen} height={controlsHeight} projectId={id} />
        </View>
    );
}