import { useRef, useState } from "react";
import { View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../utils/theme";

export default function Dpad({ onControlPress = () => { }, mapping = {} }) {
    const { colors } = useTheme();
    const heldDirections = useRef(new Set());

    const buttonSize = 60; // Increased from 50
    const iconSize = 32; // Increased from 24

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
                    <MaterialIcons name={icon} color={colors.text} size={iconSize} />
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
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
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
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
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
                    borderTopRightRadius: 8,
                    borderBottomRightRadius: 8,
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
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    borderWidth: 0
                }}
            />
        </View>
    );
};