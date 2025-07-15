import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../utils/theme";
import { TouchableOpacity } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { PanGestureHandler, State } from "react-native-gesture-handler";

export default function ControlsSheet({ onControlPress = () => { } }) {
    const sheetRef = useRef(null);
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const { height } = useWindowDimensions();
    const [direction, setDirection] = useState("keyboard");
    const [alternateUpArrow, setAlternateUpArrow] = useState(false);
    const [currentKeys, setCurrentKeys] = useState([]);
    const s = useMemo(() => StyleSheet.create({
        roundButton: {
            borderRadius: 5000,
            paddingHorizontal: 20,
            paddingVertical: 20,
            backgroundColor: colors.backgroundSecondary,
            margin: "auto",
            alignItems: "center",
            justifyContent: "center",
        },
        buttonText: {
            color: colors.text,
            fontSize: 16,
            textAlign: "center"
        },
        buttonContainer: {
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            height: 150,
            width: 150
        },
        arrowButton: {
            position: "absolute",
        },
        upButton: {
            top: 0,
        },
        downButton: {
            bottom: 0,
        },
        leftButton: {
            left: 0,
        },
        rightButton: {
            right: 0,
        },
        centerButton: {
            alignSelf: "center",
        },
    }), [isDark]);

    const joystickRadius = 75; // Radius of the joystick container
    const handleRadius = 30; // Radius of the joystick handle

    const handleX = useSharedValue(0);
    const handleY = useSharedValue(0);

    const handleStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: handleX.value },
            { translateY: handleY.value },
        ],
    }));

    const handleJoystickGesture = (event) => {
        const { translationX: dx, translationY: dy } = event.nativeEvent;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = joystickRadius - handleRadius;

        // Clamp the handle position within the joystick container
        const clampedDx = (distance > maxDistance) ? (dx / distance) * maxDistance : dx;
        const clampedDy = (distance > maxDistance) ? (dy / distance) * maxDistance : dy;

        handleX.value = clampedDx;
        handleY.value = clampedDy;

        let direction = null;
        if (distance > maxDistance / 2) {
            const angle = Math.atan2(dy, dx);
            if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
                direction = "ArrowRight";
                setDirection("keyboard-arrow-right");
            } else if (angle > Math.PI / 4 && angle < (3 * Math.PI) / 4) {
                direction = "ArrowDown";
                setDirection("keyboard-arrow-down");
            } else if (angle <= -Math.PI / 4 && angle > -(3 * Math.PI) / 4) {
                direction = "ArrowUp";
                setDirection("keyboard-arrow-up");
            } else {
                direction = "ArrowLeft";
                setDirection("keyboard-arrow-left");
            }
        }

        if (direction) {
            onControlPress(direction, "keydown");
        }
    };

    const handleJoystickStateChange = (event) => {
        if (event.nativeEvent.state === State.END) {
            handleX.value = 0;
            handleY.value = 0;

            onControlPress("ArrowUp", "keyup");
            onControlPress("ArrowDown", "keyup");
            onControlPress("ArrowLeft", "keyup");
            onControlPress("ArrowRight", "keyup");
            setDirection("keyboard");
        }
    };

    const handleSpaceGesture = (event) => {
        if (event.nativeEvent.state === State.BEGAN) {
            onControlPress(" ", "keydown");
        } else {
            onControlPress(" ", "keyup");
        }
    };

    return (
        <BottomSheet
            ref={sheetRef}
            enablePanDownToClose={false}
            enableDynamicSizing={false}
            snapPoints={[height / 3]}
            enableOverDrag={false}
            handleComponent={null}
            backgroundStyle={{ backgroundColor: colors.backgroundTertiary }}
            style={{
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                overflow: "hidden",
                shadowColor: "#000",
            }}
        >
            <BottomSheetView style={{ backgroundColor: colors.backgroundTertiary, padding: 10, alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }}>
                <PanGestureHandler
                    onGestureEvent={handleJoystickGesture}
                    onHandlerStateChange={handleJoystickStateChange}
                >
                    <View
                        style={{
                            width: joystickRadius * 2,
                            height: joystickRadius * 2,
                            borderRadius: joystickRadius,
                            backgroundColor: colors.backgroundSecondary,
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                        }}
                    >
                        <Animated.View
                            style={[
                                {
                                    width: handleRadius * 2,
                                    height: handleRadius * 2,
                                    borderRadius: handleRadius,
                                    backgroundColor: colors.backgroundTertiary,
                                    position: "absolute",
                                    justifyContent: "center",
                                    alignItems: "center",
                                },
                                handleStyle,
                            ]}
                        >
                            <MaterialIcons name={direction} color={colors.text} size={36} />
                        </Animated.View>
                    </View>
                </PanGestureHandler>
                <PanGestureHandler onHandlerStateChange={handleSpaceGesture}>
                    <View style={{ ...s.roundButton, height: 100, width: 100 }}>
                        <Text style={s.buttonText}>SPACE</Text>
                    </View>
                </PanGestureHandler>
            </BottomSheetView>
        </BottomSheet>
    );
};