import { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import ItchyText from "../ItchyText";
import { PanGestureHandler } from "react-native-gesture-handler";
import { useTheme } from "../../utils/theme";

export default function ButtonPad({ onControlPress = () => { }, mapping = {}, containerWidth = 300 }) {
    const { colors } = useTheme();
    const heldDirections = useRef(new Set());

    // Responsive sizing based on container width
    const buttonSize = Math.max(50, Math.min(70, containerWidth * 0.15)); // 8% of container width, min 50, max 70

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

    const CircleButton = ({ direction, label, style }) => {
        const [isPressed, setIsPressed] = useState(false);
        const labelText = useMemo(() => {
            switch (label) {
                case "ArrowUp":
                    return "↑";
                case "ArrowDown":
                    return "↓ ";
                case "ArrowLeft":
                    return "←";
                case "ArrowRight":
                    return "→";
                case " ":
                    return "␣";
                default:
                    return label.toUpperCase();
            }
        }, [label])

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
                            borderRadius: buttonSize / 2, // Make the button circular
                            backgroundColor: isPressed
                                ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.2)",
                            justifyContent: "center",
                            alignItems: "center",
                            borderWidth: 0,
                            borderColor: colors.backgroundSecondary,
                            boxShadow: "0px 4px 14px 0px rgba(0, 0, 0, 0.1), 0px 6px 10px 0px rgba(255, 255, 255, 0.15) inset, 0px 2px 5px 0px rgba(255, 255, 255, 0.2) inset",
                            outlineColor: "rgba(69, 137, 236, 1)",
                            outlineWidth: 1.5
                        },
                        style,
                    ]}
                >
                    <ItchyText style={{ color: isPressed ? colors.text : colors.backgroundTertiary, fontSize: Math.max(14, Math.min(18, buttonSize * 0.26)), fontWeight: "bold" }}>
                        {labelText}
                    </ItchyText>
                </View>
            </PanGestureHandler>
        );
    };

    return (
        <View
            style={{
                width: buttonSize * 3, // Increased overall width
                height: buttonSize * 3, // Increased overall height
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
            }}
        >
            {/* Up button */}
            <CircleButton
                direction={mapping.up}
                label={mapping.up}
                style={{
                    position: "absolute",
                    top: buttonSize * 0.1, // Slightly farther from the center
                    left: buttonSize,
                }}
            />

            {/* Left button */}
            <CircleButton
                direction={mapping.left}
                label={mapping.left}
                style={{
                    position: "absolute",
                    top: buttonSize,
                    left: buttonSize * 0.1, // Slightly farther from the center
                }}
            />

            {/* Right button */}
            <CircleButton
                direction={mapping.right}
                label={mapping.right}
                style={{
                    position: "absolute",
                    top: buttonSize,
                    left: buttonSize * 1.9, // Slightly farther from the center
                }}
            />

            {/* Down button */}
            <CircleButton
                direction={mapping.down}
                label={mapping.down}
                style={{
                    position: "absolute",
                    top: buttonSize * 1.9, // Slightly farther from the center
                    left: buttonSize,
                }}
            />
        </View>
    );
};