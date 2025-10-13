import { Image } from "expo-image";
import { View } from "react-native";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import tinycolor from "tinycolor2";
import { useCallback, useMemo } from "react";
import ItchyText from "./ItchyText";

const ImageChip = ({
  imageURL = "",
  text = "",
  onPress = () => {},
  textStyle,
  mode = "filled",
  style = {},
  provider = "native",
}) => {
  const { colors } = useTheme();
  const onPressFn = useCallback(() => {
    onPress();
  }, [onPress]);
  return (
    <View
      style={{
        marginRight: "auto",
        flexDirection: "row",
        borderRadius: 100,
        height: 35,
        borderColor: mode == "outlined" ? colors.chipColor : "transparent",
        borderWidth: mode == "outlined" ? 1.5 : 0,
        ...style,
      }}
    >
      <Pressable
        provider={provider}
        style={{
          alignItems: "center",
          gap: 5,
          paddingRight: 12,
          borderRadius: 100,
          height: 35,
          marginRight: "auto",
        }}
        android_ripple={{ borderless: false }}
        onPress={onPressFn}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 35,
            gap: 5,
          }}
        >
          <Image
            source={{ uri: imageURL }}
            style={{
              width: 32,
              height: 32,
              marginTop: -3,
              aspectRatio: 1,
              borderRadius: 100,
              borderWidth: 0,
              borderColor: "red",
              backgroundColor: "#ffffff",
            }}
          />
          <ItchyText
            style={{
              color: colors.chipColor,
              marginLeft: 4,
              ...textStyle,
              marginTop: -4,
            }}
          >
            {text}
          </ItchyText>
        </View>
      </Pressable>
    </View>
  );
};

const IconChip = ({
  icon,
  text = "",
  onPress = () => {},
  color = "#ff656d",
  mode = "outlined",
  textStyle = {},
  style = {},
}) => {
  const { colors, isDark } = useTheme();
  const bg = useMemo(() => {
    if (isDark) {
      return tinycolor(color).darken(45).toHexString();
    } else {
      return tinycolor(color).setAlpha(0.2).toRgbString();
    }
  }, [color, isDark]);
  const onPressFn = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <View
      style={{
        borderRadius: 100,
        height: 35,
        overflow: "hidden",
        flexDirection: "row",
        ...style,
      }}
    >
      <Pressable
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          backgroundColor: mode == "filled" ? bg : "transparent",
          paddingRight: 12,
          borderColor: color,
          borderWidth: 1.5,
          borderRadius: 100,
          height: 32,
        }}
        android_ripple={{
          color: colors.ripple,
          foreground: true,
          borderless: false,
        }}
        onPress={onPressFn}
      >
        <Ionicons
          name={icon}
          size={20}
          color={color}
          style={{ paddingLeft: 8 }}
        />
        <ItchyText style={{ color: color, fontWeight: "bold" }}>
          {text}
        </ItchyText>
      </Pressable>
    </View>
  );
};

const Chip = {
  Image: ImageChip,
  Icon: IconChip,
};

export default Chip;
