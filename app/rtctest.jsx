import React, { useEffect, useRef, useState } from "react";
import { View, Button, TextInput } from "react-native";
import ItchyText from "../components/ItchyText";
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } from "react-native-webrtc";

const SIGNALING_SERVER_URL = "wss://itchyws.micahlindley.com";

const configuration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
    ],
};

export default function WebRTCExample() {
    const ws = useRef(null);
    const pc = useRef(null);

    const [roomCode, setRoomCode] = useState("");
    const [connected, setConnected] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [log, setLog] = useState([]);
    const iceCandidateQueue = useRef([]);


    function logMessage(msg) {
        setLog((old) => [...old, msg]);
    }

    useEffect(() => {
        ws.current = new WebSocket(SIGNALING_SERVER_URL);

        ws.current.onopen = () => logMessage("Signaling connected");
        ws.current.onerror = (e) => logMessage("Signaling error: " + e.message);
        ws.current.onclose = () => logMessage("Signaling disconnected");

        ws.current.onmessage = async (message) => {
            const data = JSON.parse(message.data);

            if (data.type === "room-created") {
                logMessage(`Room created: ${data.payload.roomCode}`);
                setRoomCode(data.payload.roomCode);
                setIsHost(true);
            }

            if (data.type === "join-success") {
                logMessage("Joined room successfully, waiting for peer...");
            }

            if (data.type === "peer-joined") {
                logMessage("Peer joined! Starting WebRTC...");
                await startWebRTC(true);
            }

            if (data.type === "signal") {
                await handleSignal(data.payload);
            }

            if (data.type === "peer-disconnected") {
                logMessage("Peer disconnected");
                pc.current?.close();
                pc.current = null;
                setConnected(false);
            }
        };

        return () => {
            ws.current?.close();
            pc.current?.close();
        };
    }, []);

    async function createRoom() {
        ws.current.send(JSON.stringify({ type: "create" }));
    }

    async function joinRoom() {
        if (!roomCode) return;
        ws.current.send(JSON.stringify({ type: "join", payload: { roomCode } }));
    }

    async function startWebRTC(isInitiator) {
        pc.current = new RTCPeerConnection(configuration);

        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                ws.current.send(JSON.stringify({ type: "signal", payload: { candidate: event.candidate } }));
            }
        };

        pc.current.onconnectionstatechange = () => {
            logMessage("Connection state: " + pc.current.connectionState);
            if (pc.current.connectionState === "connected") {
                setConnected(true);
            }
        };

        pc.current.ondatachannel = (event) => {
            const channel = event.channel;
            setupDataChannel(channel);
        };

        if (isInitiator) {
            const channel = pc.current.createDataChannel("chat");
            setupDataChannel(channel);

            const offer = await pc.current.createOffer();
            await pc.current.setLocalDescription(offer);
            ws.current.send(JSON.stringify({ type: "signal", payload: { sdp: pc.current.localDescription } }));
        }
    }

    function setupDataChannel(channel) {
        channel.onopen = () => logMessage("Data channel open");
        channel.onmessage = (event) => logMessage("Received: " + event.data);
        channel.onclose = () => logMessage("Data channel closed");

        // Save channel if you want to send messages later
        pc.current.dataChannel = channel;
    }

    async function handleSignal(payload) {
        if (payload.sdp) {
            if (!pc.current) {
                await startWebRTC(false); // create peer connection if not exists
            }

            await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));

            if (payload.sdp.type === "offer") {
                const answer = await pc.current.createAnswer();
                await pc.current.setLocalDescription(answer);
                ws.current.send(JSON.stringify({ type: "signal", payload: { sdp: pc.current.localDescription } }));
            }

            // After remote description is set, add any queued ICE candidates
            while (iceCandidateQueue.current.length) {
                const candidate = iceCandidateQueue.current.shift();
                try {
                    await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    logMessage("Error adding queued ICE candidate: " + e.message);
                }
            }
        }

        if (payload.candidate) {
            if (pc.current) {
                try {
                    await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } catch (e) {
                    logMessage("Error adding ICE candidate: " + e.message);
                }
            } else {
                // PeerConnection not ready yet, queue candidate
                iceCandidateQueue.current.push(payload.candidate);
            }
        }
    }


    function sendTestMessage() {
        if (pc.current?.dataChannel?.readyState === "open") {
            pc.current.dataChannel.send("Hello from React Native!");
            logMessage("Sent test message");
        } else {
            logMessage("Data channel not open");
        }
    }

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Button title="Create Room" onPress={createRoom} />
            <TextInput
                placeholder="Enter Room Code"
                value={roomCode}
                onChangeText={setRoomCode}
                style={{ borderWidth: 1, padding: 10, marginVertical: 10, color: "white" }}
            />
            <Button title="Join Room" onPress={joinRoom} />
            <Button title="Send Test Message" onPress={sendTestMessage} disabled={!connected} />
            <ItchyText>Connection: {connected ? "Connected" : "Disconnected"}</ItchyText>
            <View style={{ marginTop: 20, flex: 1 }}>
                {log.map((line, i) => (
                    <ItchyText key={i} style={{ color: "white" }}>{line}</ItchyText>
                ))}
            </View>
        </View>
    );
}
