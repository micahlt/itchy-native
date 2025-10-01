import { View } from "react-native";
import ItchyText from "./ItchyText";
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import SquircleView from "react-native-fast-squircle";
import TexturedButton from "./TexturedButton";

export default function SignInPrompt() {
    const { colors } = useTheme();
    const router = useRouter();

    return <SquircleView cornerSmoothing={0.6} style={{ backgroundColor: colors.accent, padding: 10, borderRadius: 20, marginHorizontal: 20, marginTop: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingLeft: 4, gap: 10, marginBottom: 4 }}>
            <MaterialIcons name='person' size={24} color="white" />
            <ItchyText style={{ color: "white", fontSize: 20, flexGrow: 1, fontWeight: "bold" }}>Sign in now!</ItchyText>
        </View>
        <ItchyText style={{ fontSize: 14, color: "white", marginBottom: 10 }}>Sign in to access features like messages, your What's Happening feed, commenting, loving and favoriting projects, controller customizations, and more!</ItchyText>
        <TexturedButton onPress={() => router.push("/login")} style={{ marginRight: 'auto' }}>Log In</TexturedButton>
    </SquircleView>;
}