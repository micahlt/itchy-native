import { PanGestureHandler, State } from "react-native-gesture-handler";
import { View, Text } from "react-native";
import { useTheme } from "../../utils/theme";
import { useState } from "react";
import { controlOptionToShortName } from "../../utils/controlOptions";

export default function ExtraButton({ onControlPress = () => { }, keyboardKey = "" }) {
    const { colors } = useTheme();
    const [isPressed, setIsPressed] = useState(false);

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
                    width: 55,
                    height: 55,
                    backgroundColor: isPressed
                        ? colors.background // Change background when pressed
                        : colors.backgroundSecondary,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 30,
                    margin: 10,
                }}
            >
                <Text style={{ fontSize: 18, color: isPressed ? colors.text : colors.backgroundTertiary, fontWeight: "bold" }}>
                    {controlOptionToShortName(keyboardKey)}
                </Text>
            </View>
        </PanGestureHandler>
    );
};