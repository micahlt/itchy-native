import { Pressable as RNPressable } from "react-native";
export default function Pressable({ children, onPress, style = {}, ...props }) {
    return (
        <RNPressable
            onPress={onPress}
            style={style}
            {...props}
        >
            {children}
        </RNPressable>
    );
};