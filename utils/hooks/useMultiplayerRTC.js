import { useEffect, useRef, useState, useCallback } from "react";
import {
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate,
} from "react-native-webrtc";

const SIGNALING_SERVER_URL = "ws://temp.micahlindley.com";
const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:3478" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:3478" },
    { urls: "stun:stun4.l.google.com:19302" },
];

export function useMultiplayerRTC(roomCodeParam = null, onMessage = () => { }) {
    const ws = useRef(null);
    const pc = useRef(null);
    const dataChannel = useRef(null);
    const iceQueue = useRef([]);

    const [roomCode, setRoomCode] = useState(roomCodeParam || "");
    const [isHost, setIsHost] = useState(false);
    const [connected, setConnected] = useState(false);
    const [log, setLog] = useState([]);

    const addLog = useCallback((msg) => setLog((prev) => [msg, ...prev]), []);

    const cleanup = useCallback(() => {
        dataChannel.current = null;
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        iceQueue.current = [];
        setConnected(false);
    }, []);

    const setupDataChannel = useCallback(
        (channel) => {
            dataChannel.current = channel;

            channel.onopen = () => {
                addLog("Data channel open");
                setConnected(true);
            };
            channel.onmessage = (e) => {
                try {
                    // Try to parse as JSON first
                    let msg;
                    try {
                        msg = JSON.parse(e.data);
                    } catch (parseErr) {
                        // If it's not valid JSON, pass the raw data
                        msg = e.data;
                    }
                    onMessage(msg);
                } catch (err) {
                    addLog("Failed to process message: " + err.message);
                }
            };
            channel.onclose = () => {
                addLog("Data channel closed");
                setConnected(false);
            };
        },
        [addLog, onMessage]
    );

    const startWebRTC = useCallback(
        async (initiator = false) => {
            if (pc.current) return;
            pc.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });

            pc.current.onicecandidate = (e) => {
                if (e.candidate) {
                    ws.current?.send(
                        JSON.stringify({ type: "signal", payload: { candidate: e.candidate } })
                    );
                }
            };

            pc.current.ondatachannel = (e) => {
                setupDataChannel(e.channel);
            };

            if (initiator) {
                const channel = pc.current.createDataChannel("data");
                setupDataChannel(channel);
                const offer = await pc.current.createOffer();
                await pc.current.setLocalDescription(offer);
                ws.current?.send(
                    JSON.stringify({ type: "signal", payload: { sdp: offer } })
                );
            }
        },
        [setupDataChannel]
    );

    const handleSignal = useCallback(
        async ({ sdp, candidate }) => {
            if (!pc.current) await startWebRTC(false);

            if (sdp) {
                await pc.current.setRemoteDescription(new RTCSessionDescription(sdp));

                if (sdp.type === "offer") {
                    const answer = await pc.current.createAnswer();
                    await pc.current.setLocalDescription(answer);
                    ws.current?.send(
                        JSON.stringify({ type: "signal", payload: { sdp: answer } })
                    );
                }

                while (iceQueue.current.length > 0) {
                    const ice = iceQueue.current.shift();
                    await pc.current.addIceCandidate(new RTCIceCandidate(ice));
                }
            }

            if (candidate) {
                if (pc.current.remoteDescription) {
                    await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    iceQueue.current.push(candidate);
                }
            }
        },
        [startWebRTC]
    );

    useEffect(() => {
        ws.current = new WebSocket(SIGNALING_SERVER_URL);

        ws.current.onopen = () => addLog("WebSocket connected");
        ws.current.onerror = (e) => addLog("WebSocket error: " + e.message);
        ws.current.onclose = () => addLog("WebSocket closed");

        ws.current.onmessage = (event) => {
            (async () => {
                try {
                    const data = JSON.parse(event.data);
                    switch (data.type) {
                        case "room-created":
                            setIsHost(true);
                            setRoomCode(data.payload.roomCode);
                            break;
                        case "join-success":
                            break;
                        case "peer-joined":
                            await startWebRTC(true);
                            break;
                        case "signal":
                            await handleSignal(data.payload);
                            break;
                        case "peer-disconnected":
                            cleanup();
                            break;
                    }
                } catch (err) {
                    addLog("Message error: " + err.message);
                }
            })();
        };

        return () => {
            ws.current?.close();
            cleanup();
        };
    }, [handleSignal, startWebRTC, cleanup]);

    const sendMessage = useCallback(
        (msg) => {
            if (dataChannel.current?.readyState === "open") {
                dataChannel.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
                // If we're the host and sending a flag message, also process it locally
                if (isHost && typeof msg === 'string') {
                    try {
                        const parsed = JSON.parse(msg);
                        if (parsed.type === "flag") {
                            onMessage(parsed);
                        }
                    } catch (err) {
                        // Not JSON or other error
                    }
                }
            } else {
                addLog("Data channel not ready");
            }
        },
        [addLog, isHost, onMessage]
    );

    const createRoom = useCallback(() => {
        ws.current?.send(JSON.stringify({ type: "create" }));
    }, []);

    const joinRoom = useCallback(() => {
        if (roomCode) {
            ws.current?.send(JSON.stringify({ type: "join", payload: { roomCode } }));
        }
    }, [roomCode]);

    const disconnect = useCallback(() => {
        ws.current?.send(JSON.stringify({ type: "leave", payload: { roomCode } }));
        cleanup();
        setRoomCode("");
        setIsHost(false);
        addLog("Disconnected");
    }, [roomCode, cleanup]);

    return {
        roomCode,
        isHost,
        connected,
        log,
        createRoom,
        joinRoom,
        setRoomCode,
        sendMessage,
        disconnect,
    };
}
