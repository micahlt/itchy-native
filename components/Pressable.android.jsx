import { Pressable as RNPressable } from "react-native";
import { Pressable as GHPressable } from "react-native-gesture-handler";
import { View } from "react-native";

export default function Pressable({ children, onPress, onLongPress = () => { }, style = {}, android_ripple, provider = "native", ...props }) {
    if (provider === "gesture-handler") {
        return (
            <GHPressable
                onPress={onPress}
                onLongPress={onLongPress}
                android_ripple={android_ripple}
                foreground={android_ripple?.foreground ?? true}
                {...props}
            >
                <View pointerEvents="box-none" style={style}>
                    {children}
                </View>
            </GHPressable>
        );
    }
    return (
        <RNPressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={style}
            android_ripple={android_ripple}
            {...props}
        >
            {children}
        </RNPressable>
    );
};