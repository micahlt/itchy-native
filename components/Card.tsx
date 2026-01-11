// @ts-expect-error
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import SquircleView from "./SquircleView";
import ItchyText from "./ItchyText";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";

type CardProps = {
  onPress?: Function;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressableStyle?: StyleProp<ViewStyle>;
  onLongPress?: Function;
};

export default function Card({
  onPress,
  children,
  style = {},
  pressableStyle = {},
  onLongPress = () => {},
}: CardProps) {
  const { colors, dimensions } = useTheme();
  if (!!onPress) {
    return (
      <SquircleView
        style={{
          backgroundColor: colors.backgroundSecondary,
          overflow: "hidden",
          borderRadius: dimensions.largeRadius,
          elevation: 2,
          ...(style as object),
        }}
      >
        <Pressable
          android_ripple={{
            color: colors.ripple,
            foreground: true,
            borderless: true,
          }}
          onLongPress={onLongPress}
          onPress={onPress}
          style={{ ...(pressableStyle as object) }}
          provider="gesture-handler"
        >
          {children}
        </Pressable>
      </SquircleView>
    );
  } else {
    return (
      <SquircleView
        style={{
          backgroundColor: colors.backgroundSecondary,
          overflow: "hidden",
          borderRadius: dimensions.largeRadius,
          elevation: 2,
          ...(style as object),
        }}
      >
        {children}
      </SquircleView>
    );
  }
}
