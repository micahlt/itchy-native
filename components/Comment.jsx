import { View, Text, Pressable } from "react-native"
import Chip from "./Chip"
import { decode } from "html-entities"
import { useTheme } from "../utils/theme"
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "./Card";
import ScratchAPIWrapper from "../utils/api-wrapper";
import timeago from "time-ago";
import LinkifiedText from "../utils/regex/LinkifiedText";

export default function Comment({ comment, isReply = false, isLastReply = false, parentMetadata = {}, selected = 0, partOfSelection = false, onPress = () => { } }) {
    const { colors } = useTheme();
    const router = useRouter();
    const [replies, setReplies] = useState([]);

    const openAuthor = useCallback(() => {
        router.push(`/users/${comment.author.username}`);
    }, [comment])

    const timestamp = useMemo(() => timeago.ago(new Date(comment.datetime_created)), [comment]);
    const content = useMemo(() => decode(comment.content), [comment]);
    const isSelected = useMemo(() => selected == comment.id, [selected, comment]);
    const partOfSelected = useMemo(() => {
        if (replies.findIndex((r) => r.id == selected) !== -1) {
            return true;
        }
    }, [replies, selected]);

    const replyList = useMemo(() => replies.map((reply, i) => <Comment comment={reply} isReply={true} key={reply.id} selected={selected} partOfSelection={partOfSelected} isLastReply={replies.length - 1 == i} onPress={() => onPress(reply)} />), [replies, partOfSelected, selected]);

    useEffect(() => {
        if (!!comment.includesReplies) {
            if (!comment.replies) return;
            if (comment.replies.length == 0) return;
            setReplies(comment.replies);
        } else if (!isReply) {
            ScratchAPIWrapper.project.getCommentReplies(parentMetadata.project, parentMetadata.author, comment.id).then((d) => {
                setReplies(d);
            }).catch(console.error);
        }
    }, [comment]);

    const onPressHandler = useCallback(() => {
        onPress(comment);
    }, [comment]);

    return (
        <>
            <View style={{ borderLeftColor: (isSelected || partOfSelection) ? colors.accent : colors.backgroundTertiary, borderLeftWidth: isReply ? 3 : 0, marginBottom: isLastReply ? 0 : 10, marginLeft: isReply ? 8 : 0 }
            }>
                <Card style={{ backgroundColor: colors.backgroundSecondary, padding: 15, borderRadius: 10, marginLeft: isReply ? 10 : 0, marginBottom: replies.length > 0 ? 10 : 0, borderColor: colors.accent, borderWidth: isSelected ? 2 : 0 }} onPress={onPressHandler}>
                    <View style={{ flexDirection: "row", alignItems: "top", justifyContent: "space-between" }}>
                        <Chip.Image text={comment.author.username} imageURL={comment.author.image} mode="outlined" style={{ marginRight: "auto", marginBottom: 8 }} textStyle={{ fontWeight: "bold" }} onPress={openAuthor} />
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{timestamp}</Text>
                    </View>
                    <LinkifiedText style={{ color: colors.text, fontSize: 14 }} text={content} />
                </Card>
                {!!replies.length > 0 && replyList}
            </View>
        </>
    );
}