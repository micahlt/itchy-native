import { useEffect, useRef, useState } from "react";
import { MultiPlayKernel, ScratchCoords } from "itchy-multiplay";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
} from "react-native-webrtc";

export const useMultiPlayClient = (config: any) => {
  const [status, setStatus] = useState("Idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [projectMetadata, setProjectMetadata] = useState<any>();
  const kernelRef = useRef<MultiPlayKernel | null>(null);

  useEffect(() => {
    // Inject React Native WebRTC runtime into config
    const configWithRuntime = {
      ...config,
      runtime: {
        RTCPeerConnection,
        RTCSessionDescription,
        RTCIceCandidate,
      },
    };

    // Initialize the kernel once
    const kernel = new MultiPlayKernel(configWithRuntime);
    kernelRef.current = kernel;

    // Listen for events emitted by the SDK
    kernel.onEvent = (event) => {
      console.log("Kernel Event:", event.type, event.payload);
      if (event.type === "status") setStatus(event.payload);
      if (event.type === "stream") setStream(event.payload);
      if (event.type === "metadata") setProjectMetadata(event.payload);
    };

    return () => kernel.cleanup(); // Test your new cleanup logic here!
  }, []);

  return {
    status,
    stream,
    projectMetadata,
    sendKeyEvent: (
      key: string,
      type: "keyup" | "keydown" | "mouse",
      coords?: ScratchCoords
    ) => kernelRef.current?.sendKeyEvent(key, type, coords),
    join: (code: string) => kernelRef.current?.joinRoom(code),
    leave: () => kernelRef.current?.cleanup(),
  };
};
