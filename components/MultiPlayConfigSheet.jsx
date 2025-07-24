import React from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Clipboard } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../utils/theme";

export default function MultiPlayConfigSheet({
    log = [],
    roomCode = "",
    connected = false,
    createRoom,
    disconnect,
    startMultiPlayGame,
    onClose = () => { }
}) {
    const { colors } = useTheme();
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
                <Text selectable={true} onPressIn={() => Clipboard.setString(roomCode)} style={{ color: colors.textSecondary, fontSize: 14, margin: "auto", marginBottom: 20 }}>
                    {roomCode ? "You are the host of the game." : "Create a new multiplayer game session."}
                </Text>
                {roomCode ? <View>
                    <Text style={{ color: colors.text, fontSize: 32, backgroundColor: colors.accentTransparent, fontFamily: "monospace", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, margin: "auto" }}>{roomCode}</Text>
                    <TouchableOpacity style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 15 }} onPress={() => disconnect()}>
                        <MaterialIcons name="exit-to-app" size={24} color={colors.accent} />
                        <Text style={{ color: colors.accent, fontSize: 16, marginLeft: 5 }}>Leave Game</Text>
                    </TouchableOpacity>
                    <ScrollView style={{ marginTop: 20, maxHeight: 200 }}>
                        {log.map((line, i) => (
                            <Text key={i} style={{ color: "white" }}>{line}</Text>
                        ))}
                    </ScrollView>
                </View> : <Pressable
                    android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}
                    onPress={createRoom}
                    style={{
                        padding: 10,
                        paddingHorizontal: 20,
                        borderRadius: 5,
                        alignItems: "center",
                        marginHorizontal: 5,
                        backgroundColor: colors.backgroundSecondary
                    }}>
                    <Text style={{
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: "bold"
                    }}>
                        Generate code
                    </Text>
                </Pressable>}
            </View>
        </BottomSheetView>
    );
}
