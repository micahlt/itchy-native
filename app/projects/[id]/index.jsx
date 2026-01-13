import {
  View,
  useWindowDimensions,
  Share,
  ScrollView,
  Platform,
} from "react-native";
import ItchyText from "../../../components/ItchyText";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import WebView from "react-native-webview";
import Chip from "../../../components/Chip";
import TexturedButton from "../../../components/TexturedButton";
import Card from "../../../components/Card";
import approximateNumber from "approximate-number";
import { Image } from "expo-image";
import { useMMKVString, useMMKVBoolean } from "react-native-mmkv";
import storage from "../../../utils/storage";
import useTurbowarpLink from "../../../utils/hooks/useTurbowarpLink";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import timeago from "time-ago";
import LinkifiedText from "../../../utils/regex/LinkifiedText";
import RemixNotice from "../../../components/RemixNotice";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Controls from "../../../components/Controls";
import MultiPlayConfigSheet from "../../../components/MultiPlayConfigSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import {
  Gesture,
  GestureDetector,
  ScrollView as GHScrollView
} from "react-native-gesture-handler";
import Animated, { FadeInRight } from "react-native-reanimated";
import {
  getLiquidPlusPadding,
} from "../../../utils/platformUtils";
import injectedWebviewCode from "../../../utils/webview-inject";
import { getCrashlytics, log, recordError } from "@react-native-firebase/crashlytics";
import PressableIcon from "components/PressableIcon";
const c = getCrashlytics();

function GestureDetectorOptional({ children }) {
  const pan = Gesture.Pan()
    .enabled(true)
    .minDistance(5)
    .activateAfterLongPress(0) // Activate immediately
    .manualActivation(false)
    .shouldCancelWhenOutside(false);
  if (Platform.OS == "ios") {
    return <>{children}</>
  } else {
    return <GestureDetector gesture={pan}>
      {children}
    </GestureDetector>
  }
}

