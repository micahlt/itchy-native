import { View, Text } from "react-native"
import Chip from "./Chip"
import { decode } from "html-entities"
import { useTheme } from "../utils/theme"
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import Card from "./Card";

export default function Comment({ comment, isReply = false, isLastReply = false }) {
    const { colors } = useTheme();
    const router = useRouter();
    const hasReplies = useMemo(() => comment.replies && comment.replies.length > 0, [comment]);
    const openAuthor = useCallback(() => {
        router.push(`/users/${comment.username}`);
    }, [comment])

    return (
        <View style={{ borderLeftColor: colors.backgroundTertiary, borderLeftWidth: isReply ? 3 : 0, paddingBottom: isLastReply ? 0 : 10, marginLeft: isReply ? 8 : 0 }}>
            <Card style={{ backgroundColor: colors.backgroundSecondary, padding: 15, borderRadius: 10, marginLeft: isReply ? 10 : 0, marginBottom: hasReplies ? 10 : 0 }}>
                <View style={{ flexDirection: "row", alignItems: "top", justifyContent: "space-between" }}>
                    <Chip.Image text={comment.username} imageURL={comment.avatarURL} mode="outlined" style={{ marginRight: "auto", marginBottom: 8 }} textStyle={{ fontWeight: "bold" }} onPress={openAuthor} />
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{new Date().toLocaleString("en-US", {
                        timeStyle: "short",
                        dateStyle: "long"
                    })}</Text>
                </View>
                <Text style={{ color: colors.text }}>{decode(comment.content)}</Text>
            </Card>
            {comment.replies && comment.replies.map((reply, i) => <Comment comment={reply} isReply={true} isLastReply={(i + 1) == comment.replies.length} />)}
        </View>
    );
}