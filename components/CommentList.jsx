import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    View,
    Vibration,
} from "react-native";
import { useTheme } from "../utils/theme";
import Comment from "./Comment";
import CommentEditor from "./CommentEditor";
import CommentOptionSheet from "./CommentOptionSheet";
import MutedDialog from "./MutedDialog";
import { getLiquidPlusPadding } from "../utils/platformUtils";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function CommentList({
    comments,
    loading,
    onEndReached,
    user,
    reply,
    setReply,
    isPostingComment,
    onPostComment,
    commentOptionsObj,
    setCommentOptionsObj,
    commentOptionContext,
    onDeleteComment,
    showMutedDialog,
    setShowMutedDialog,
    muteExpiresAt,
    selectedCommentId,
    scrollRef,
}) {
    const { colors } = useTheme();

    const renderComment = ({ item, index }) => {
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
                collapsable={false}
            >
                <Comment
                    comment={item}
                    selected={selectedCommentId}
                    onPress={setReply}
                    onLongPress={(c) => {
                        setCommentOptionsObj(c);
                        Vibration.vibrate(5);
                    }}
                />
            </Animated.View>
        );
    }; return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <FlatList
                    ref={scrollRef}
                    contentContainerStyle={{
                        padding: 10,
                        paddingTop: getLiquidPlusPadding(10, 70),
                        paddingBottom: 100,
                    }}
                    style={{ flex: 1 }}
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={(item) => item.id.toString()}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={1.2}
                    onScrollToIndexFailed={({ index }) => {
                        scrollRef.current?.scrollToOffset({
                            offset: index * 1000,
                            animated: true,
                        });
                        const wait = new Promise((resolve) => setTimeout(resolve, 500));
                        wait.then(() => {
                            scrollRef.current?.scrollToIndex({ index, animated: true });
                        });
                    }}
                />
                {!!user && (
                    <CommentEditor
                        onSubmit={onPostComment}
                        reply={reply}
                        onClearReply={() => setReply(undefined)}
                        loading={isPostingComment}
                    />
                )}
                <CommentOptionSheet
                    comment={commentOptionsObj}
                    setComment={setCommentOptionsObj}
                    context={commentOptionContext}
                    onDeleteCommentID={onDeleteComment}
                />
                <MutedDialog
                    visible={showMutedDialog}
                    muteExpiresAt={muteExpiresAt}
                    onClose={() => setShowMutedDialog(false)}
                />
            </KeyboardAvoidingView>
        </View>
    );
}
