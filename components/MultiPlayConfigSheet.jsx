import React from "react";
import { View, TouchableOpacity } from "react-native";
import ItchyText from "./ItchyText";
import { Pressable } from "react-native";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../utils/theme";
import linkWithFallback from "../utils/linkWithFallback";
import { useMMKVObject } from "react-native-mmkv";
import Card from "./Card";

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
    const [user] = useMMKVObject("user");

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
                <ItchyText style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "bold",
                    marginRight: 10
                }}>
                    MultiPlay Setup
                </ItchyText>
                <View style={{
                    backgroundColor: colors.accent,
                    borderRadius: 5,
                    paddingHorizontal: 8,
                    paddingVertical: 2
                }}>
                    <ItchyText style={{
                        color: "white",
                        fontSize: 12,
                        fontWeight: "bold"
                    }}>
                        ALPHA
                    </ItchyText>
                </View>
            </View>
            <ItchyText style={{
                color: colors.textSecondary,
                fontSize: 14,
                opacity: 0.5,
                marginBottom: 20
            }}>
                Play local-multiplayer games online with WebRTC. Configure your multiplayer settings below to get started. We're assuming you already have your controller mappings set up for this project.
            </ItchyText>

            {isUserUnder13() && (
                <Card style={{ paddingHorizontal: 15, paddingVertical: 10, marginBottom: 20, backgroundColor: colors.backgroundSecondary }}>
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

            <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                    <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: statusInfo.color,
                        marginRight: 8
                    }} />
                    <ItchyText style={{ color: statusInfo.color, fontSize: 14, fontWeight: "500" }}>
                        {statusInfo.text}
                    </ItchyText>
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
                        <ItchyText style={{ color: colors.accent, fontSize: 14, marginLeft: 5, fontWeight: "500" }}>
                            A player is connected to your game.
                        </ItchyText>
                    </View>
                )}

                {connectionStatus === "failed" && <ItchyText style={{ color: colors.textSecondary, fontSize: 14, margin: "auto", marginBottom: 5, textAlign: "center" }}>
                    Connection failed. It's likely that your network or the person connecting does not support WebRTC connections. See the <ItchyText style={{ color: colors.accent }} onPress={() => linkWithFallback("https://itchy.micahlindley.com/multiplay", colors.accent)}>Itchy MultiPlay FAQ</ItchyText> for more details.
                </ItchyText>}

                {connectionStatus !== "failed" && <ItchyText selectable={true} style={{ color: colors.textSecondary, fontSize: 14, margin: "auto", marginBottom: 5 }}>
                    {roomCode ? "Share this code with a friend:" : "Create a new multiplayer game session."}
                </ItchyText>}

                {roomCode ? <View>
                    <ItchyText style={{
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
                    </ItchyText>
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
                        <ItchyText style={{ color: colors.accent, fontSize: 16, marginLeft: 5 }}>
                            Stop Hosting
                        </ItchyText>
                    </TouchableOpacity>
                </View> : <Pressable
                    android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}
                    onPress={isUserUnder13() ? null : createRoom}
                    disabled={connectionStatus !== "idle" || isUserUnder13()}
                    style={{
                        padding: 10,
                        paddingHorizontal: 20,
                        borderRadius: 5,
                        alignItems: "center",
                        marginHorizontal: 5,
                        backgroundColor: (connectionStatus !== "idle" || isUserUnder13()) ? colors.backgroundTertiary : colors.backgroundSecondary,
                        opacity: (connectionStatus !== "idle" || isUserUnder13()) ? 0.6 : 1
                    }}>
                    <ItchyText style={{
                        color: (connectionStatus !== "idle" || isUserUnder13()) ? colors.textSecondary : colors.text,
                        fontSize: 16,
                        fontWeight: "bold"
                    }}>
                        {isUserUnder13() ? "Age Restricted" : (connectionStatus !== "idle" && connectionStatus !== "failed" ? "Connecting..." : "Start MultiPlay")}
                    </ItchyText>
                </Pressable>}
            </View>
        </BottomSheetView>
    );
}
