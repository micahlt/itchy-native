import { TouchableOpacity } from "react-native";
export default function Pressable({ children, onPress, style = {}, ...props }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={style}
            activeOpacity={props.activeOpacity || 0.7}
            {...props}
        >
            {children}
        </TouchableOpacity>
    );
};