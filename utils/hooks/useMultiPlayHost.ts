import { useEffect, useRef, useState } from "react";
import { ScratchCoords } from "itchy-multiplay";

/**
 * Hook for hosting a MultiPlay session inside a WebView.
 * The kernel runs inside the WebView (with TurboWarp VM) and communicates via postMessage.
 */
export const useMultiPlayHost = (
  webViewRef: React.RefObject<any>,
  iceServers: any[]
) => {
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Idle");
  const [peerConnected, setPeerConnected] = useState(false);
  const hasInitialized = useRef(false);

  const webViewMessageHandler = (event: any) => {
    const rawData = event.nativeEvent.data;

    try {
      const message = JSON.parse(rawData);
      console.log("[MultiPlay Host] WebView message:", message);

      switch (message.type) {
        case "loader-ready":
          console.log("[MultiPlay Host] Loader is ready");
          break;

        case "test":
          console.log("TEST!");
          break;

        case "status":
          setConnectionStatus(message.payload);
          if (message.payload.includes("Room Created:")) {
            const code = message.payload.split(": ")[1];
            setRoomCode(code);
            setConnected(true);
          }
          if (message.payload === "peer-joined") {
            setPeerConnected(true);
          }
          break;

        case "error":
          console.error("[MultiPlay Host] Error:", message.payload);
          setConnectionStatus(`Error: ${message.payload}`);
          hasInitialized.current = false; // Allow retry after error
          break;

        case "video-error":
          console.error("[MultiPlay Host] Video:", message.payload);
          setConnectionStatus(`${message.payload}`);
          hasInitialized.current = false;
          break;

        case "connectionState":
          if (message.payload == "disconnected") {
            setConnected(false);
            setPeerConnected(false);
            setRoomCode("");
            setConnectionStatus("Idle");
            hasInitialized.current = false; // Allow reconnection
          }
          break;

        default:
          console.log("[MultiPlay Host] Unknown message type:", message.type);
      }
    } catch (error) {
      // Handle non-JSON messages (plain strings)
      console.log("[MultiPlay Host] Non-JSON message:", rawData);
    }
  };

  const createRoom = () => {
    console.log(createRoom);
    if (!webViewRef.current) {
      console.warn("[MultiPlay Host] Cannot create room - WebView not ready");
      return;
    }

    // Silently ignore duplicate calls if already in progress or connected
    if (
      hasInitialized.current &&
      (connected || connectionStatus === "Initializing...")
    ) {
      console.log(
        "[MultiPlay Host] Ignoring duplicate createRoom call - already",
        connectionStatus
      );
      return;
    }

    console.log("[MultiPlay Host] Creating room with config:", {
      signalingUrl: "wss://itchyws.micahlindley.com",
      iceServers: iceServers.length,
    });

    // Set state BEFORE injecting script to prevent race conditions
    hasInitialized.current = true;
    setConnectionStatus("Initializing...");

    const config = {
      signalingUrl: "wss://itchyws.micahlindley.com",
      webrtc: {
        iceServers: iceServers,
      },
      logLevel: "error",
    };

    const initScript = `
    if (window.startMultiPlayHost) {
        window.startMultiPlayHost(${JSON.stringify(config)});
        true;
        } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({data: 'not found', type: 'test'}));
        false;
      }
    `;

    webViewRef.current.injectJavaScript(initScript);
    console.log("Injected JS sucessfully");
  };

  const disconnect = () => {
    if (!webViewRef.current) return;

    const disconnectScript = `
      if (window.multiPlayKernel) {
        window.multiPlayKernel.cleanup();
        window.multiPlayKernel = null;
        true;
      } else {
        false;
      }
    `;

    webViewRef.current.injectJavaScript(disconnectScript);
    hasInitialized.current = false;
    setConnected(false);
    setPeerConnected(false);
    setRoomCode("");
    setConnectionStatus("Idle");
  };

  const sendKeyEvent = (
    key: string,
    type: "keyup" | "keydown" | "mouse",
    coords?: ScratchCoords
  ) => {
    // Host doesn't send key events - it receives them from clients
    // This is a no-op for the host
    console.log("[MultiPlay Host] Host doesn't send key events");
  };

  useEffect(() => {
    return () => {
      if (hasInitialized.current) {
        disconnect();
      }
    };
  }, []);

  return {
    connected,
    roomCode,
    connectionStatus,
    peerConnected,
    webViewMessageHandler,
    createRoom,
    disconnect,
    sendKeyEvent,
  };
};
