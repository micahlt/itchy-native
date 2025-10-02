import { useEffect, useRef, useState } from 'react';
import {
    View,
    TextInput,
    Alert,
    Pressable,
    ActivityIndicator,
    useWindowDimensions,
    ScrollView,
} from 'react-native';
import ItchyText from '../components/ItchyText';
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
import linkWithFallback from '../utils/linkWithFallback';
import { useMMKVObject } from 'react-native-mmkv';

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
    const [user] = useMMKVObject("user");
    console.log(user);
    const nav = useNavigation();
    const insets = useSafeAreaInsets();

    // Check if user is under 13 years old
    const isUserUnder13 = () => {
        if (!user || !user.birthMonth || !user.birthYear) return false;

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

        const age = currentYear - user.birthYear;

        // If they haven't had their birthday this year yet, subtract 1 from age
        if (currentMonth < user.birthMonth) {
            return (age - 1) < 13;
        }

        return age < 13;
    };

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
                    const remoteDescription = { type: payload.sdpType || 'offer', sdp: sdp };
                    console.log("Received description:", remoteDescription);

                    if (remoteDescription.type === 'offer') {
                        setStatus('Received offer. Creating answer...');
                        const pc = pcRef.current;
                        await pc.setRemoteDescription(new RTCSessionDescription(remoteDescription));
                        pc.onicegatheringstatechange = () => {
                            console.log("ICE gathering state:", pc.iceGatheringState);
                        };
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

        // Get TURN credentials from environment variables
        const turnUsername = process.env.EXPO_PUBLIC_TURN_USERNAME;
        const turnCredential = process.env.EXPO_PUBLIC_TURN_CREDENTIAL;
        const turnServerUrl = process.env.EXPO_PUBLIC_TURN_SERVER_URL;

        const iceServers = [
            { urls: 'stun:stun.l.google.com:19302' }
        ];

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
                socketRef.current?.send(JSON.stringify({
                    type: 'signal',
                    payload: {
                        roomCode: code,
                        candidate: event.candidate,
                        type: 'candidate'
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
                            color: isUserUnder13() ? colors.textSecondary : colors.text,
                            minWidth: 200,
                            fontFamily: "monospace",
                            fontSize: 26,
                            textAlign: "center",
                            borderColor: isUserUnder13() ? colors.textSecondary : colors.backgroundSecondary,
                            borderWidth: 1,
                            borderRadius: 10,
                            height: 50,
                            flexGrow: 1,
                            opacity: isUserUnder13() ? 0.5 : 1
                        }}
                        value={roomCode}
                        placeholder={isUserUnder13() ? "age restricted" : "room code"}
                        autoCapitalize="characters"
                        maxLength={6}
                        onChangeText={setRoomCode}
                        editable={!isUserUnder13()}
                    />
                    <Pressable
                        title="Join Room"
                        style={{ margin: "auto", opacity: isUserUnder13() ? 0.5 : 1 }}
                        onPress={isUserUnder13() ? null : joinRoom}
                        disabled={isUserUnder13()}
                    >
                        <ItchyText style={{
                            color: "white",
                            paddingHorizontal: 20,
                            paddingVertical: 14,
                            borderRadius: 10,
                            backgroundColor: isUserUnder13() ? colors.textSecondary : colors.accent,
                            alignItems: "center",
                            display: "flex",
                            justifyContent: "center"
                        }}>CONNECT</ItchyText>
                    </Pressable>
                </View>}
                {isUserUnder13() && !remoteStream && (
                    <Card style={{ paddingHorizontal: 15, paddingVertical: 10, marginTop: 15, backgroundColor: colors.backgroundSecondary }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <MaterialIcons name="info" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                            <ItchyText style={{ color: colors.accent, fontSize: 16, fontWeight: "bold" }}>
                                Age Restriction
                            </ItchyText>
                        </View>
                        <ItchyText style={{ color: colors.text, lineHeight: 17 }}>
                            MultiPlay is restricted to users who are 13 years of age or older. This restriction is in place to comply with online privacy and safety regulations.
                        </ItchyText>
                    </Card>
                )}
                <ItchyText style={{ color: colors.textSecondary, opacity: 0.5, marginVertical: 10 }}>Status: {status}</ItchyText>
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
                        <ItchyText style={{ color: colors.accent, fontSize: 18, fontWeight: "bold" }}>
                            {projectMetadata.title}
                        </ItchyText>
                        <ItchyText style={{ color: colors.textSecondary, marginTop: 2 }}>
                            by {projectMetadata.author?.username}
                        </ItchyText>
                        {projectMetadata.instructions && (
                            <View style={{ marginTop: 8 }}>
                                <ItchyText style={{ color: colors.text, fontWeight: "bold", fontSize: 14 }}>
                                    Instructions
                                </ItchyText>
                                <ItchyText style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 17 }}>
                                    {projectMetadata.instructions}
                                </ItchyText>
                            </View>
                        )}
                        <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', gap: 10 }}>
                            <ItchyText style={{ color: colors.textSecondary, fontSize: 12 }}>
                                ❤️ {projectMetadata.stats?.loves || 0}
                            </ItchyText>
                            <ItchyText style={{ color: colors.textSecondary, fontSize: 12 }}>
                                ⭐ {projectMetadata.stats?.favorites || 0}
                            </ItchyText>
                            <ItchyText style={{ color: colors.textSecondary, fontSize: 12 }}>
                                👁️ {projectMetadata.stats?.views || 0}
                            </ItchyText>
                        </View>
                    </Card>
                )}
                {!remoteStream && <Card style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
                    <ItchyText style={{ color: colors.accent, fontSize: 20, fontWeight: "bold" }}>Introducing MultiPlay</ItchyText>
                    <ItchyText style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 17 }}>MultiPlay is the first-ever online multiplayer platform for local multiplayer style Scratch games, built-in to Itchy!  You can host a game, make a join code, and send it to a friend to allow them to see and control game you're playing.  Combine this with Itchy's customizable control setups and you can play local multiplayer games with keyboard controls on your phone.</ItchyText>
                    <ItchyText style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 17 }}>It's worth noting that MultiPlay is still in the alpha stage, so you may encounter connection issues, lag, random inputs, and other stuff like that.</ItchyText>
                </Card>}
                <ScrollView horizontal={true} style={{ flex: 1, marginTop: 10 }} contentContainerStyle={{ columnGap: 5 }} >
                    <Chip.Icon icon="exit" text="Leave MultiPlay" onPress={() => nav.goBack()} />
                    <Chip.Icon icon="help-circle" text="MultiPlay FAQ" onPress={() => linkWithFallback("https://itchy.micahlindley.com/multiplay", colors.accent)} color={colors.accent} />
                </ScrollView>
            </ScrollView>
            <ControlsSheet onControlPress={sendKeyEvent} onClose={() => setControlsOpen(false)} opened={controlsOpen} height={controlsHeight} projectId={projectMetadata?.id} />
        </>
    );
}