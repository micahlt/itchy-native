import React from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Clipboard } from "react-native";
import { Pressable } from "react-native";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../utils/theme";
import linkWithFallback from "../utils/linkWithFallback";

export default function MultiPlayConfigSheet({
    roomCode = "",
    connected = false,
    connectionStatus = "idle",
    peerConnected = false,
    createRoom,
    disconnect,
    onClose = () => { }
}) {
    const { colors } = useTheme();

    const getStatusInfo = () => {
        switch (connectionStatus) {
            case "idle":
                return { text: "Ready to host", color: colors.textSecondary };
            case "signaling-connected":
                return { text: "Creating room...", color: colors.accent };
            case "waiting-for-peer":
                return { text: "Waiting for player to join", color: colors.accent };
            case "peer-connected":
                return { text: "Player joined, establishing connection...", color: "#32ee87" };
            case "connected":
                return { text: "Connection active", color: "#32ee87" };
            case "disconnected":
            case "closed":
                return { text: "Disconnected", color: colors.textSecondary };
            case "failed":
                return { text: "Connection failed", color: "#ff4750" };
            case "error":
                return { text: "Error occurred", color: "#ff4750" };
            default:
                return { text: connectionStatus, color: colors.textSecondary };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <BottomSheetView style={{ padding: 20, paddingTop: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "bold",
                    marginRight: 10
                }}>
                    MultiPlay Setup
                </Text>
                <View style={{
                    backgroundColor: colors.accent,
                    borderRadius: 5,
                    paddingHorizontal: 8,
                    paddingVertical: 2
                }}>
                    <Text style={{
                        color: "white",
                        fontSize: 12,
                        fontWeight: "bold"
                    }}>
                        ALPHA
                    </Text>
                </View>
            </View>
            <Text style={{
                color: colors.textSecondary,
                fontSize: 14,
                opacity: 0.5,
                marginBottom: 20
            }}>
                Play local-multiplayer games online with WebRTC. Configure your multiplayer settings below to get started. We're assuming you already have your controller mappings set up for this project.
            </Text>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                    <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: statusInfo.color,
                        marginRight: 8
                    }} />
                    <Text style={{ color: statusInfo.color, fontSize: 14, fontWeight: "500" }}>
                        {statusInfo.text}
                    </Text>
                </View>

                {peerConnected && connected && (
                    <View style={{
                        backgroundColor: colors.accentTransparent,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        marginBottom: 15,
                        flexDirection: "row",
                        alignItems: "center"
                    }}>
                        <MaterialIcons name="people" size={16} color={colors.accent} />
                        <Text style={{ color: colors.accent, fontSize: 14, marginLeft: 5, fontWeight: "500" }}>
                            A player is connected to your game.
                        </Text>
                    </View>
                )}

                {connectionStatus === "failed" && <Text style={{ color: colors.textSecondary, fontSize: 14, margin: "auto", marginBottom: 5, textAlign: "center" }}>
                    Connection failed. It's likely that your network or the person connecting does not support WebRTC connections. See the <Text style={{ color: colors.accent }} onPress={() => linkWithFallback("https://itchy.micahlindley.com/multiplay", colors.accent)}>Itchy MultiPlay FAQ</Text> for more details.
                </Text>}

                {connectionStatus !== "failed" && <Text selectable={true} style={{ color: colors.textSecondary, fontSize: 14, margin: "auto", marginBottom: 5 }}>
                    {roomCode ? "Share this code with a friend:" : "Create a new multiplayer game session."}
                </Text>}

                {roomCode ? <View>
                    <Text style={{
                        color: colors.text,
                        fontSize: 32,
                        backgroundColor: colors.accentTransparent,
                        fontFamily: "monospace",
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 10,
                        margin: "auto"
                    }}>
                        {roomCode}
                    </Text>
                    <TouchableOpacity
                        style={{
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                            marginTop: 15
                        }}
                        onPress={() => disconnect()}
                    >
                        <MaterialIcons name="exit-to-app" size={24} color={colors.accent} />
                        <Text style={{ color: colors.accent, fontSize: 16, marginLeft: 5 }}>
                            Stop Hosting
                        </Text>
                    </TouchableOpacity>
                </View> : <Pressable
                    android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}
                    onPress={createRoom}
                    disabled={connectionStatus !== "idle"}
                    style={{
                        padding: 10,
                        paddingHorizontal: 20,
                        borderRadius: 5,
                        alignItems: "center",
                        marginHorizontal: 5,
                        backgroundColor: connectionStatus !== "idle" ? colors.backgroundTertiary : colors.backgroundSecondary,
                        opacity: connectionStatus !== "idle" ? 0.6 : 1
                    }}>
                    <Text style={{
                        color: connectionStatus !== "idle" ? colors.textSecondary : colors.text,
                        fontSize: 16,
                        fontWeight: "bold"
                    }}>
                        {connectionStatus !== "idle" && connectionStatus !== "failed" ? "Connecting..." : "Start MultiPlay"}
                    </Text>
                </Pressable>}
            </View>
        </BottomSheetView>
    );
}
