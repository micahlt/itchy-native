import { useRef, useState } from "react";
import { View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../utils/theme";

export default function Dpad({ onControlPress = () => { }, mapping = {}, containerWidth = 300 }) {
    const { colors } = useTheme();
    const heldDirections = useRef(new Set());

    // Responsive sizing based on container width
    const buttonSize = Math.max(40, Math.min(60, containerWidth * 0.15)); // 12% of container width, min 40, max 60
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
                                ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.2)",
                            justifyContent: "center",
                            alignItems: "center",
                            borderColor: "rgba(69, 137, 236, 1)",
                            boxShadow: "box-shadow: 0px 8px 6px 0px rgba(255, 255, 255, 0.2) inset, 0px 4px 5px 0px rgba(255, 255, 255, 0.5) inset, 0px 4px 14px 5px rgba(0, 0, 0, 0.4)"
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
                    borderTopWidth: 1.5,
                    borderLeftWidth: 1.5,
                    borderRightWidth: 1.5,
                    borderBottomWidth: 0,
                    borderColor: "rgba(69, 137, 236, 1)",
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
                    borderTopWidth: 1.5,
                    borderLeftWidth: 1.5,
                    borderBottomWidth: 1.5,
                    borderRightWidth: 0,
                    borderColor: "rgba(69, 137, 236, 1)",
                    boxShadow: "-5px 4px 8px rgba(0,0,0,0.1)"
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
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderWidth: 0
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
                    borderTopWidth: 1.5,
                    borderRightWidth: 1.5,
                    borderBottomWidth: 1.5,
                    borderLeftWidth: 0,
                    borderColor: "rgba(69, 137, 236, 1)",
                    boxShadow: "5px 4px 8px rgba(0,0,0,0.1)"
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
                    borderBottomWidth: 1.5,
                    borderLeftWidth: 1.5,
                    borderRightWidth: 1.5,
                    borderTopWidth: 0,
                    borderColor: "rgba(69, 137, 236, 1)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                }}
            />
        </View>
    );
};