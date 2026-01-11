import React from "react";
import { Platform, StyleProp, View, ViewProps, ViewStyle } from "react-native";
import RNSquircleView from "react-native-fast-squircle";

type SquircleViewProps = ViewProps & {
  style: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const SquircleView = React.forwardRef<View, SquircleViewProps>(
  ({ style, children, ...props }, ref) => {
    if (Platform.OS == "ios") {
      return (
        <View
          ref={ref}
          style={[{ borderCurve: "continuous" }, style]}
          {...props}
        >
          {children}
        </View>
      );
    } else {
      return (
        <RNSquircleView ref={ref} style={style} {...props}>
          {children}
        </RNSquircleView>
      );
    }
  }
);

SquircleView.displayName = "SquircleView";

export default SquircleView;
