import React from "react";
import { StyleProp, View, ViewProps, ViewStyle } from "react-native";

type SquircleViewProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const SquircleView = React.forwardRef<View, SquircleViewProps>(
  ({ style, children, ...props }, ref) => {
    return (
      <View ref={ref} style={[{ borderCurve: "continuous" }, style]} {...props}>
        {children}
      </View>
    );
  }
);

SquircleView.displayName = "SquircleView";

export default SquircleView;
