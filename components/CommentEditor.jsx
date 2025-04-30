import { View, TextInput, TouchableOpacity, useWindowDimensions, Text } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "../utils/theme";

export default function CommentEditor({ onSubmit, reply, onClearReply }) {
    const [content, setContent] = useState();
    const { width } = useWindowDimensions();
    const { colors } = useTheme();
    const inputRef = useRef(null);

    useEffect(() => {
        if (!!reply && !!inputRef.current) {
            inputRef.current.focus();
        }
    }, [reply])

    return <View>
        {!!reply && <View style={{ paddingHorizontal: 15, paddingTop: 15, marginBottom: -3, zIndex: 1, backgroundColor: colors.backgroundTertiary, flexDirection: "row", justifyContent: "flex-start", gap: 8, alignItems: "center" }}>
            <Text style={{ color: colors.text, fontSize: 12, lineHeight: 12 }}>Replying to <Text style={{ fontWeight: "bold" }}>{reply.author.username}</Text></Text>
            <TouchableOpacity onPress={onClearReply} style={{ marginTop: -2 }}>
                <MaterialIcons name="cancel" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>}
        <View style={{ padding: 15, backgroundColor: colors.backgroundTertiary, flexDirection: "row" }}>
            <TextInput placeholder="Add a comment..." style={{ width: width - 66, color: colors.text }} multiline={true} value={content} onChangeText={setContent} ref={inputRef} />
            <TouchableOpacity onPress={() => {
                onSubmit(content);
                setContent("");
            }} style={{ width: 24, flexGrow: 1, marginLeft: 10 }}>
                <MaterialIcons name="send" size={24} color={colors.accent} />
            </TouchableOpacity>
        </View>
    </View>
};