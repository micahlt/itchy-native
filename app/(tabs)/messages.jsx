import { FlatList, RefreshControl, Text } from "react-native";
import { useTheme } from "../../utils/theme";
import { useMMKVString } from "react-native-mmkv";
import { useEffect, useState } from "react";
import ScratchAPIWrapper from "../../utils/api-wrapper";
import Message from "../../components/Message";
import { SafeAreaView } from "react-native-safe-area-context";
import SignInPrompt from "../../components/SignInPrompt";

export default function Messages() {
    const { colors, isDark } = useTheme();
    const [username] = useMMKVString("username");
    const [token] = useMMKVString("token");
    const [messages, setMessages] = useState([]);
    const [offset, setOffset] = useState(0);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!username || !token) return;
        setOffset(0);
        loadMessages();
    }, [username, token]);

    const loadMessages = () => {
        setLoading(true);
        ScratchAPIWrapper.messages.getMessages(username, token, offset, "", 30).then((d) => {
            if (offset === 0) {
                setMessages(d);
            } else {
                setMessages(messages.concat(d));
            }
            setLoading(false);
        });
    }

    useEffect(() => {
        loadMessages();
    }, [offset])

    const renderMessage = (m) => {
        return <Message message={m.item} />
    };

    if (!username || !token) {
        return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 24, padding: 10, marginBottom: 10 }}>Messages</Text>
            <SignInPrompt />
        </SafeAreaView>
    }

    return <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <FlatList
            data={messages}
            style={{ backgroundColor: colors.background }}
            renderItem={renderMessage}
            keyExtractor={m => m.id}
            onRefresh={() => {
                setOffset(0);
                loadMessages();
            }}
            refreshing={loading}
            refreshControl={<RefreshControl refreshing={loading} tintColor={"white"} progressBackgroundColor={colors.accent} colors={isDark ? ["black"] : ["white"]} />}
            ListHeaderComponent={<Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 24, padding: 10, marginBottom: 20 }}>Messages</Text>}
            onEndReachedThreshold={1.2}
            onEndReached={() => {
                if (loading) return;
                setOffset(messages.length);
            }} />
    </SafeAreaView>
}