import { Pressable as RNPressable } from "react-native";
export default function Pressable({ children, onPress, onLongPress = () => { }, style = {}, ...props }) {
    return (
        <RNPressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={style}
            {...props}
        >
            {children}
        </RNPressable>
    );
};