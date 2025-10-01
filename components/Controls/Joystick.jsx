import { useRef, useState } from "react";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../utils/theme";

export default function Joystick({ onControlPress = () => { }, mapping = {}, containerWidth = 300 }) {
    const { colors, dimensions } = useTheme();

    // Responsive sizing based on container width
    const joystickRadius = Math.max(60, Math.min(90, containerWidth * 0.22)); // 20% of container width, min 60, max 90
    const handleRadius = joystickRadius / 3; // Keep proportional relationship

    const handleX = useSharedValue(0);
    const handleY = useSharedValue(0);

    const handleStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: handleX.value },
            { translateY: handleY.value },
        ],
    }));

    const calculateDirections = (dx, dy) => {
        const directions = [];
        const threshold = joystickRadius * 0.22; // Dynamic threshold based on joystick size

        // Check vertical directions
        if (dy < -threshold) directions.push(mapping.up);
        if (dy > threshold) directions.push(mapping.down);

        // Check horizontal directions
        if (dx < -threshold) directions.push(mapping.left);
        if (dx > threshold) directions.push(mapping.right);

        return directions;
    };


    const heldDirections = useRef(new Set());
    const [isPressed, setIsPressed] = useState(false);

    const handleJoystickGesture = (event) => {
        setIsPressed(true); // Set pressed state when gesture starts
        const { translationX: dx, translationY: dy } = event.nativeEvent;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = joystickRadius - handleRadius;

        // Clamp position
        const clampedDx = (distance > maxDistance) ? (dx / distance) * maxDistance : dx;
        const clampedDy = (distance > maxDistance) ? (dy / distance) * maxDistance : dy;

        handleX.value = clampedDx;
        handleY.value = clampedDy;

        // Compute new directions
        const newDirections = new Set(calculateDirections(clampedDx, clampedDy));
        const prevDirections = heldDirections.current;

        // Release any keys no longer held
        prevDirections.forEach(key => {
            if (!newDirections.has(key)) {
                onControlPress(key, "keyup");
            }
        });

        // Press any new keys
        newDirections.forEach(key => {
            if (!prevDirections.has(key)) {
                onControlPress(key, "keydown");
            }
        });

        heldDirections.current = newDirections;
    };

    const handleJoystickStateChange = (event) => {
        if (event.nativeEvent.state === State.END) {
            setIsPressed(false); // Reset pressed state when gesture ends
            handleX.value = 0;
            handleY.value = 0;

            heldDirections.current.forEach(key => {
                onControlPress(key, "keyup");
            });
            heldDirections.current.clear();
        }
    };

    return (<PanGestureHandler
        onGestureEvent={handleJoystickGesture}
        onHandlerStateChange={handleJoystickStateChange}
    >
        <View
            style={{
                width: joystickRadius * 2,
                height: joystickRadius * 2,
                borderRadius: joystickRadius,
                backgroundColor: "rgba(0,0,0,0.1)",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                boxShadow: "0px 4px 10px 0px #0000001A inset, 0px 4px 5px 0px #FFFFFF1A"
            }}
        >
            <Animated.View
                style={[
                    {
                        width: handleRadius * 2,
                        height: handleRadius * 2,
                        borderRadius: handleRadius,
                        backgroundColor: isPressed
                            ? "rgba(255, 255, 255, 0.8)"
                            : "rgba(255, 255, 255, 0.6)",
                        position: "absolute",
                        justifyContent: "center",
                        alignItems: "center",
                        outlineColor: "rgba(255, 255, 255, 0.15)",
                        outlineWidth: 2,
                        boxShadow: "box-shadow: 0px 8px 6px 0px rgba(255, 255, 255, 0.2) inset, 0px 4px 5px 0px rgba(255, 255, 255, 0.5) inset, 0px 4px 14px 5px rgba(0, 0, 0, 0.4)"
                    },
                    handleStyle,
                ]}
            >
            </Animated.View>
        </View>
    </PanGestureHandler>);
};