import { Text, View, Pressable } from "react-native";
import { useTheme } from "../utils/theme";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function SignInPrompt() {
    const { colors } = useTheme();
    const router = useRouter();

    return <View style={{ backgroundColor: colors.accent, padding: 10, borderRadius: 10, marginHorizontal: 20, marginTop: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 4, gap: 10, marginBottom: 4 }}>
            <MaterialIcons name='person' size={24} color="white" />
            <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", flexGrow: 1 }}>Sign in now!</Text>
        </View>
        <Text style={{ fontSize: 14, color: "white", marginBottom: 10 }}>Sign in to access features like messages, your What's Happening feed, commenting, loving and favoriting projects, and more!</Text>
        <View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: colors.text, elevation: 5, marginRight: "auto", }}>
            <Pressable onPress={() => router.push("login")} style={{ paddingVertical: 5, paddingHorizontal: 10 }} android_ripple={{ color: colors.accentTransparent, borderless: false, foreground: true }}>
                <Text style={{ color: colors.accent, fontWeight: 'bold', fontSize: 12 }}>LOG IN</Text>
            </Pressable>
        </View>
    </View>;
}