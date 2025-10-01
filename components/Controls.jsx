import { useEffect, useState } from "react";
import * as Haptics from 'expo-haptics';
import { View } from "react-native";
import ItchyText from "./ItchyText";
import { useTheme } from "../utils/theme";
import Joystick from "./Controls/Joystick";
import Dpad from "./Controls/Dpad";
import ButtonPad from "./Controls/ButtonPad";
import ExtraButton from "./Controls/ExtraButton";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMMKVObject } from "react-native-mmkv";
import FastSquircleView from "react-native-fast-squircle";
import { dimensions } from "../utils/theme/dimensions";
import { LinearGradient } from "expo-linear-gradient";
import Pressable from "./Pressable";

const MAPPING_CONFIG = {
    controlOptions: {
        showPrimaryController: true,
        showSecondaryController: true,
        primaryController: "joystick",
        secondaryController: "buttonpad",
    },
    controls: {
        primary: {
            up: "W",
            down: "S",
            left: "A",
            right: "D",
        },
        secondary: {
            up: "E",
            down: " ",
            left: "Q",
            right: "E",
        },
        extra: []
    },
}

export default function Controls({ onControlPress = () => { }, projectId = 0, showConfiguration = true, style = {} }) {
    const [currentMapping, setCurrentMapping] = useMMKVObject("currentMapping");
    const [localControllerMappings] = useMMKVObject("localControllerMappings");
    const [containerDimensions, setContainerDimensions] = useState({ width: 300, height: 200 });
    const { colors } = useTheme();

    const onControlPressProxy = (key, action) => {
        if (action === "keydown") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        }
        onControlPress(key, action);
    }

    useEffect(() => {
        fetch(`https://itchy-controldb.vercel.app/api/controllermapping?projectId=${projectId}&mappingId=${localControllerMappings ? (localControllerMappings[projectId] ? localControllerMappings[projectId] : "") : ""}`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.error) {
                    setCurrentMapping(data[0]);
                } else {
                    setCurrentMapping(MAPPING_CONFIG);
                }
            });
    }, [projectId, localControllerMappings]);

    return (
        <View
            style={[{
                padding: 5,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start"
            }, style]}
            onLayout={(event) => {
                const { width: containerWidth, height: containerHeight } = event.nativeEvent.layout;
                setContainerDimensions({ width: containerWidth, height: containerHeight });
            }}
        >
            {currentMapping?.controlOptions ? (
                <FastSquircleView cornerSmoothing={0.8} style={{
                    backgroundColor: colors.accent,
                    borderRadius: dimensions.largeRadius,
                    borderWidth: 1,
                    borderColor: colors.accent,
                    outlineColor: colors.outline,
                    outlineWidth: 2,
                    overflow: 'hidden',
                    boxShadow: "0px 10px 20px 0px #FFFFFF40 inset, 0px 2px 1px 0px #FFFFFF40 inset, 0px -5px 0px 0px #0000001A inset, 0px 4px 5px 2px rgba(76, 148, 255, 0.375), 0px 8px 6px 0px #FFFFFF33 inset, 0px 4px 0px 0px #FFFFFF4D inset",
                    width: "100%"
                }}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.2)', 'rgba(0,0,0,0.2)']}
                        dither={false}
                        style={{ paddingVertical: 10 }}
                    >
                        <View style={{
                            flex: 0,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            paddingHorizontal: Math.max(10, containerDimensions.width * 0.02)
                        }}>
                            {currentMapping.controlOptions.showPrimaryController && <>
                                {currentMapping.controlOptions.primaryController === "joystick" && <Joystick onControlPress={onControlPressProxy} mapping={currentMapping.controls.primary} containerWidth={containerDimensions.width} />}
                                {currentMapping.controlOptions.primaryController === "dpad" && <Dpad onControlPress={onControlPressProxy} mapping={currentMapping.controls.primary} containerWidth={containerDimensions.width} />}
                                {currentMapping.controlOptions.primaryController === "buttonpad" && <ButtonPad onControlPress={onControlPressProxy} mapping={currentMapping.controls.primary} containerWidth={containerDimensions.width} />}
                            </>}
                            {currentMapping.controlOptions.showSecondaryController && <>
                                {currentMapping.controlOptions.secondaryController === "joystick" && <Joystick onControlPress={onControlPressProxy} mapping={currentMapping.controls.secondary} containerWidth={containerDimensions.width} />}
                                {currentMapping.controlOptions.secondaryController === "dpad" && <Dpad onControlPress={onControlPressProxy} mapping={currentMapping.controls.secondary} containerWidth={containerDimensions.width} />}
                                {currentMapping.controlOptions.secondaryController === "buttonpad" && <ButtonPad onControlPress={onControlPressProxy} mapping={currentMapping.controls.secondary} containerWidth={containerDimensions.width} />}
                            </>}
                        </View>
                        {currentMapping.controls.extra.length > 0 && (
                            <View style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "flex-start",
                                justifyContent: "center",
                                marginTop: 20,
                                borderColor: "rgba(0,0,0,0.3)",
                                borderTopWidth: 1,
                                width: "90%",
                                paddingTop: 10,
                                marginHorizontal: containerDimensions.width * 0.05,
                                zIndex: 2
                            }}>
                                {currentMapping.controls.extra.map((key, index) => (
                                    <ExtraButton key={index} onControlPress={onControlPressProxy} keyboardKey={key} />
                                ))}
                            </View>
                        )}
                    </LinearGradient>
                </FastSquircleView>
            ) : (
                <ItchyText style={{ color: colors.text, padding: 20 }}>Loading controls...</ItchyText>
            )}
            <View style={{ marginTop: -68, zIndex: -1, alignItems: "flex-start", width: "100%", flexDirection: 'row' }}>
                <Pressable
                    onPress={() => router.push(`/projects/${projectId}/controls/find`)}
                    style={{
                        marginLeft: 10,
                        padding: 15,
                        paddingTop: 70,
                        paddingBottom: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.background,
                        borderRadius: dimensions.smallRadius,
                        marginTop: 5,
                        outlineWidth: dimensions.outlineWidth,
                        outlineColor: colors.outline,
                        borderWidth: 1,
                        borderColor: colors.background,
                        borderBottomWidth: 4,
                        borderBottomColor: colors.backgroundSecondary
                    }}
                >
                    <Ionicons
                        name="chevron-up"
                        backgroundColor="transparent"
                        color={colors.textSecondary}
                        size={16}
                    />
                    <ItchyText style={{
                        marginLeft: 10,
                        color: colors.textSecondary,
                        fontSize: 14,
                        fontWeight: "bold"
                    }}>
                        Close
                    </ItchyText>
                </Pressable>
                <Pressable
                    onPress={() => router.push(`/projects/${projectId}/controls/find`)}
                    style={{
                        marginLeft: 10,
                        padding: 15,
                        paddingTop: 70,
                        paddingBottom: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.background,
                        borderRadius: dimensions.smallRadius,
                        marginTop: 5,
                        outlineWidth: dimensions.outlineWidth,
                        outlineColor: colors.outline,
                        borderWidth: 1,
                        borderColor: colors.background,
                        borderBottomWidth: 4,
                        borderBottomColor: colors.backgroundSecondary
                    }}
                >
                    <MaterialIcons
                        name="settings"
                        backgroundColor="transparent"
                        color={colors.textSecondary}
                        size={16}
                    />
                    <ItchyText style={{
                        marginLeft: 10,
                        color: colors.textSecondary,
                        fontSize: 14,
                        fontWeight: "bold"
                    }}>
                        Configure Controls
                    </ItchyText>
                </Pressable>
            </View>
            {showConfiguration && (
                <View style={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    paddingHorizontal: 20,
                    paddingVertical: 10
                }}>
                    {currentMapping?.username && (
                        <ItchyText style={{
                            color: colors.text,
                            opacity: 0.4,
                            marginBottom: 5,
                            textAlign: "center",
                            fontSize: 12
                        }}>
                            Current control setup provided by @{currentMapping.username}
                        </ItchyText>
                    )}
                </View>
            )}
        </View>
    );
}