import { useMemo } from "react";
import { Platform, Text } from "react-native";

export default function ItchyText({ style = {}, children, numberOfLines = undefined }) {
    const familyFromWeight = useMemo(() => {
        switch (style.fontWeight || "regular") {
            case "bold":
                return Platform.select({
                    android: 'Inter_700Bold',
                    ios: 'Inter-Bold',
                })
            case "black":
                return Platform.select({
                    android: 'Inter_900Black',
                    ios: 'Inter-Black',
                })
            case "regular":
            default:
                return Platform.select({
                    android: 'Inter_400Regular',
                    ios: 'Inter-Regular',
                })
        }
    }, [style.fontWeight]);
    const memoizedComponent = useMemo(() => {
        return <Text style={{
            fontFamily: familyFromWeight,
            letterSpacing: -0.5,
            ...style,
            fontWeight: "normal"
        }} numberOfLines={numberOfLines}>{children}</Text>
    }, [style, children, numberOfLines]);
    return memoizedComponent;
}

ItchyText.whyDidYouRender = true;