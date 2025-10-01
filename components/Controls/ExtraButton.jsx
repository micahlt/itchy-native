import { PanGestureHandler, State } from "react-native-gesture-handler";
import { View, useWindowDimensions } from "react-native";
import ItchyText from "../ItchyText";
import { useTheme } from "../../utils/theme";
import { useState } from "react";
import { controlOptionToShortName } from "../../utils/controlOptions";

export default function ExtraButton({ onControlPress = () => { }, keyboardKey = "" }) {
    const { colors } = useTheme();
    const { width } = useWindowDimensions();
    const [isPressed, setIsPressed] = useState(false);

    // Responsive sizing based on screen width
    const buttonSize = Math.max(40, Math.min(55, width * 0.075)); // 7.5% of screen width, min 40, max 55
    const fontSize = Math.max(14, Math.min(18, buttonSize * 0.33)); // Proportional to button size

    const handleTouchGesture = (event) => {
        if (event.nativeEvent.state === State.BEGAN) {
            setIsPressed(true);
            onControlPress(keyboardKey, "keydown");
        } else {
            setIsPressed(false);
            onControlPress(keyboardKey, "keyup");
        }
    };

    return (
        <PanGestureHandler onHandlerStateChange={handleTouchGesture}>
            <View
                style={{
                    width: buttonSize,
                    height: buttonSize,
                    backgroundColor: isPressed
                        ? colors.background // Change background when pressed
                        : colors.backgroundSecondary,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: buttonSize / 2,
                    margin: Math.max(8, buttonSize * 0.15), // Responsive margin
                }}
            >
                <ItchyText style={{ fontSize: fontSize, color: isPressed ? colors.text : colors.backgroundTertiary, fontWeight: "bold" }}>
                    {controlOptionToShortName(keyboardKey)}
                </ItchyText>
            </View>
        </PanGestureHandler>
    );
};