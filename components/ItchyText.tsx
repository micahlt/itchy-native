import React, { useMemo } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
} from "react-native";

type ItchyTextProps = TextProps & {
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  numberOfLines?: number;
};

export default function ItchyText({
  style = {},
  children,
  numberOfLines = undefined,
  ...props
}: ItchyTextProps) {
  const flatStyle = useMemo(() => StyleSheet.flatten(style), [style]);

  const familyFromWeight = useMemo(() => {
    switch (flatStyle?.fontWeight || "regular") {
      case "bold":
        return Platform.select({
          android: "Inter_700Bold",
          ios: "Inter-Bold",
        });
      case "black":
        return Platform.select({
          android: "Inter_900Black",
          ios: "Inter-Black",
        });
      case "regular":
      default:
        return Platform.select({
          android: "Inter_400Regular",
          ios: "Inter-Regular",
        });
    }
  }, [flatStyle]);
  const memoizedComponent = useMemo(() => {
    return (
      <Text
        style={{
          fontFamily: familyFromWeight,
          letterSpacing: -0.5,
          ...flatStyle,
          fontWeight: "normal",
        }}
        numberOfLines={numberOfLines}
        {...props}
      >
        {children}
      </Text>
    );
  }, [flatStyle, children, numberOfLines, familyFromWeight, props]);
  return memoizedComponent;
}
