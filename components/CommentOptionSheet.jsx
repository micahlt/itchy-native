import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import ItchyText from "./ItchyText";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../utils/theme";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import Comment from "./Comment";
import Pressable from "./Pressable";
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

export default function CommentOptionSheet({
  comment,
  context,
  setComment = () => {},
  onDeleteCommentID = () => {},
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

  const canDelete = useMemo(() => {
    if (!user || !comment) return false;
    if (user.id == context.host) return true;
    if (user.username === context.owner) return true;
    return false;
  }, [user, comment, context, csrf]);

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
      }}
      backdropMaskColor="#000000aa"
      onClose={() => setComment(undefined)}
      enableDynamicSizing={true}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: colors.backgroundSecondary }}
      backdropComponent={renderBackdrop}
      bottomInset={insets.bottom}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <BottomSheetView
        onLayout={onViewLayout}
        style={{
          paddingTop: getLiquidPlusPadding(0, 0),
          paddingBottom: 10,
          backgroundColor: colors.backgroundSecondary,
        }}
      >
        <ItchyText
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 10,
            paddingHorizontal: 15,
          }}
        >
          Comment
        </ItchyText>
        <View style={{ paddingHorizontal: 5 }}>
          <Comment
            comment={comment}
            showReplies={false}
            isReply={false}
            fullWidth={true}
          />
        </View>
        {canDelete && (
          <Pressable
            android_ripple={{
              color: "#ffffff22",
              borderless: false,
              foreground: true,
            }}
            onPress={deleteComment}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderColor: colors.backgroundTertiary,
              borderBottomWidth: 0.5,
              borderTopWidth: 0.5,
            }}
          >
            <MaterialIcons name="delete" color={colors.accent} size={22} />
            <ItchyText style={{ color: colors.accent, fontSize: 16 }}>
              Delete
            </ItchyText>
          </Pressable>
        )}
        <Pressable
          android_ripple={{
            color: "#ffffff22",
            borderless: false,
            foreground: true,
          }}
          onPress={openOnScratch}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderColor: colors.backgroundTertiary,
            borderBottomWidth: 0.5,
            borderTopWidth: 0.5,
          }}
        >
          <MaterialIcons name="exit-to-app" color={colors.accent} size={22} />
          <ItchyText style={{ color: colors.accent, fontSize: 16 }}>
            Open on Scratch
          </ItchyText>
        </Pressable>
        <Pressable
          android_ripple={{
            color: "#ffffff22",
            borderless: false,
            foreground: true,
          }}
          onPress={openOnScratch}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderColor: colors.backgroundTertiary,
            borderBottomWidth: 0.5,
            borderTopWidth: 0.5,
          }}
        >
          <MaterialIcons name="flag" color={colors.accent} size={22} />
          <ItchyText style={{ color: colors.accent, fontSize: 16 }}>
            Report comment
          </ItchyText>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}
