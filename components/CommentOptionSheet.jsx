import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import ItchyText from "./ItchyText";
import { useTheme } from "../utils/theme";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import Comment from "./Comment";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import linkWithFallback from "../utils/linkWithFallback";
import ScratchAPIWrapper from "../utils/api-wrapper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getLiquidPlusPadding } from "../utils/platformUtils";
import TexturedButton from "./TexturedButton";

export default function CommentOptionSheet({
  comment,
  context,
  setComment = () => { },
  onDeleteCommentID = () => { },
  isPageAdmin = false
}) {
  const { colors } = useTheme();
  const [user] = useMMKVObject("user");
  const [csrf] = useMMKVString("csrfToken");
  const sheetRef = useRef(null);
  const [sheetHeight, setSheetHeight] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!!comment) {
      sheetRef.current?.expand();
      return;
    } else {
      sheetRef.current?.close();
    }
  }, [comment]);

  const onViewLayout = (e) => {
    setSheetHeight(e.nativeEvent.layout.height + insets.bottom);
  };

  const openOnScratch = useCallback(() => {
    switch (context.type) {
      case "user":
        linkWithFallback(
          `https://scratch.mit.edu/users/${context.owner}#${comment.id}`,
          colors.accent
        );
        break;
      case "project":
        linkWithFallback(
          `https://scratch.mit.edu/projects/${context.projectID}#comments-${comment.id}`,
          colors.accent
        );
        break;
      case "studio":
        linkWithFallback(
          `https://scratch.mit.edu/studios/${context.studioID}/comments#comments-${comment.id}`,
          colors.accent
        );
        break;
    }
  }, [comment]);

  const deleteComment = useCallback(() => {
    switch (context.type) {
      case "user":
        ScratchAPIWrapper.user
          .deleteComment(
            context.owner,
            comment.id.split("comments-")[1],
            csrf,
            user.token
          )
          .then((res) => {
            onDeleteCommentID(comment);
            setComment(undefined);
          })
          .catch(console.error);
        break;
      case "project":
        ScratchAPIWrapper.project
          .deleteComment(context.projectID, comment.id, csrf, user.token)
          .then(() => {
            onDeleteCommentID(comment);
            setComment(undefined);
          })
          .catch(console.error);
        break;
      case "studio":
        ScratchAPIWrapper.studio
          .deleteComment(context.studioID, comment.id, csrf, user.token)
          .then((r) => {
            onDeleteCommentID(comment);
            setComment(undefined);
          })
          .catch(console.error);
        break;
    }
  }, [comment, csrf, user]);

  const renderBackdrop = useCallback(
    (props) => {
      const opacity = useSharedValue(0);
      const [shouldShow, setShouldShow] = useState(true);

      const animatedStyle = useAnimatedStyle(() => ({
        opacity: withTiming(opacity.value, { duration: 200 }),
      }));

      useEffect(() => {
        opacity.value = shouldShow ? 0.6 : 0;
      }, [shouldShow]);

      const containerStyle = useMemo(
        () => ({
          backgroundColor: `${colors.background}`, // Semi-transparent background
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }),
        [colors.background]
      );

      return (
        <Animated.View
          style={[containerStyle, animatedStyle]}
          onTouchEnd={() => {
            setShouldShow(false);
            sheetRef.current?.close();
          }}
        ></Animated.View>
      );
    },
    [sheetRef]
  );

  if (!comment) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      style={{
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        shadowColor: "#000",
        zIndex: 10000
      }}
      backdropMaskColor="#000000aa"
      onClose={() => setComment(undefined)}
      enableDynamicSizing={true}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: colors.backgroundSecondary }}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <BottomSheetView
        onLayout={onViewLayout}
        style={{
          paddingTop: getLiquidPlusPadding(0, 0),
          paddingBottom: 10 + insets.bottom,
          paddingHorizontal: 20,
          backgroundColor: colors.backgroundSecondary,
        }}
      >
        <ItchyText
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 15,
          }}
        >
          Comment
        </ItchyText>
        <View style={{ paddingHorizontal: 0, marginBottom: 5 }}>
          <Comment
            comment={comment}
            showReplies={false}
            isReply={false}
            fullWidth={true}
          />
        </View>
        {isPageAdmin && (
          <TexturedButton
            onPress={deleteComment}
            style={{ marginBottom: 10 }}
            icon="trash"
            iconSide="left"
          >
            Delete
          </TexturedButton>
        )}
        <TexturedButton
          onPress={openOnScratch}
          style={{ marginBottom: 10 }}
          icon="open"
          iconSide="left"
        >
          Open on Scratch
        </TexturedButton>
        <TexturedButton
          onPress={openOnScratch}
          style={{ marginBottom: 10 }}
          icon="flag"
          iconSide="left"
        >
          Report comment
        </TexturedButton>
      </BottomSheetView>
    </BottomSheet>
  );
}
