import { useRef, useState } from "react";
import { View, Text } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import { useTheme } from "../../utils/theme";

export default function ButtonPad({ onControlPress = () => { }, mapping = {} }) {
    const { colors } = useTheme();
    const heldDirections = useRef(new Set());

    const buttonSize = 70; // Increased from 60

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
                    <Text style={{ color: isPressed ? colors.text : colors.backgroundTertiary, fontSize: 18, fontWeight: "bold" }}>
                        {label.toUpperCase()}
                    </Text>
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