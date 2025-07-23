import React from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Clipboard } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";

export default function MultiPlayConfigSheet({
    colors,
    isHost,
    connected,
    log,
    roomCode,
    activeOnlineTab,
    setActiveOnlineTab,
    createRoom,
    joinRoom,
    setRoomCode,
    disconnect,
    startMultiPlayGame,
    onClose = () => { }
}) {
    return (
        <BottomSheetView style={{ padding: 20, paddingTop: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "bold",
                    marginRight: 10
                }}>
                    MultiPlay Configuration
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
            {!isHost && <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Pressable
                    android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}
                    onPress={() => setActiveOnlineTab("create")}
                    style={{
                        padding: 10,
                        paddingHorizontal: 20,
                        borderRadius: 5,
                        alignItems: "center",
                        marginHorizontal: 5,
                        backgroundColor: activeOnlineTab === "create" ? colors.accent : colors.backgroundSecondary
                    }}>
                    <Text style={{
                        color: activeOnlineTab === "create" ? "white" : colors.text,
                        fontSize: 16,
                        fontWeight: "bold"
                    }}>
                        Create Game
                    </Text>
                </Pressable>
                <Pressable
                    android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}
                    onPress={() => setActiveOnlineTab("join")}
                    style={{
                        padding: 10,
                        paddingHorizontal: 20,
                        borderRadius: 5,
                        alignItems: "center",
                        marginHorizontal: 5,
                        backgroundColor: activeOnlineTab === "join" ? colors.accent : colors.backgroundSecondary
                    }}>
                    <Text style={{
                        color: activeOnlineTab === "join" ? "white" : colors.text,
                        fontSize: 16,
                        fontWeight: "bold"
                    }}>
                        Join Game
                    </Text>
                </Pressable>
            </View>}
            {activeOnlineTab === "create" && (
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
                        <TouchableOpacity style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 15 }} onPress={() => {
                            startMultiPlayGame();
                            onClose();
                        }}>
                            <MaterialIcons name="flag" size={24} color={colors.accent} />
                            <Text style={{ color: colors.accent, fontSize: 16, marginLeft: 5 }}>Start Game</Text>
                        </TouchableOpacity>
                        <ScrollView style={{ marginTop: 20, maxHeight: 200 }}>
                            {log.map((line, i) => (
                                <Text key={i} style={{ color: "white" }}>{line}</Text>
                            ))}
                        </ScrollView>
                    </View> : <Pressable
                        android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}
                        onPress={() => createRoom()}
                        style={{
                            padding: 10,
                            paddingHorizontal: 20,
                            borderRadius: 5,
                            alignItems: "center",
                            marginHorizontal: 5,
                            backgroundColor: activeOnlineTab === "join" ? colors.accent : colors.backgroundSecondary
                        }}>
                        <Text style={{
                            color: activeOnlineTab === "join" ? "white" : colors.text,
                            fontSize: 16,
                            fontWeight: "bold"
                        }}>
                            Generate code
                        </Text>
                    </Pressable>}
                </View>
            )}
            {activeOnlineTab === "join" && (
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                    <Text selectable={true} style={{ color: colors.textSecondary, fontSize: 14, margin: "auto", marginBottom: 20 }}>
                        Join with a code provided by the host.
                    </Text>
                    {!connected ? <>
                        <TextInput
                            placeholder="------"
                            placeholderTextColor={colors.textSecondary}
                            onEndEditing={(e) => setRoomCode(e.nativeEvent.text)}
                            style={{
                                color: colors.text,
                                fontSize: 32,
                                backgroundColor: colors.accentTransparent,
                                fontFamily: "monospace",
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                borderRadius: 10,
                                textAlign: "center",
                                width: 200,
                                marginBottom: 20,
                            }}
                        />
                        <Pressable
                            android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}
                            onPress={() => joinRoom()}
                            style={{
                                padding: 10,
                                paddingHorizontal: 20,
                                borderRadius: 5,
                                alignItems: "center",
                                backgroundColor: colors.accent,
                            }}
                        >
                            <Text style={{
                                color: "white",
                                fontSize: 16,
                                fontWeight: "bold"
                            }}>
                                Join Game
                            </Text>
                        </Pressable>
                        <ScrollView style={{ marginTop: 20, maxHeight: 200 }}>
                            {log.map((line, i) => (
                                <Text key={i} style={{ color: "white" }}>{line}</Text>
                            ))}
                        </ScrollView>
                    </> : <View>
                        <Text style={{ color: colors.text, fontSize: 32, backgroundColor: colors.accentTransparent, fontFamily: "monospace", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 }}>{roomCode}</Text>
                        <TouchableOpacity style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 15 }} onPress={() => disconnect()}>
                            <MaterialIcons name="exit-to-app" size={24} color={colors.accent} />
                            <Text style={{ color: colors.accent, fontSize: 16, marginLeft: 5 }}>Leave Game</Text>
                        </TouchableOpacity>
                    </View>}
                </View>
            )}
        </BottomSheetView>
    );
}
