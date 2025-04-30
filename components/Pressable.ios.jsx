import { TouchableOpacity } from "react-native";
export default function Pressable({ children, onPress, onLongPress = () => { }, style = {}, ...props }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            style={style}
            activeOpacity={props.activeOpacity || 0.7}
            {...props}
        >
            {children}
        </TouchableOpacity>
    );
};