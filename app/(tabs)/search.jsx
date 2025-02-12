import { TextInput } from "react-native";
import { useTheme } from "../../utils/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Search() {
    const { colors, isDark } = useTheme();

    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <TextInput placeholder="Search" inputMode="search" enterKeyHint="search" style={{
            backgroundColor: colors.backgroundSecondary, color: colors.text, padding: 15, margin: 10,
            fontSize: 18, borderRadius: 10
        }} placeholderTextColor={colors.textSecondary} inlineImageLeft={isDark ? "search_24_white" : "search_24_black"} inlineImagePadding={24} />
    </SafeAreaView>
}