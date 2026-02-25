import { Platform, StyleProp, View, ViewStyle } from "react-native";
import { useTheme } from "../utils/theme";
import ItchyText from "./ItchyText";
// @ts-ignore
import Pressable from "./Pressable";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { GlassView } from "expo-glass-effect";

export default function TexturedButton({
  style = {},
  onPress = () => {},
  textStyle = {},
  icon = false,
  iconSide = "right",
  size = 12,
  provider = "native",
  children,
}: {
  style?: StyleProp<ViewStyle>;
  onPress?: Function;
  textStyle?: Object;
  icon?: false | keyof typeof Ionicons.glyphMap;
  iconSide?: "right" | "left";
  size?: number;
  provider?: "native" | "gesture-handler";
  children?: React.ReactNode;
}) {
  const { colors, dimensions, isDark } = useTheme();
  return (
    <GlassView
      isInteractive={true}
      style={
        Platform.OS == "ios"
          ? {
              borderRadius: 100,
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.backgroundSecondary,
              borderWidth: 0,
              borderTopWidth: 0,
              ...(typeof style == "object" ? style : {}),
            }
          : {
              borderRadius: 100,
              overflow: "hidden",
              outlineColor: colors.outline,
              outlineWidth: dimensions.outlineWidth,
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.backgroundSecondary,
              borderWidth: 0,
              borderTopWidth: 0,
              borderTopColor: isDark
                ? colors.backgroundTertiary
                : colors.highlight,
              boxShadow: `0px 2px 4px 0px #ffffff22 inset, 0px 2px 0px 0px ${colors.topLight} inset`,
              ...(typeof style == "object" ? style : {}),
            }
      }
    >
      <Pressable
        style={{
          paddingHorizontal: size,
          paddingBottom: size / 1.5,
          paddingTop: size / 1.5,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={onPress}
        android_ripple={{
          color: colors.ripple,
          borderless: true,
          foreground: true,
        }}
        provider={provider}
      >
        {icon && iconSide == "left" ? (
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            color={colors.text}
            size={size * 1.25}
            style={{
              marginRight: children == null ? 0 : size * 0.5,
              color: colors.text,
            }}
          />
        ) : (
          <></>
        )}
        <ItchyText
          style={{
            color: colors.text,
            fontSize: size * 1.25,
            fontWeight: "bold",
            textAlign: "center",
            ...textStyle,
          }}
        >
          {children}
        </ItchyText>
        {icon && iconSide == "right" ? (
          <Ionicons
            name={icon}
            color={colors.text}
            size={size * 1.25}
            style={{ marginLeft: children == null ? 0 : size * 0.5 }}
          />
        ) : (
          <></>
        )}
      </Pressable>
    </GlassView>
  );
}
