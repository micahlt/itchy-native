import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
} from "react-native-webrtc";

const SIGNALING_SERVER_URL = "wss://itchyws.micahlindley.com";

export const useMultiPlayClient = () => {
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState("Idle");
  const [remoteStream, setRemoteStream] = useState(null);
  const [projectMetadata, setProjectMetadata] = useState(null);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const startPeerConnection = (code) => {
    console.log("Starting peer connection...");

    // Get TURN credentials from environment variables
    const turnUsername = process.env.EXPO_PUBLIC_TURN_USERNAME;
    const turnCredential = process.env.EXPO_PUBLIC_TURN_CREDENTIAL;
    const turnServerUrl = process.env.EXPO_PUBLIC_TURN_SERVER_URL;

    const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

    // Only add TURN servers if credentials are available
    if (turnUsername && turnCredential && turnServerUrl) {
      iceServers.push(
        {
          urls: `turn:${turnServerUrl}:80`,
          username: turnUsername,
          credential: turnCredential,
        },
        {
          urls: `turn:${turnServerUrl}:80?transport=tcp`,
          username: turnUsername,
          credential: turnCredential,
        },
        {
          urls: `turn:${turnServerUrl}:443`,
          username: turnUsername,
          credential: turnCredential,
        },
        {
          urls: `turns:${turnServerUrl}:443?transport=tcp`,
          username: turnUsername,
          credential: turnCredential,
        }
      );
      console.log("TURN servers configured");
    } else {
      console.warn("TURN credentials not found, using STUN only");
    }

    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate:", event.candidate);
        socketRef.current?.send(
          JSON.stringify({
            type: "signal",
            payload: {
              roomCode: code,
              candidate: event.candidate,
              type: "candidate",
            },
          })
        );
      } else {
        console.log("All ICE candidates have been sent.");
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setStatus("Receiving video stream.");
        setRemoteStream(event.streams[0]);
      }
    };

    pc.ondatachannel = (event) => {
      console.log("Data channel received:", event.channel);
      const dataChannel = event.channel;
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.log("Data channel opened");
        setStatus("Data channel connected.");
      };

      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Received data channel message:", message);

          if (message.type === "PROJECT_METADATA") {
            setProjectMetadata(message.payload);
            setStatus(`Connected`);
          }
        } catch (err) {
          console.error("Error parsing data channel message:", err);
        }
      };

      dataChannel.onerror = (err) => {
        console.error("Data channel error:", err);
      };

      dataChannel.onclose = () => {
        console.log("Data channel closed");
        dataChannelRef.current = null;
      };
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    pcRef.current = pc;
  };

  const joinRoom = (codeArg) => {
    const code = (codeArg || roomCode).trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert("Error", "Enter a valid 6-character room code.");
      return;
    }

    setLoading(true);
    setStatus("Connecting to signaling server...");
    const socket = new WebSocket(SIGNALING_SERVER_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("Connected. Joining room...");
      socket.send(
        JSON.stringify({ type: "join", payload: { roomCode: code } })
      );
    };

    socket.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      console.log("Received message:", msg);
      const { type, payload } = msg;

      if (type === "join-success") {
        setStatus("Waiting for host...");
        startPeerConnection(code);
      } else if (type === "join-failed") {
        setStatus(payload.reason);
      } else if (type === "signal") {
        console.log("Received signal:", payload);
        const { sdp, candidate } = payload;
        if (sdp) {
          const remoteDescription = {
            type: payload.sdpType || "offer",
            sdp: sdp,
          };
          console.log("Received description:", remoteDescription);

          if (remoteDescription.type === "offer") {
            setStatus("Creating answer for host...");
            const pc = pcRef.current;
            await pc.setRemoteDescription(
              new RTCSessionDescription(remoteDescription)
            );
            pc.onicegatheringstatechange = () => {
              console.log("ICE gathering state:", pc.iceGatheringState);
            };
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.send(
              JSON.stringify({
                type: "signal",
                payload: {
                  roomCode: code,
                  type: "answer",
                  sdp: pc.localDescription.sdp,
                },
              })
            );
          } else if (remoteDescription.type === "answer") {
            setStatus("Communicating with host...");
            await pcRef.current?.setRemoteDescription(
              new RTCSessionDescription(remoteDescription)
            );
          }
        }

        if (candidate) {
          try {
            await pcRef.current?.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (err) {
            console.warn("Failed to add ICE candidate:", err);
          }
        }
      } else if (type === "peer-disconnected") {
        setStatus("Host disconnected.");
        if (dataChannelRef.current) {
          dataChannelRef.current.close();
          dataChannelRef.current = null;
        }
        if (pcRef.current) pcRef.current.close();
        pcRef.current = null;
        setRemoteStream(null);
        setProjectMetadata(null);
      }
    };

    socket.onerror = (e) => {
      console.error(e);
      setStatus("WebSocket error.");
    };

    socket.onclose = () => {
      setStatus("Connection closed.");
      setLoading(false);
    };
  };

  const disconnect = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setRemoteStream(null);
    setProjectMetadata(null);
    setLoading(false);
    setRoomCode("");
  };

  const sendKeyEvent = (key, type, coords = { x: 0, y: 0 }) => {
    const message = JSON.stringify({ key, type, coords });
    if (
      dataChannelRef.current &&
      dataChannelRef.current.readyState === "open"
    ) {
      console.log(`Sending key event: ${key} - ${type}`);
      if (coords) {
        console.log(coords);
      }
      dataChannelRef.current.send(message);
    } else {
      console.warn("Data channel is not open. Cannot send key event:", message);
    }
  };

  return {
    roomCode,
    setRoomCode,
    status,
    remoteStream,
    projectMetadata,
    loading,
    joinRoom,
    disconnect,
    sendKeyEvent,
  };
};
