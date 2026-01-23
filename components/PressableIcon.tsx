import { Ionicons } from "@expo/vector-icons";
import { ColorValue, StyleProp, TextStyle } from "react-native";

import { TouchableOpacity } from "react-native-gesture-handler";

type PressableIconProps = {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  onPress: () => any;
  color: ColorValue;
  style: StyleProp<TextStyle>;
};

export default function PressableIcon({
  size = 24,
  name,
  color,
  onPress,
  style = {
    margin: 0,
    padding: 0,
  },
}: PressableIconProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Ionicons name={name} size={size} color={color} style={style} />
    </TouchableOpacity>
  );
}
