import { useCallback, useMemo, useRef, useState } from "react";

export const useMultiPlayHost = (metadata, id, webViewRef) => {
  const [connected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [peerConnected, setPeerConnected] = useState(false);

  const iceServers = useMemo(() => {
    const servers = [{ urls: "stun:stun.l.google.com:19302" }];
    if (
      process.env.EXPO_PUBLIC_TURN_USERNAME &&
      process.env.EXPO_PUBLIC_TURN_CREDENTIAL &&
      process.env.EXPO_PUBLIC_TURN_SERVER_URL
    ) {
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

  const sendKeyEvent = (key, type, source = "local") => {
    const message = JSON.stringify({ key, type });
    webViewRef.current?.injectJavaScript(`
            (function(){
                window.postMessage(${JSON.stringify(message)},'*');
            })();
            true;`);
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
    console.log("CREATING");
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

  return {
    connected,
    roomCode,
    connectionStatus,
    peerConnected,
    iceServers,
    sendKeyEvent,
    webViewMessageHandler,
    createRoom,
    disconnect,
  };
};
