import { View, useWindowDimensions, ScrollView, Share, Platform } from "react-native";
import ItchyText from "../../../components/ItchyText";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import Controls from "../../../components/Controls";
import MultiPlayConfigSheet from "../../../components/MultiPlayConfigSheet";
import BottomSheet from "@gorhom/bottom-sheet";

export default function Project() {
  const { id } = useLocalSearchParams();
  const { colors, dimensions, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [metadata, setMetadata] = useState(null);
  const [interactions, setInteractions] = useState({ loved: false, favorited: false });
  const [username] = useMMKVString("username");
  const [token] = useMMKVString("token");
  const router = useRouter();
  const twLink = useTurbowarpLink(id);
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const onlineConfigSheetRef = useRef(null);
  const { height: appHeight } = useWindowDimensions();
  const [connected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [peerConnected, setPeerConnected] = useState(false);
  const [isMaxed, setIsMaxed] = useState(false);

  const sendKeyEvent = (key, type, source = "local") => {
    const message = JSON.stringify({ key, type });
    webViewRef.current?.injectJavaScript(`
            (function(){
                window.postMessage(${JSON.stringify(message)},'*');
            })();
            true;`)
  };

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
    console.log("Toggling interaction:", interaction);
    if (interaction == "love") {
      ScratchAPIWrapper.project.setInteraction("loves", !interactions.loved, id, username, token, storage.getString("csrfToken"), storage.getString("cookieSet")).then((d) => {
        console.log("Love interaction response:", d);
        if (!d.statusChanged) return;
        setInteractions({ ...interactions, loved: !interactions.loved });
        setMetadata({ ...metadata, stats: { ...metadata.stats, loves: metadata.stats.loves + (interactions.loved ? -1 : 1) } });
      }).catch(console.error);
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

// Wait for DOM to be fully loaded before applying styles
function applyStyles() {
  try {
    document.documentElement.style.setProperty('--ui-white', '${colors.backgroundSecondary}');
    const advancedBtn = document.querySelector("img[title='Open advanced settings']");
    const fullscreenBtn = document.querySelector("span[role='button']:has(img[title='Full Screen Control'])");
    if (advancedBtn) advancedBtn.style.filter = "invert(0.7)";
    // if (fullscreenBtn) fullscreenBtn.style.filter = "contrast(0) brightness(1.4)";
    if (fullscreenBtn) fullscreenBtn.style.display = "none";
    window.ReactNativeWebView.postMessage("Styles applied successfully");
  } catch (err) {
    window.ReactNativeWebView.postMessage("Style application error: " + err.message);
  }
}

// Apply styles when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyStyles);
} else {
  applyStyles();
}

(function () {
  if (window.itchyInputInitialized) return;
  window.itchyInputInitialized = true;

  window.ReactNativeWebView.postMessage("Initializing input system...");

    const SIGNALING_MESSAGE = 'signaling-message';
    const INPUT_MESSAGE = 'forwarded-input';
    const START_STREAM_MESSAGE = 'start-stream';
    const ERROR_MESSAGE = 'webrtc-error';
    const RTC_STATE_MESSAGE = 'rtc-connection-state';

    const SIGNALING_SERVER_URL = 'wss://itchyws.micahlindley.com';
    let signalingSocket = null;

    // ICE servers configuration with environment variables
    const pcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
        ${process.env.EXPO_PUBLIC_TURN_USERNAME && process.env.EXPO_PUBLIC_TURN_CREDENTIAL && process.env.EXPO_PUBLIC_TURN_SERVER_URL ? `,
        {
          urls: "turn:${process.env.EXPO_PUBLIC_TURN_SERVER_URL}:80",
          username: "${process.env.EXPO_PUBLIC_TURN_USERNAME}",
          credential: "${process.env.EXPO_PUBLIC_TURN_CREDENTIAL}",
        },
        {
          urls: "turn:${process.env.EXPO_PUBLIC_TURN_SERVER_URL}:80?transport=tcp",
          username: "${process.env.EXPO_PUBLIC_TURN_USERNAME}",
          credential: "${process.env.EXPO_PUBLIC_TURN_CREDENTIAL}",
        },
        {
          urls: "turn:${process.env.EXPO_PUBLIC_TURN_SERVER_URL}:443",
          username: "${process.env.EXPO_PUBLIC_TURN_USERNAME}",
          credential: "${process.env.EXPO_PUBLIC_TURN_CREDENTIAL}",
        },
        {
          urls: "turns:${process.env.EXPO_PUBLIC_TURN_SERVER_URL}:443?transport=tcp",
          username: "${process.env.EXPO_PUBLIC_TURN_USERNAME}",
          credential: "${process.env.EXPO_PUBLIC_TURN_CREDENTIAL}",
        }` : ''}
      ]
    };

    let peerConnection = null;
    let canvasStream = null;
    let dataChannel = null;
    let roomCode = null;
    let peerJoined = false;

    // ---------- Peer Setup ----------
    function setupPeerConnection() {
      sendToReact("Setting up peer connection");
      peerConnection = new RTCPeerConnection(pcConfig);

      // Create data channel for metadata transmission
      dataChannel = peerConnection.createDataChannel('metadata', {
        ordered: false
      });
      setupDataChannel();

      peerConnection.onicecandidate = (event) => {
        sendToReact("onicecandidate event: " + JSON.stringify(event));
        if (event.candidate) {
          signalingSocket?.send(JSON.stringify({
            type: 'signal',
            payload: { type: 'candidate', candidate: event.candidate, roomCode }
          }));
        }
      };

      peerConnection.ondatachannel = (event) => {
        sendToReact("ondatachannel: " + JSON.stringify(event));
        // Handle additional data channels from peer if needed
      };

      peerConnection.onconnectionstatechange = () => {
        sendToReact({ type: RTC_STATE_MESSAGE, payload: peerConnection.connectionState });

        // Send project metadata when connection is established
        if (peerConnection.connectionState === 'connected') {
          sendProjectMetadata();
        }
      };
    }

    async function startStreaming() {
      const canvas = document.querySelector('canvas');
      if (!canvas.captureStream) {
        sendToReact({ type: ERROR_MESSAGE, payload: 'Canvas captureStream not supported' });
        return;
      }

      canvasStream = canvas.captureStream(60);
      canvasStream.getTracks().forEach(track => {
        track.applyConstraints({ width: 640, height: 480 });
        peerConnection.addTrack(track, canvasStream);
      });
    }

    function setupDataChannel() {
      sendToReact("Setting up data channel");

      dataChannel.onopen = () => {
        sendToReact("Data channel opened");
        // Send project metadata when data channel opens
        sendProjectMetadata();
      };

      dataChannel.onmessage = (event) => {
        console.log("Data channel message received:", event.data);
        try {
          const message = JSON.parse(event.data);

          if (message.type === INPUT_MESSAGE) {
            handleRemoteInput(message.payload);
          } else {
            // Handle keystroke messages directly
            const { key, type } = message;
            if (key && type && (type === "keyup" || type === "keydown")) {
              const keyboard = window.vm?.runtime?.ioDevices?.keyboard;
              if (keyboard && keyboard._keysPressed) {
                if (type === "keydown") {
                  activeKeys.add(keyboard._keyStringToScratchKey(key));
                } else if (type === "keyup") {
                  activeKeys.delete(keyboard._keyStringToScratchKey(key));
                }
                updateVMKeysPressed();
                window.ReactNativeWebView?.postMessage("Remote key: " + key + " - " + type + " | Active: [" + Array.from(activeKeys).join(", ") + "]");
              }
            }
          }
        } catch (err) {
          console.error("Error parsing data channel message:", err);
          sendToReact({ type: ERROR_MESSAGE, payload: "Error parsing remote message: " + err.message });
        }
      };

      dataChannel.onerror = (err) => {
        sendToReact({ type: ERROR_MESSAGE, payload: err.message });
      };

      dataChannel.onclose = () => {
        sendToReact("Data channel closed");
      };
    }

    function sendProjectMetadata() {
      if (!dataChannel || dataChannel.readyState !== 'open') {
        sendToReact("Cannot send metadata - data channel not ready");
        return;
      }

      // Get project metadata from React Native
      sendToReact({ type: 'request-metadata' });
    }

    async function createAndSendOffer() {
      sendToReact({ type: 'sending-offer' });

      // Start streaming before creating the offer
      await startStreaming();

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      sendToReact({ type: 'offer-created', payload: JSON.stringify(peerConnection) });

      signalingSocket?.send(JSON.stringify({
        type: 'signal',
        payload: { type: 'offer', sdp: offer.sdp, sdpType: offer.type, roomCode }
      }));
    }

    async function handleSignalingMessage(msg) {
      sendToReact("Handling signaling message: " + JSON.stringify(msg));
      if (msg.sdp) {
        const desc = new RTCSessionDescription({ type: msg.type, sdp: msg.sdp });
        await peerConnection.setRemoteDescription(desc);
        sendToReact({ type: "answer-recieved", payload: JSON.stringify(peerConnection) });
      } else if (msg.candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } catch (e) {
          sendToReact({ type: ERROR_MESSAGE, payload: e.message });
        }
      } else {
        sendToReact({ type: ERROR_MESSAGE, payload: msg });
      }
    }

    // ---------- Input ----------
    function handleRemoteInput(input) {
      const canvas = document.querySelector('canvas');
      const event = new MouseEvent(input.eventType, {
        bubbles: true,
        clientX: input.x,
        clientY: input.y,
      });
      canvas.dispatchEvent(event);
    }

    function updateVMKeysPressed() {
      const keyboard = window.vm?.runtime?.ioDevices?.keyboard;
      if (keyboard) {
        // Replace the internal list directly with a copy of our current set
        keyboard._keysPressed = Array.from(activeKeys);
      }
    }

    // ---------- Messaging Bridge ----------
    function sendToReact(message) {
      window.ReactNativeWebView?.postMessage(JSON.stringify(message));
    }

    // ---------- WebSocket Setup ----------
    window.addEventListener("message", async (e) => {
      try {
        // Some messages are plain strings (logs) while others are JSON.
        // Try to parse JSON, but fall back to a raw wrapper when parsing fails.
        let data;
        if (typeof e.data === 'string') {
          try {
            data = JSON.parse(e.data);
          } catch (err) {
            data = { __raw: e.data };
          }
        } else {
          data = e.data;
        }
        const { type } = data;

        window.ReactNativeWebView.postMessage("Message received: " + type);

        // Handle project metadata transmission
        if (type === "project-metadata" && dataChannel && dataChannel.readyState === 'open') {
          const metadataMessage = {
            type: 'PROJECT_METADATA',
            payload: data.metadata
          };
          dataChannel.send(JSON.stringify(metadataMessage));
          sendToReact({ type: 'metadata-sent', payload: data.metadata });
          return;
        }

        if (type == "endMultiPlaySession") {
          // Clean up connections and reset state
          if (dataChannel) {
            dataChannel.close();
            dataChannel = null;
          }
          if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
          }
          if (signalingSocket) {
            signalingSocket.close();
            signalingSocket = null;
          }
          if (canvasStream) {
            canvasStream.getTracks().forEach(track => track.stop());
            canvasStream = null;
          }

          // Reset state variables
          roomCode = null;
          peerJoined = false;

          sendToReact({ type: 'session-ended' });
          return;
        }

        if (type == "startMultiPlaySession") {
          window.ReactNativeWebView.postMessage("Starting MultiPlaySession: " + signalingSocket);
          if (!!signalingSocket) return;
          signalingSocket = new WebSocket(SIGNALING_SERVER_URL);
          signalingSocket.onopen = () => {
            signalingSocket.send(JSON.stringify({ type: 'create' }));
            sendToReact({ type: 'signaling-open' });
          };

          signalingSocket.onmessage = async (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'room-created') {
              roomCode = msg.payload.roomCode;
              sendToReact({ type: 'room-created', roomCode });
            }

            else if (msg.type === 'peer-joined') {
              peerJoined = true;
              if (!peerConnection) {
                setupPeerConnection();
              }
              sendToReact({ type: 'peer-joined' });
              if (peerConnection) {
                await createAndSendOffer();
              }
            }

            else if (msg.type === 'signal') {
              await handleSignalingMessage(msg.payload);
            }

            else if (msg.type === 'peer-disconnected') {
              sendToReact({ type: 'peer-disconnected' });
              peerConnection?.close();
              peerConnection = null;
              peerJoined = false;
            }

            else if (msg.type === 'join-failed') {
              sendToReact({ type: ERROR_MESSAGE, payload: 'Peer failed to join' });
            }

            else {
              sendToReact({ type: ERROR_MESSAGE, payload: msg.type });
            }
          };

          signalingSocket.onerror = (err) => {
            sendToReact({ type: ERROR_MESSAGE, payload: 'WebSocket error: ' + err.message });
          };
        }
      } catch (err) {
        window.ReactNativeWebView.postMessage("Message handler error: " + err.message);
      }
    });



    const activeKeys = new Set();

    // Enhanced VM waiting with better iOS compatibility
    let vmCheckAttempts = 0;
    const maxVMCheckAttempts = 100; // 10 seconds max

    const waitForVM = setInterval(() => {
      vmCheckAttempts++;
      window.ReactNativeWebView.postMessage("VM check attempt " + vmCheckAttempts + ", VM exists: " + !!window.vm);

      const vm = window.vm;
      const keyboard = vm?.runtime?.ioDevices?.keyboard;

      if (keyboard && keyboard._keysPressed && typeof keyboard._keyStringToScratchKey === 'function') {
        clearInterval(waitForVM);
        window.ReactNativeWebView.postMessage("VM ready! Setting up input handlers...");

        // Start the message listener for keyboard input. Accept either JSON messages
        // or plain strings; if parsing fails we ignore non-JSON messages.
        window.addEventListener("message", (e) => {
          try {
            let data;
            if (typeof e.data === 'string') {
              try {
                data = JSON.parse(e.data);
              } catch (err) {
                // Not JSON — ignore plain string messages for key handling
                return;
              }
            } else {
              data = e.data;
            }

            const { key, type } = data;

            if (!key || !type || !['keydown', 'keyup'].includes(type)) return;

            const scratchKey = keyboard._keyStringToScratchKey(key);
            if (scratchKey === undefined) {
              window.ReactNativeWebView.postMessage("Invalid key: " + key);
              return;
            }

            if (type === "keydown") {
              activeKeys.add(scratchKey);
            } else if (type === "keyup") {
              activeKeys.delete(scratchKey);
            }

            updateVMKeysPressed();
            window.ReactNativeWebView.postMessage("Key event: " + key + " (" + type + ") -> " + scratchKey + " | Active: [" + Array.from(activeKeys).join(", ") + "]");
          } catch (err) {
            window.ReactNativeWebView.postMessage("Error parsing itchy key message: " + err.message);
          }
        });
      }
    }, 100);

})();
`


  const openOnlineConfigSheet = () => {
    onlineConfigSheetRef.current?.expand();
  };

  const closeOnlineConfigSheet = () => {
    onlineConfigSheetRef.current?.close();
  };

  const moveMouse = useCallback((data) => {
    console.log("TODO: mouse")
  }, [webViewRef, connected, roomCode]);

  const webViewMessageHandler = (e) => {
    console.log("WebView | ", e.nativeEvent.data);
    try {
      const d = JSON.parse(e.nativeEvent.data)
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
          setRoomCode("");
          setConnectionStatus("idle");
          break;
        case "signaling-open":
          setConnectionStatus("signaling-connected");
          break;
        case "webrtc-error":
          setConnectionStatus("error");
          console.error("WebRTC Error:", d.payload);
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
              remix: metadata.remix
            };
            const message = { type: "project-metadata", metadata: metadataToSend };
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
  }

  const createRoom = useCallback(() => {
    const message = { type: "startMultiPlaySession" }
    webViewRef.current?.injectJavaScript(`
            (function(){
                window.postMessage(${JSON.stringify(message)},'*');
            })();
            true;`)
  }, [webViewRef])

  const disconnect = useCallback(() => {
    // Reset all connection states
    setIsConnected(false);
    setPeerConnected(false);
    setRoomCode("");
    setConnectionStatus("idle");

    const message = { type: "endMultiPlaySession" }
    webViewRef.current?.injectJavaScript(`
            (function(){
                window.postMessage(${JSON.stringify(message)},'*');
            })();
            true;`)
  }, [webViewRef])

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen
          options={{
            title: metadata?.title || "Loading...",
            headerShown: !isMaxed,
            headerRight: () => <><MaterialIcons.Button onPressIn={() => router.push(`/projects/${id}/comments`)} name='question-answer' size={24} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} /></>
          }}
        />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 10, paddingTop: isMaxed ? insets.top : 0 }}>
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
            style={{ backgroundColor: "transparent" }}
            injectedJavaScript={twJSInject}
            ref={webViewRef}
            onMessage={webViewMessageHandler}
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
            }}
          />
          {metadata && <ScrollView horizontal contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 20, columnGap: 10 }} showsHorizontalScrollIndicator={false}>
            {isMaxed && <Chip.Icon icon="close-fullscreen" text="Exit Play Mode" onPress={() => setIsMaxed(false)} />}
            <Chip.Image imageURL={metadata.author?.profile?.images["32x32"]} text={metadata.author?.username} onPress={() => router.push(`/users/${metadata?.author?.username}`)} textStyle={{ fontWeight: 'bold' }} mode="outlined" />
            <Chip.Icon icon='radio' text="MultiPlay" color="#47b5ff" mode="filled" onPress={openOnlineConfigSheet} />
            <Chip.Icon icon='heart' text={approximateNumber(metadata.stats.loves)} color="#ff4750" mode={interactions.loved ? "filled" : "outlined"} onPress={() => toggleInteraction("love")} />
            <Chip.Icon icon='star' text={approximateNumber(metadata.stats.favorites)} color="#ddbf37" mode={interactions.favorited ? "filled" : "outlined"} onPress={() => toggleInteraction("favorite")} />
            <Chip.Icon icon='sync' text={approximateNumber(metadata.stats.remixes)} color={isDark ? "#32ee87" : "#0ca852"} mode="filled" />
            <Chip.Icon icon='eye' text={approximateNumber(metadata.stats.views)} color="#47b5ff" mode="filled" />
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
          {!isMaxed && <>
            {metadata?.remix?.parent && <RemixNotice originalProjectID={metadata?.remix?.parent} />}
            <Controls
              onControlPress={sendKeyEvent}
              projectId={id}
              showConfiguration={true}
              style={{ margin: 20, marginTop: 0, marginBottom: 0 }}
            />
            {metadata?.instructions && <Card style={{ margin: 20, marginTop: 0, marginBottom: 10, padding: 16, borderRadius: dimensions.mediumRadius }}>
              <ItchyText style={{ fontWeight: "bold", color: colors.text, fontSize: 16, marginBottom: 10 }}>Instructions</ItchyText>
              <LinkifiedText style={{ color: colors.text }} text={metadata?.instructions} />
            </Card>}
            {metadata?.description && <Card style={{ margin: 20, marginTop: 0, marginBottom: 10, padding: 16, borderRadius: dimensions.mediumRadius }}>
              <ItchyText style={{ fontWeight: "bold", color: colors.text, fontSize: 16, marginBottom: 10 }}>Credits</ItchyText>
              <LinkifiedText style={{ color: colors.text }} text={metadata?.description} />
            </Card>}
            {dateInfo && <Card style={{ margin: 20, marginTop: 0, marginBottom: 30, padding: 16, borderRadius: dimensions.mediumRadius }}>
              <ItchyText style={{ color: colors.textSecondary, fontSize: 12 }}>Created {dateInfo.created}</ItchyText>
              {dateInfo.modified != dateInfo.created && <ItchyText style={{ color: colors.textSecondary, fontSize: 12 }}>Modified {dateInfo.modified}</ItchyText>}
            </Card>}
          </>}
        </ScrollView>
      </View>
      <BottomSheet
        ref={onlineConfigSheetRef}
        index={-1}
        snapPoints={[]}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: colors.background
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