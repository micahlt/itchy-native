import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useEffect, useRef } from "react";
import * as Haptics from 'expo-haptics';
import { Text, useWindowDimensions, View } from "react-native";
import { useTheme } from "../utils/theme";
import Joystick from "./Controls/Joystick";
import Dpad from "./Controls/Dpad";
import ButtonPad from "./Controls/ButtonPad";
import ExtraButton from "./Controls/ExtraButton";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMMKVObject } from "react-native-mmkv";
import { TouchableOpacity } from "react-native-gesture-handler";

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

export default function ControlsSheet({ onControlPress = () => { }, onClose = () => { }, opened = false, height: passedHeight = 300, projectId = 0 }) {
    const [currentMapping, setCurrentMapping] = useMMKVObject("currentMapping");
    const [localControllerMappings] = useMMKVObject("localControllerMappings");
    const sheetRef = useRef(null);
    const { colors } = useTheme();
    const { width } = useWindowDimensions();

    const onControlPressProxy = (key, action) => {
        if (action === "keydown") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        }
        onControlPress(key, action);
    }

    useEffect(() => {
        fetch(`https://itchy-controldb.vercel.app/api/controllermapping?projectId=${projectId}&mappingId=${localControllerMappings[projectId] ? localControllerMappings[projectId] : ""}`)
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
        <BottomSheet
            onClose={onClose}
            ref={sheetRef}
            index={opened ? 0 : -1}
            enablePanDownToClose={true}
            enableDynamicSizing={false}
            snapPoints={[passedHeight]}
            enableOverDrag={true}
            enableContentPanningGesture={false}
            enableHandlePanningGesture={true}
            backgroundStyle={{ backgroundColor: colors.backgroundTertiary }}
            style={{
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                overflow: "hidden",
                shadowColor: "#000",
            }}
        >
            <BottomSheetView style={{ backgroundColor: colors.backgroundTertiary, padding: 5, flexDirection: "column", alignItems: "center", justifyContent: "flex-start", height: "100%" }}>
                {currentMapping?.controlOptions ? (
                    <>
                        <View style={{ flex: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingHorizontal: Math.max(10, width * 0.02) }}>
                            {currentMapping.controlOptions.showPrimaryController && <>
                                {currentMapping.controlOptions.primaryController === "joystick" && <Joystick onControlPress={onControlPressProxy} mapping={currentMapping.controls.primary} />}
                                {currentMapping.controlOptions.primaryController === "dpad" && <Dpad onControlPress={onControlPressProxy} mapping={currentMapping.controls.primary} />}
                                {currentMapping.controlOptions.primaryController === "buttonpad" && <ButtonPad onControlPress={onControlPressProxy} mapping={currentMapping.controls.primary} />}
                            </>}
                            {currentMapping.controlOptions.showSecondaryController && <>
                                {currentMapping.controlOptions.secondaryController === "joystick" && <Joystick onControlPress={onControlPressProxy} mapping={currentMapping.controls.secondary} />}
                                {currentMapping.controlOptions.secondaryController === "dpad" && <Dpad onControlPress={onControlPressProxy} mapping={currentMapping.controls.secondary} />}
                                {currentMapping.controlOptions.secondaryController === "buttonpad" && <ButtonPad onControlPress={onControlPressProxy} mapping={currentMapping.controls.secondary} />}
                            </>}
                        </View>
                        {currentMapping.controls.extra.length > 0 && <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start", justifyContent: "center", marginTop: 20, borderColor: colors.backgroundSecondary, borderTopWidth: 1, width: "90%", paddingTop: 10, marginHorizontal: width * 0.05, zIndex: 2 }}>
                            {currentMapping.controls.extra.map((key, index) => (
                                <ExtraButton key={index} onControlPress={onControlPressProxy} keyboardKey={key} />
                            ))}
                        </View>}
                    </>
                ) : (
                    <Text style={{ color: colors.text }}>Loading controls...</Text>
                )}
                <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center", width: "100%", paddingHorizontal: 20, paddingVertical: 10 }}>
                    {currentMapping?.username && <Text style={{ color: colors.text, opacity: 0.4, marginBottom: -10 }}>Current control setup provided by @{currentMapping.username}</Text>}
                    <TouchableOpacity onPress={() => router.push(`/projects/${projectId}/controls/find`)} style={{ padding: 20, flexDirection: "row", alignItems: "center", }} android_ripple={{ color: colors.accentTransparent, radius: 30 }}>
                        <MaterialIcons name="settings" backgroundColor="transparent" color={colors.textSecondary} size={16} /><Text style={{ marginLeft: 10, color: colors.textSecondary, fontSize: 16, fontWeight: "bold" }}>Configure Controls</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};