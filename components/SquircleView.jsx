import React from "react";
import { View } from "react-native";

const SquircleView = React.forwardRef(({ style, children, ...props }, ref) => {
    return (
        <View
            ref={ref}
            style={[{ borderCurve: "continuous" }, style]}
            {...props}
        >
            {children}
        </View>
    );
});

SquircleView.displayName = 'SquircleView';

export default SquircleView;