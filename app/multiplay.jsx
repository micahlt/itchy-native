import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    SafeAreaView,
    Alert,
    Pressable,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import {
    RTCView,
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate
} from 'react-native-webrtc';
import { useTheme } from '../utils/theme';
import Card from '../components/Card';

const SIGNALING_SERVER_URL = 'wss://itchyws.micahlindley.com';

export default function VideoClient() {
    const [roomCode, setRoomCode] = useState('');
    const [status, setStatus] = useState('Idle');
    const [remoteStream, setRemoteStream] = useState(null);
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(false);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (pcRef.current) {
                pcRef.current.close();
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);


    const joinRoom = () => {
        const code = roomCode.trim().toUpperCase();
        if (code.length !== 6) {
            Alert.alert('Error', 'Enter a valid 6-character room code.');
            return;
        }

        setLoading(true);
        setStatus('Connecting to signaling server...');
        const socket = new WebSocket(SIGNALING_SERVER_URL);
        socketRef.current = socket;

        socket.onopen = () => {
            setStatus('Connected. Joining room...');
            socket.send(JSON.stringify({ type: 'join', payload: { roomCode: code } }));
        };

        socket.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            console.log("Received message:", msg);
            const { type, payload } = msg;

            if (type === 'join-success') {
                setStatus('Joined room. Waiting for offer...');
                startPeerConnection(code);
            } else if (type === 'join-failed') {
                setStatus(`Join failed: ${payload.reason}`);
            } else if (type === 'signal') {
                console.log("Received signal:", payload);
                const { sdp, candidate } = payload;

                if (sdp) {
                    const remoteDescription = sdp;
                    console.log("Received description:", remoteDescription);

                    if (remoteDescription.type === 'offer') {
                        setStatus('Received offer. Creating answer...');
                        const pc = pcRef.current;
                        await pc.setRemoteDescription(new RTCSessionDescription(remoteDescription));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'signal',
                            payload: {
                                roomCode: code,
                                type: 'answer',
                                sdp: pc.localDescription.sdp,
                            },
                        }));
                    } else if (remoteDescription.type === 'answer') {
                        setStatus('Received answer. Setting remote description...');
                        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(remoteDescription));
                    }
                }

                if (candidate) {
                    try {
                        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (err) {
                        console.warn('Failed to add ICE candidate:', err);
                    }
                }
            } else if (type === 'peer-disconnected') {
                setStatus('Host disconnected.');
                if (pcRef.current) pcRef.current.close();
                pcRef.current = null;
                setRemoteStream(null);
            }
        };

        socket.onerror = (e) => {
            console.error(e);
            setStatus('WebSocket error.');
        };

        socket.onclose = () => {
            setStatus('Connection closed.');
            setLoading(false);
        };
    };

    const startPeerConnection = (code) => {
        console.log("Starting peer connection...");
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate:", event.candidate);
                socketRef.current?.send(JSON.stringify({
                    type: 'signal',
                    payload: {
                        roomCode: code,
                        candidate: event.candidate,
                    },
                }));
            } else {
                console.log("All ICE candidates have been sent.");
            }
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setStatus('Receiving video stream.');
                setRemoteStream(event.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log("Connection state:", pc.connectionState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
        };

        pcRef.current = pc;
    };

    return (
        <SafeAreaView style={{ paddingHorizontal: 15 }}>
            <View style={{ flexDirection: "row", columnGap: 15, alignItems: "center", justifyContent: "center", marginTop: 10 }}>
                <TextInput
                    style={{
                        color: colors.text, minWidth: 200, fontFamily: "monospace", fontSize: 26, textAlign: "center", borderColor: colors.backgroundSecondary, borderWidth: 1, borderRadius: 10, height: 50, flexGrow: 1
                    }}
                    value={roomCode}
                    placeholder="room code"
                    autoCapitalize="characters"
                    maxLength={6}
                    onChangeText={setRoomCode}
                />
                <Pressable title="Join Room" style={{ margin: "auto" }} onPress={joinRoom}>
                    <Text style={{ color: colors.buttonText, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", display: "flex", justifyContent: "center" }}>CONNECT</Text>
                </Pressable>
            </View>
            <Text style={{ color: colors.textSecondary, opacity: 0.5, marginVertical: 10 }}>Status: {status}</Text>
            <View style={{ width: width - 30, aspectRatio: 480 / 360, borderWidth: 2, borderRadius: 10, overflow: "hidden" }}>
                {!!remoteStream ? (
                    <RTCView
                        streamURL={remoteStream.toURL()}
                        style={{ height: "100%", width: "100%" }}
                        objectFit="cover"
                    />
                ) : (
                    <View style={{ alignItems: "center", height: "100%", width: "100%", justifyContent: "center" }}>
                        {loading && <ActivityIndicator size={50} color={colors.accent} />}
                    </View>
                )}
            </View>
            {!remoteStream && <Card style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
                <Text style={{ color: colors.accent, fontSize: 20, fontWeight: "bold" }}>Introducing MultiPlay</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 17 }}>MultiPlay is the first-ever online multiplayer platform for local multiplayer style Scratch games, built-in to Itchy!  You can host a game, make a join code, and send it to a friend to allow them to see and control game you're playing.  Combine this with Itchy's customizable control setups and you can play local multiplayer games with keyboard controls on your phone.</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 17 }}>It's worth noting that MultiPlay is still in the alpha stage, so you may encounter connection issues, lag, random inputs, and other stuff like that.</Text>
            </Card>}
        </SafeAreaView>
    );
}