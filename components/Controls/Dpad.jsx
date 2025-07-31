import { useRef, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../utils/theme";

export default function Dpad({ onControlPress = () => { }, mapping = {} }) {
    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const heldDirections = useRef(new Set());

    // Responsive sizing based on screen width
    const buttonSize = Math.max(40, Math.min(60, width * 0.30)); // 8% of screen width, min 40, max 60
    const iconSize = Math.max(20, Math.min(32, buttonSize * 0.53)); // Proportional to button size

    const handlePress = (direction) => {
        if (!heldDirections.current.has(direction)) {
            heldDirections.current.add(direction);
            onControlPress(direction, "keydown");
        }
    };

    const handleRelease = (direction) => {
        if (heldDirections.current.has(direction)) {
            heldDirections.current.delete(direction);
            onControlPress(direction, "keyup");
        }
    };

    const DpadButton = ({ direction, icon, style }) => {
        const [isPressed, setIsPressed] = useState(false);

        return (
            <PanGestureHandler
                onBegan={() => {
                    setIsPressed(true);
                    handlePress(direction);
                }}
                onEnded={() => {
                    setIsPressed(false);
                    handleRelease(direction);
                }}
                onCancelled={() => {
                    setIsPressed(false);
                    handleRelease(direction);
                }}
                onFailed={() => {
                    setIsPressed(false);
                    handleRelease(direction);
                }}
            >
                <View
                    style={[
                        {
                            width: buttonSize,
                            height: buttonSize,
                            backgroundColor: isPressed
                                ? colors.background // Slightly darker color
                                : colors.backgroundSecondary,
                            justifyContent: "center",
                            alignItems: "center",
                            borderWidth: 0,
                            borderColor: colors.backgroundSecondary,
                        },
                        style,
                    ]}
                >
                    <MaterialIcons name={icon} color={isPressed ? colors.text : colors.backgroundTertiary} size={iconSize} />
                </View>
            </PanGestureHandler>
        );
    };

    return (
        <View
            style={{
                width: buttonSize * 3,
                height: buttonSize * 3,
                position: "relative",
            }}
        >
            {/* Up button */}
            <DpadButton
                direction={mapping.up}
                icon="keyboard-arrow-up"
                style={{
                    position: "absolute",
                    top: 1,
                    left: buttonSize,
                    borderTopLeftRadius: Math.max(6, buttonSize * 0.13),
                    borderTopRightRadius: Math.max(6, buttonSize * 0.13),
                    borderWidth: 0,
                    marginBottom: 0
                }}
            />

            {/* Left button */}
            <DpadButton
                direction={mapping.left}
                icon="keyboard-arrow-left"
                style={{
                    position: "absolute",
                    top: buttonSize,
                    left: 0,
                    borderTopLeftRadius: Math.max(6, buttonSize * 0.13),
                    borderBottomLeftRadius: Math.max(6, buttonSize * 0.13),
                    borderWidth: 0
                }}
            />

            {/* Center (non-interactive) */}
            <View
                style={{
                    position: "absolute",
                    top: buttonSize,
                    left: buttonSize,
                    width: buttonSize,
                    height: buttonSize,
                    backgroundColor: colors.backgroundSecondary,
                    borderWidth: 0,
                }}
            />

            {/* Right button */}
            <DpadButton
                direction={mapping.right}
                icon="keyboard-arrow-right"
                style={{
                    position: "absolute",
                    top: buttonSize,
                    left: buttonSize * 2,
                    borderTopRightRadius: Math.max(6, buttonSize * 0.13),
                    borderBottomRightRadius: Math.max(6, buttonSize * 0.13),
                    borderWidth: 0
                }}
            />

            {/* Down button */}
            <DpadButton
                direction={mapping.down}
                icon="keyboard-arrow-down"
                style={{
                    position: "absolute",
                    top: buttonSize * 2,
                    left: buttonSize,
                    borderBottomLeftRadius: Math.max(6, buttonSize * 0.13),
                    borderBottomRightRadius: Math.max(6, buttonSize * 0.13),
                    borderWidth: 0
                }}
            />
        </View>
    );
};