import { View, TextInput, TouchableOpacity, useWindowDimensions } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { useState } from "react"
import { useTheme } from "../utils/theme";

export default function CommentEditor({ onSubmit, replyID, }) {
    const [content, setContent] = useState();
    const { width } = useWindowDimensions();
    const { colors } = useTheme();

    return <View style={{ padding: 15, backgroundColor: colors.backgroundTertiary, flexDirection: "row" }}>
        <TextInput placeholder="Add a comment..." style={{ width: width - 66 }} multiline={true} value={content} onChangeText={setContent} />
        <TouchableOpacity onPress={() => {
            onSubmit(content);
            setContent("");
        }} style={{ width: 24, flexGrow: 1, marginLeft: 10 }}>
            <MaterialIcons name="send" size={24} color={colors.accent} />
        </TouchableOpacity>
    </View>
};