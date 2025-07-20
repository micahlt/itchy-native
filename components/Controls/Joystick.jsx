import { useRef, useState } from "react";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../utils/theme";

export default function Joystick({ onControlPress = () => { }, mapping = {} }) {
    const { colors } = useTheme();

    const joystickRadius = 90; // Radius of the joystick container
    const handleRadius = 30; // Radius of the joystick handle

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
        const threshold = 20; // Increased threshold for better diagonal detection

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
                <MaterialIcons
                    name="circle"
                    color={isPressed ? colors.text : colors.backgroundSecondary} // Change color when pressed
                    size={36}
                />
            </Animated.View>
        </View>
    </PanGestureHandler>);
};