import { Text, View } from "react-native";
import { useTheme } from "../../utils/theme";
import { useMMKVString } from "react-native-mmkv";
import { useEffect } from "react";
import ScratchAPIWrapper from "../../utils/api-wrapper";

export default function Messages() {
    const { colors } = useTheme();
    const [username] = useMMKVString("username");
    const [token] = useMMKVString("token");

    useEffect(() => {
        if (!username || !token) return;
        ScratchAPIWrapper.messages.getMessages(username).then((d) => {
            setMessageCount(d);
        });
    })

    return <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 24, padding: 10 }}>Messages</Text>
    </View>
}