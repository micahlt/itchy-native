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
    ScrollView,
} from 'react-native';
import {
    RTCView,
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate
} from 'react-native-webrtc';
import { useTheme } from '../utils/theme';
import Card from '../components/Card';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import ControlsSheet from '../components/ControlsSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Chip from '../components/Chip';
import { useNavigation } from 'expo-router';

const SIGNALING_SERVER_URL = 'wss://itchyws.micahlindley.com';

export default function MultiPlay() {
    const [roomCode, setRoomCode] = useState('');
    const [status, setStatus] = useState('Idle');
    const [remoteStream, setRemoteStream] = useState(null);
    const [projectMetadata, setProjectMetadata] = useState(null);
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const dataChannelRef = useRef(null);
    const { colors } = useTheme();
    const { width, height: appHeight } = useWindowDimensions();
    const [loading, setLoading] = useState(false);
    const [controlsOpen, setControlsOpen] = useState(false);
    const [controlsHeight, setControlsHeight] = useState(300);
    const nav = useNavigation();
    const insets = useSafeAreaInsets();

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
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun1.l.google.com:19302' }, { urls: 'stun2.l.google.com:19302' }, { urls: 'stun3.l.google.com:19302' }, { urls: 'stun4.l.google.com:19302' }],
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

        pc.ondatachannel = (event) => {
            console.log('Data channel received:', event.channel);
            const dataChannel = event.channel;
            dataChannelRef.current = dataChannel;

            dataChannel.onopen = () => {
                console.log('Data channel opened');
                setStatus('Data channel connected.');
            };

            dataChannel.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('Received data channel message:', message);

                    if (message.type === 'PROJECT_METADATA') {
                        setProjectMetadata(message.payload);
                        setStatus(`Connected to: ${message.payload.title}`);
                    }
                } catch (err) {
                    console.error('Error parsing data channel message:', err);
                }
            };

            dataChannel.onerror = (err) => {
                console.error('Data channel error:', err);
            };

            dataChannel.onclose = () => {
                console.log('Data channel closed');
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
        setRoomCode('');
    }

    const sendKeyEvent = (key, type, source = "local") => {
        const message = JSON.stringify({ key, type });
        if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
            console.log(`Sending key event: ${key} - ${type} (source: ${source})`);
            dataChannelRef.current.send(message);
        } else {
            console.warn('Data channel is not open. Cannot send key event:', message);
        }
    };

    return (
        <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: insets.bottom + 20, paddingTop: insets.top }}>
                <Stack.Screen options={{ headerShown: false, title: 'MultiPlay', headerRight: () => <><MaterialIcons.Button onPressIn={() => setControlsOpen(true)} name='videogame-asset' size={24} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} />{remoteStream && <MaterialIcons.Button name="stop-circle" onPressIn={disconnect} size={24} backgroundColor={"transparent"} style={{ paddingRight: 0 }} color={colors.text} />}</> }} />
                {!remoteStream && <View style={{ flexDirection: "row", columnGap: 15, alignItems: "center", justifyContent: "center", marginTop: 10 }}>
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
                        <Text style={{ color: "white", paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", display: "flex", justifyContent: "center" }}>CONNECT</Text>
                    </Pressable>
                </View>}
                <Text style={{ color: colors.textSecondary, opacity: 0.5, marginVertical: 10 }}>Status: {status}</Text>
                {!!remoteStream ? (
                    <View style={{ width: width - 30, aspectRatio: 480 / 360, borderWidth: 2, borderRadius: 10, overflow: "hidden" }}>
                        <RTCView
                            streamURL={remoteStream.toURL()}
                            style={{ height: "100%", width: "100%" }}
                            objectFit="cover"
                            onLayout={(event) => {
                                const { y, height } = event.nativeEvent.layout;
                                setControlsHeight(appHeight - (y + height + insets.top + 20));
                            }}
                        />
                    </View>) : loading && <View style={{ width: width - 30, aspectRatio: 480 / 360, borderWidth: 2, borderRadius: 10, overflow: "hidden" }}>
                        <View style={{ alignItems: "center", height: "100%", width: "100%", justifyContent: "center" }}>
                            <ActivityIndicator size={50} color={colors.accent} />
                        </View>
                    </View>}
                {projectMetadata && (
                    <Card style={{ paddingHorizontal: 15, paddingVertical: 10, marginVertical: 15 }}>
                        <Text style={{ color: colors.accent, fontSize: 18, fontWeight: "bold" }}>
                            {projectMetadata.title}
                        </Text>
                        <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
                            by {projectMetadata.author?.username}
                        </Text>
                        {projectMetadata.instructions && (
                            <View style={{ marginTop: 8 }}>
                                <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 14 }}>
                                    Instructions
                                </Text>
                                <Text style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 17 }}>
                                    {projectMetadata.instructions}
                                </Text>
                            </View>
                        )}
                        <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', gap: 10 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                ❤️ {projectMetadata.stats?.loves || 0}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                ⭐ {projectMetadata.stats?.favorites || 0}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                                👁️ {projectMetadata.stats?.views || 0}
                            </Text>
                        </View>
                    </Card>
                )}
                {!remoteStream && <Card style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
                    <Text style={{ color: colors.accent, fontSize: 20, fontWeight: "bold" }}>Introducing MultiPlay</Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 17 }}>MultiPlay is the first-ever online multiplayer platform for local multiplayer style Scratch games, built-in to Itchy!  You can host a game, make a join code, and send it to a friend to allow them to see and control game you're playing.  Combine this with Itchy's customizable control setups and you can play local multiplayer games with keyboard controls on your phone.</Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 17 }}>It's worth noting that MultiPlay is still in the alpha stage, so you may encounter connection issues, lag, random inputs, and other stuff like that.</Text>
                </Card>}
                <ScrollView horizontal={true} style={{ flex: 1, marginTop: 10 }}>
                    <Chip.Icon icon="exit-to-app" text="Leave MultiPlay" onPress={() => nav.goBack()} />
                </ScrollView>
            </ScrollView>
            <ControlsSheet onControlPress={sendKeyEvent} onClose={() => setControlsOpen(false)} opened={controlsOpen} height={controlsHeight} projectId={projectMetadata?.id} />
        </>
    );
}