export default function Project() {
  const { id } = useLocalSearchParams();
  const { colors, dimensions, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [metadata, setMetadata] = useState(null);
  const [interactions, setInteractions] = useState({
    loved: false,
    favorited: false,
  });
  const [username] = useMMKVString("username");
  const [token] = useMMKVString("token");
  const [deferProjectLoading] = useMMKVBoolean("deferProjectLoading");
  const [manuallyLoaded, setManuallyLoaded] = useState(false);
  const router = useRouter();
  const twLink = useTurbowarpLink(id);
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const onlineConfigSheetRef = useRef(null);
  const [connected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [peerConnected, setPeerConnected] = useState(false);
  const [isMaxed, setIsMaxed] = useState(false);

  const sendKeyEvent = (key, type, source = "local") => {
    const message = JSON.stringify({ key, type });
    log(c, `Sending key event to WebView: ${message}`)
    webViewRef.current?.injectJavaScript(`
            (function(){
                window.postMessage(${JSON.stringify(message)},'*');
            })();
            true;`);
  };

  const dateInfo = useMemo(() => {
    return {
      created: timeago.ago(metadata?.history?.created),
      modified: timeago.ago(metadata?.history?.modified),
    };
  }, [metadata?.history]);

  useEffect(() => {
    log(c, "Project page rendered");
    if (!id) return;
    log(c, `Project ID is ${id}`);
    ScratchAPIWrapper.project
      .getProject(id)
      .then((d) => {
        if (d.code == "NotFound") {
          router.replace("/error?errorText=Couldn't find that project.");
          log(c, "Project was not found")
          return;
        } else if (!!d?.code) {
          log(c, `Other project metadata fetching error: ${d?.code}`)
          return;
        }
        setMetadata(d);
      })
      .catch((error) => {
        console.error(error);
        log(c, "Project metadata fetch failed")
        recordError(c, error);
      });
    if (!!username) {
      log(c, "User is authenticated, fetching interaction data");
      ScratchAPIWrapper.project
        .getInteractions(id, username, token)
        .then((d) => {
          log(c, "Got interaction data");
          setInteractions(d);
        })
        .catch((error) => {
          console.error(error);
          log(c, "Error getting project interactions")
          recordError(c, error);
        });
    }
  }, [id]);

  const toggleInteraction = (interaction) => {
    log(c, `Toggling interaction ${interaction} on project ${id}`);
    if (interaction == "love") {
      ScratchAPIWrapper.project
        .setInteraction(
          "loves",
          !interactions.loved,
          id,
          username,
          token,
          storage.getString("csrfToken"),
          storage.getString("cookieSet")
        )
        .then((d) => {
          if (!d.statusChanged) return;
          setInteractions({ ...interactions, loved: !interactions.loved });
          setMetadata({
            ...metadata,
            stats: {
              ...metadata.stats,
              loves: metadata.stats.loves + (interactions.loved ? -1 : 1),
            },
          });
        })
        .catch((error) => {
          console.error(error);
          log(c, "Error toggling project love")
          recordError(c, error);
        });
    } else if (interaction == "favorite") {
      ScratchAPIWrapper.project
        .setInteraction(
          "favorites",
          !interactions.favorited,
          id,
          username,
          token,
          storage.getString("csrfToken"),
          storage.getString("cookieSet")
        )
        .then((d) => {
          if (!d.statusChanged) return;
          setInteractions({ ...interactions, favorited: !interactions.favorited });
          setMetadata({
            ...metadata,
            stats: {
              ...metadata.stats,
              favorites:
                metadata.stats.favorites + (interactions.favorited ? -1 : 1),
            },
          });
        }).catch((error) => {
          console.error(error);
          log(c, "Error toggling project favorite")
          recordError(c, error);
        })
    }
  };

  const iceServers = useMemo(() => {
    const servers = [{ urls: 'stun:stun.l.google.com:19302' }];
    if (process.env.EXPO_PUBLIC_TURN_USERNAME &&
      process.env.EXPO_PUBLIC_TURN_CREDENTIAL &&
      process.env.EXPO_PUBLIC_TURN_SERVER_URL) {
      servers.push(
        {
          urls: `turn:${process.env.EXPO_PUBLIC_TURN_SERVER_URL}:80`,
          username: process.env.EXPO_PUBLIC_TURN_USERNAME,
          credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL,
        },
        {
          urls: `turn:${process.env.EXPO_PUBLIC_TURN_SERVER_URL}:80?transport=tcp`,
          username: process.env.EXPO_PUBLIC_TURN_USERNAME,
          credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL,
        },
        {
          urls: `turn:${process.env.EXPO_PUBLIC_TURN_SERVER_URL}:443`,
          username: process.env.EXPO_PUBLIC_TURN_USERNAME,
          credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL,
        },
        {
          urls: `turns:${process.env.EXPO_PUBLIC_TURN_SERVER_URL}:443?transport=tcp`,
          username: process.env.EXPO_PUBLIC_TURN_USERNAME,
          credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL,
        }
      );
    }
    return servers;
  }, []);

  const twJSInject = `(${injectedWebviewCode.toString()})(${JSON.stringify({
    color: colors.backgroundSecondary,
    iceServers
  })});`;

  const openOnlineConfigSheet = () => {
    onlineConfigSheetRef.current?.expand();
  };

  const closeOnlineConfigSheet = () => {
    onlineConfigSheetRef.current?.close();
  };

  const moveMouse = useCallback(
    (data) => {
      console.log("TODO: mouse");
      console.log(data);
    },
    [webViewRef, connected, roomCode]
  );

  const webViewMessageHandler = (e) => {
    console.log("WebView | ", e.nativeEvent.data);
    try {
      const d = JSON.parse(e.nativeEvent.data);
      switch (d.type) {
        case "mouse":
          return moveMouse(d);
        case "room-created":
          setRoomCode(d.roomCode);
          setConnectionStatus("waiting-for-peer");
          break;
        case "peer-joined":
          setPeerConnected(true);
          setConnectionStatus("peer-connected");
          break;
        case "rtc-connection-state":
          setConnectionStatus(d.payload);
          if (d.payload === "connected") {
            setIsConnected(true);
          } else if (d.payload === "disconnected" || d.payload === "closed") {
            setIsConnected(false);
            setPeerConnected(false);
            setRoomCode("");
            setConnectionStatus("idle");
          } else if (d.payload === "failed") {
            setIsConnected(false);
            setPeerConnected(false);
            setRoomCode("");
            setConnectionStatus("failed");
          }
          break;
        case "peer-disconnected":
          setPeerConnected(false);
          setIsConnected(false);
          // setRoomCode("");
          setConnectionStatus("waiting-for-peer");
          break;
        case "signaling-open":
          setConnectionStatus("signaling-connected");
          break;
        case "webrtc-error":
          setConnectionStatus("error");
          console.warn("WebRTC Error:", d.payload);
          break;
        case "request-metadata":
          // Send project metadata to WebView
          if (metadata) {
            const metadataToSend = {
              id: id,
              title: metadata.title,
              author: metadata.author,
              instructions: metadata.instructions,
              description: metadata.description,
              stats: metadata.stats,
              history: metadata.history,
              remix: metadata.remix,
            };
            const message = {
              type: "project-metadata",
              metadata: metadataToSend,
            };
            webViewRef.current?.injectJavaScript(`
              (function(){
                  window.postMessage(${JSON.stringify(message)},'*');
              })();
              true;`);
          }
          break;
        case "metadata-sent":
          console.log("Project metadata sent to peer:", d.payload);
          break;
      }
    } catch {
      return;
    }
  };

  const createRoom = useCallback(() => {
    console.log("CREATING")
    const message = { type: "startMultiPlaySession" };
    webViewRef.current?.injectJavaScript(`
            (function(){
                window.postMessage(${JSON.stringify(message)},'*');
            })();
            true;`);
  }, [webViewRef]);

  const disconnect = useCallback(() => {
    // Reset all connection states
    setIsConnected(false);
    setPeerConnected(false);
    setRoomCode("");
    setConnectionStatus("idle");

    const message = { type: "endMultiPlaySession" };
    webViewRef.current?.injectJavaScript(`
            (function(){
                window.postMessage(${JSON.stringify(message)},'*');
            })();
            true;`);
  }, [webViewRef]);

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen
          options={{
            title: metadata?.title || "Loading...",
            headerShown: !isMaxed,
            headerRight: () => (
              <>
                <PressableIcon
                  onPress={() => router.push(`/projects/${id}/comments`)}
                  name="chatbubble-ellipses"
                  size={24}
                  color={colors.textSecondary}
                  backgroundColor="transparent"
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 0
                  }}
                />
              </>
            ),
          }}
        />
        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + 10,
            paddingTop: isMaxed ? insets.top : getLiquidPlusPadding(0, 120),
          }}
        >
          <GestureDetectorOptional>
            {!deferProjectLoading || manuallyLoaded ? (
              <WebView
                source={{ uri: twLink }}
                containerStyle={{
                  flex: 0,
                  marginTop: 5,
                  width: isMaxed ? width : width - 40,
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
                mediaPlaybackRequiresUserAction={false}
                mediaCapturePermissionGrantType="grant"
                style={{ backgroundColor: "transparent" }}
                setBuiltInZoomControls={false}
                nestedScrollEnabled={true}
                injectedJavaScript={twJSInject}
                ref={webViewRef}
                onMessage={webViewMessageHandler}
                onLayout={(event) => {
                  const { y, height } = event.nativeEvent.layout;
                }}
              />
            ) : (
              <View
                style={{
                  marginTop: 5,
                  width: isMaxed ? width : width - 40,
                  aspectRatio: 480 / 425,
                  margin: "auto",
                  borderRadius: 10,
                  backgroundColor: colors.backgroundSecondary,
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                {metadata && (
                  <Image
                    source={{
                      uri: metadata.thumbnail_url
                        ? `https:${metadata.thumbnail_url}`
                        : metadata.image,
                    }}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      opacity: 0.5,
                    }}
                    contentFit="cover"
                    transition={200}
                    blurRadius={5}
                  />
                )}
                <TexturedButton
                  onPress={() => setManuallyLoaded(true)}
                  icon="play"
                  iconSide="left"
                  style={{ backgroundColor: colors.accent }}
                  textStyle={{ color: "white" }}
                >
                  Load project
                </TexturedButton>
              </View>
            )}
          </GestureDetectorOptional>
          {metadata && (
            <GHScrollView
              horizontal
              contentContainerStyle={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                columnGap: 5,
              }}
              showsHorizontalScrollIndicator={false}
            >
              {isMaxed && (
                <Animated.View entering={FadeInRight.delay(50)}>
                  <Chip.Icon
                    icon="close-fullscreen"
                    text="Exit Play Mode"
                    onPress={() => setIsMaxed(false)}
                  />
                </Animated.View>
              )}
              <Animated.View entering={FadeInRight.delay(100)}>
                <Chip.Image
                  imageURL={metadata.author?.profile?.images["32x32"]}
                  text={metadata.author?.username}
                  onPress={() =>
                    router.push(`/users/${metadata?.author?.username}`)
                  }
                  textStyle={{ fontWeight: "bold" }}
                  mode={undefined}
                  color={colors.text}
                />
              </Animated.View>
              <Animated.View entering={FadeInRight.delay(150)}>
                <Chip.Icon
                  icon="heart"
                  text={approximateNumber(metadata.stats.loves)}
                  color="#ff4750"
                  mode={interactions.loved ? "filled" : "outlined"}
                  onPress={() => toggleInteraction("love")}
                  provider="gesture-handler"
                />
              </Animated.View>
              <Animated.View entering={FadeInRight.delay(200)}>
                <Chip.Icon
                  icon="star"
                  text={approximateNumber(metadata.stats.favorites)}
                  color="#ddbf37"
                  mode={interactions.favorited ? "filled" : "outlined"}
                  onPress={() => toggleInteraction("favorite")}
                  provider="gesture-handler"
                />
              </Animated.View>
              <Animated.View entering={FadeInRight.delay(250)}>
                <Chip.Icon
                  icon="sync"
                  text={approximateNumber(metadata.stats.remixes)}
                  color={isDark ? "#32ee87" : "#0ca852"}
                  mode="filled"
                  provider="gesture-handler"
                />
              </Animated.View>
              <Animated.View entering={FadeInRight.delay(300)}>
                <Chip.Icon
                  icon="eye"
                  text={approximateNumber(metadata.stats.views)}
                  color="#47b5ff"
                  mode="filled"
                  provider="gesture-handler"
                />
              </Animated.View>
              <Animated.View entering={FadeInRight.delay(350)}>
                <Chip.Icon
                  icon="radio"
                  text="MultiPlay"
                  color="#4769ff"
                  mode="filled"
                  onPress={openOnlineConfigSheet}
                  provider="gesture-handler"
                />
              </Animated.View>
              <Animated.View entering={FadeInRight.delay(400)}>
                <Chip.Icon
                  icon="share"
                  text="Share"
                  color="#7847ff"
                  mode="filled"
                  onPress={() =>
                    Share.share(
                      Platform.OS === "android"
                        ? {
                          message: `https://scratch.mit.edu/projects/${id}`,
                          dialogTitle: "Share this project",
                        }
                        : {
                          url: `https://scratch.mit.edu/projects/${id}`,
                          message: "Check out this project on Scratch!",
                        },
                      {
                        dialogTitle: "Share this project",
                        tintColor: colors.accent,
                      }
                    )
                  }
                  provider="gesture-handler"
                />
              </Animated.View>
            </GHScrollView>
          )}
          {!isMaxed && (
            <>
              {metadata?.remix?.parent && (
                <RemixNotice originalProjectID={metadata?.remix?.parent} />
              )}
              <Controls
                onControlPress={sendKeyEvent}
                projectId={id}
                showConfiguration={true}
                style={{ margin: 20, marginTop: 0, marginBottom: 0 }}
              />
              {metadata?.instructions && (
                <Card
                  style={{
                    margin: 20,
                    marginTop: 0,
                    marginBottom: 10,
                    padding: 16,
                    borderRadius: dimensions.mediumRadius,
                  }}
                >
                  <ItchyText
                    style={{
                      fontWeight: "bold",
                      color: colors.text,
                      fontSize: 16,
                      marginBottom: 10,
                    }}
                  >
                    Instructions
                  </ItchyText>
                  <LinkifiedText
                    style={{ color: colors.text }}
                    text={metadata?.instructions}
                  />
                </Card>
              )}
              {metadata?.description && (
                <Card
                  style={{
                    margin: 20,
                    marginTop: 0,
                    marginBottom: 10,
                    padding: 16,
                    borderRadius: dimensions.mediumRadius,
                  }}
                >
                  <ItchyText
                    style={{
                      fontWeight: "bold",
                      color: colors.text,
                      fontSize: 16,
                      marginBottom: 10,
                    }}
                  >
                    Credits
                  </ItchyText>
                  <LinkifiedText
                    style={{ color: colors.text }}
                    text={metadata?.description}
                  />
                </Card>
              )}
              {dateInfo && (
                <Card
                  style={{
                    margin: 20,
                    marginTop: 0,
                    marginBottom: 30,
                    padding: 16,
                    borderRadius: dimensions.mediumRadius,
                  }}
                >
                  <ItchyText
                    style={{ color: colors.textSecondary, fontSize: 12 }}
                  >
                    Created {dateInfo.created}
                  </ItchyText>
                  {dateInfo.modified != dateInfo.created && (
                    <ItchyText
                      style={{ color: colors.textSecondary, fontSize: 12 }}
                    >
                      Modified {dateInfo.modified}
                    </ItchyText>
                  )}
                </Card>
              )}
            </>
          )}
        </ScrollView>
      </View>
      <BottomSheet
        ref={onlineConfigSheetRef}
        index={-1}
        snapPoints={[]}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: colors.background,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.backgroundTertiary }}
      >
        <MultiPlayConfigSheet
          connected={connected}
          roomCode={roomCode}
          connectionStatus={connectionStatus}
          peerConnected={peerConnected}
          onClose={closeOnlineConfigSheet}
          createRoom={createRoom}
          disconnect={disconnect}
        />
      </BottomSheet>
    </>
  );
}
