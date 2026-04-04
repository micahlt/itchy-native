import { FlatList, KeyboardAvoidingView, Platform, View } from "react-native";
import { useMemo } from "react";
import { useTheme } from "../utils/theme";
import Comment from "./Comment";
import CommentEditor from "./CommentEditor";
import CommentOptionSheet from "./CommentOptionSheet";
import MutedDialog from "./MutedDialog";
import { getLiquidPlusPadding } from "../utils/platformUtils";
import Animated, { FadeInDown } from "react-native-reanimated";
import { impactAsync, ImpactFeedbackStyle } from "expo-haptics";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FULL_SCREEN_MODAL_CARD_TOP_OFFSET = Platform.select({
  ios: 10, // This value is a constant for all types of iOS devices
  default: 0,
});

const useFullScreenModalHeaderHeight = () => {
  const { top: topInset } = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  return topInset + FULL_SCREEN_MODAL_CARD_TOP_OFFSET + headerHeight;
};

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
  commentsOpen,
  scrollRef,
}) {
  const { colors } = useTheme();

  const isAdmin = useMemo(() => {
    if (!user || !comments || !comments.length) return false;
    if (user.id == commentOptionContext.host) return true;
    if (user.username === commentOptionContext.owner) return true;
    return false;
  }, [user, comments, commentOptionContext]);

  const keyboardVerticalOffset = useFullScreenModalHeaderHeight();

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
            impactAsync(ImpactFeedbackStyle.Medium);
            setCommentOptionsObj(c);
          }}
          isStudioComment={commentOptionContext.type === "studio"}
        />
      </Animated.View>
    );
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          keyboardVerticalOffset={keyboardVerticalOffset}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <FlatList
            ref={scrollRef}
            contentContainerStyle={{
              padding: 10,
              paddingTop: getLiquidPlusPadding(10, 70),
              paddingBottom: 100,
              width: "100%",
              maxWidth: 500,
              margin: "auto",
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
              commentsOpen={commentsOpen}
              isPageAdmin={isAdmin}
            />
          )}
          <MutedDialog
            visible={showMutedDialog}
            muteExpiresAt={muteExpiresAt}
            onClose={() => setShowMutedDialog(false)}
          />
        </KeyboardAvoidingView>
      </View>
      <CommentOptionSheet
        comment={commentOptionsObj}
        setComment={setCommentOptionsObj}
        context={commentOptionContext}
        isPageAdmin={isAdmin}
        onDeleteCommentID={onDeleteComment}
      />
    </>
  );
}
