import {
  View,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  Keyboard,
  Platform,
  ActivityIndicator,
  TextInput as RNTextInput,
} from "react-native";
import ItchyText from "./ItchyText";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import SquircleView from "./SquircleView";
import { useFocusEffect } from "expo-router";
import { Comment } from "../utils/api-wrapper/types/project";
// @ts-expect-error
import Pressable from "./Pressable";
import APIUser from "../utils/api-wrapper/user";
import { User } from "../utils/api-wrapper/types/user";
import { useMMKVNumber, useMMKVObject, useMMKVString } from "react-native-mmkv";

type CommentEditorProps = {
  onSubmit: (...args: any[]) => any;
  reply: Comment;
  onClearReply: () => any;
  loading: boolean;
  commentsOpen: boolean;
  isPageAdmin?: boolean;
};

export default function CommentEditor({
  onSubmit,
  reply,
  onClearReply,
  loading,
  commentsOpen = true,
  isPageAdmin = false,
}: CommentEditorProps) {
  const [content, setContent] = useState<string>("");
  const { width } = useWindowDimensions();
  const { colors, dimensions } = useTheme();
  const inputRef = useRef<RNTextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const bottomAnim = useSharedValue(Platform.OS === "android" ? 0 : -3);
  const [isMounted, setIsMounted] = useState(false);
  const [localCommentsOpen, setLocalCommentsOpen] =
    useState<boolean>(commentsOpen);
  const [user] = useMMKVObject<User>("user");
  const [csrf] = useMMKVString("csrfToken");
  const [token] = useMMKVString("token");
  const commentEditor = useRef<View>(null);
  const [commentsHeight, setCommentsHeight] = useMMKVNumber("commentsHeight");

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "android") {
        bottomAnim.value = -3;
      }
    }, [])
  );

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height);
      if (Platform.OS == "ios") {
        bottomAnim.value = withTiming(height + 5);
      } else {
        bottomAnim.value = withTiming(height + 10);
      }
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
      if (Platform.OS === "android") {
        bottomAnim.value = withTiming(0);
      } else {
        bottomAnim.value = withTiming(0);
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!!reply && !!inputRef.current) {
      inputRef?.current?.focus();
    }
  }, [reply]);

  useEffect(() => {
    commentEditor?.current?.measure((x, y, width, height) => {
      setCommentsHeight(height);
    });
  }, [content, reply]);

  const commentTooLong = useMemo(() => {
    return content.length > 500;
  }, [content]);

  const onPressSubmit = () => {
    if (loading) return;
    if (!content?.trim()) return;

    onSubmit(content.trim());
    setContent("");
    inputRef.current?.blur();
  };

  const toggleComments = () => {
    if (!!user && !!csrf && !!token) {
      APIUser.toggleCommentsOpen(user?.username, csrf, token).then((ok) => {
        if (ok) {
          setLocalCommentsOpen(!localCommentsOpen);
        }
      });
    }
  };

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: bottomAnim,
        paddingBottom: insets.bottom,
      }}
    >
      {isPageAdmin ? (
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.backgroundSecondary,
            marginBottom: 10,
            marginLeft: "auto",
            borderRadius: dimensions.largeRadius,
            boxShadow:
              "0px -2px 8px rgba(0,94,185,0.1),0px 5px 6px rgba(0,0,0,0.2), 0px 4px 5px 0px #ffffff15 inset, 0px 3px 0px 0px #FFFFFF11 inset",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <Pressable
            onPress={toggleComments}
            android_ripple={{
              color: colors.ripple,
              borderless: true,
              foreground: true,
            }}
            style={{
              flexDirection: "row",
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}
          >
            <Ionicons
              size={18}
              style={{ marginRight: 8 }}
              color={colors.accent}
              name={
                localCommentsOpen
                  ? "checkmark-circle"
                  : "checkmark-circle-outline"
              }
            />
            <ItchyText style={{ color: colors.accent, fontSize: 14 }}>
              {localCommentsOpen ? "Disable" : "Enable"} comments
            </ItchyText>
          </Pressable>
        </View>
      ) : (
        <></>
      )}
      <SquircleView
        style={{
          borderRadius: dimensions.largeRadius,
          backgroundColor: colors.backgroundSecondary,
          paddingTop: 5,
          width: width - 15,
          marginLeft: 7.5,
          boxShadow:
            "0px -2px 16px rgba(0,94,185,0.15),0px 40px 25px rgba(0,0,0,0.5), 0px 4px 5px 0px #ffffff15 inset, 0px 3px 0px 0px #FFFFFF11 inset",
        }}
        ref={commentEditor}
      >
        {!!reply && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 15,
              marginBottom: -10,
              zIndex: 1,
              flexDirection: "row",
              justifyContent: "flex-start",
              gap: 8,
              alignItems: "center",
            }}
          >
            <ItchyText
              style={{ color: colors.text, fontSize: 12, lineHeight: 14 }}
            >
              Replying to{" "}
              <ItchyText style={{ fontWeight: "bold" }}>
                {reply.author.username}
              </ItchyText>
            </ItchyText>
            <TouchableOpacity onPress={onClearReply} style={{ marginTop: -2 }}>
              <MaterialIcons
                name="cancel"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}
        {localCommentsOpen ? (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 15,
              marginBottom: -5,
              zIndex: 1,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <ItchyText
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                lineHeight: 14,
              }}
            >
              {500 - content.length > -1 ? 500 - content.length : 0} characters
              remaining
            </ItchyText>
          </View>
        ) : (
          <></>
        )}
        <View
          style={{
            paddingHorizontal: 15,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TextInput
            placeholder={
              localCommentsOpen ? "Add a comment..." : "Comments are disabled."
            }
            placeholderTextColor={colors.textSecondary}
            style={{
              width: width - 80,
              color: colors.text,
              marginBottom: Platform.OS == "ios" ? 10 : 5,
              minHeight: 20,
              maxHeight: 100,
              textAlignVertical: "top",
              fontFamily: Platform.select({
                android: "Inter_400Regular",
                ios: "Inter-Regular",
              }),
              letterSpacing: -0.4,
              borderColor: "transparent",
              borderWidth: 1,
            }}
            multiline={true}
            value={content}
            onChangeText={setContent}
            ref={inputRef}
            readOnly={!localCommentsOpen}
          />
          <TouchableOpacity
            onPress={onPressSubmit}
            disabled={loading || !localCommentsOpen || commentTooLong}
            style={{
              width: 24,
              flexGrow: 1,
              marginLeft: 10,
              marginRight: 20,
              marginBottom: 8,
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <MaterialIcons
                name="send"
                size={24}
                color={
                  localCommentsOpen && !commentTooLong
                    ? colors.accent
                    : colors.outline
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </SquircleView>
    </Animated.View>
  );
}
