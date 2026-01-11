import { View, TouchableOpacity } from "react-native";
import ItchyText from "./ItchyText";
// @ts-expect-error
import Pressable from "./Pressable";
import { Image } from "expo-image";
import { useTheme } from "../utils/theme";
import { useCallback, useMemo } from "react";
import { decode } from "html-entities";
import { useRouter } from "expo-router";
import { useMMKVString } from "react-native-mmkv";
// @ts-expect-error
import timeago from "time-ago";
import linkWithFallback from "../utils/linkWithFallback";
import { ScratchMessage } from "../utils/api-wrapper/types/messages";

interface MessageProps {
  message: ScratchMessage;
}

export default function Message({ message }: MessageProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [username] = useMMKVString("username");

  const headerText = useMemo(() => {
    if (message.type === "admin") {
      return "Message from Scratch Team";
    } else if (message.type === "studioactivity") {
      return message.title;
    } else {
      return message.actor_username;
    }
  }, [message]);

  const bodyText = useMemo(() => {
    switch (message.type) {
      case "followuser":
        return `followed you`;
      case "loveproject":
        return `loved ${message.title}`;
      case "favoriteproject":
        return `favorited ${message.project_title}`;
      case "addcomment":
        return decode(message.comment_fragment).trim();
      case "studioactivity":
        return `new activity in studio`;
      case "remixproject":
        return `remixed ${message.parent_title}`;
      case "curatorinvite":
        return `invited you to curate ${message.title}`;
      case "becomeownerstudio":
        return `promoted you to manager of ${message.gallery_title}`;
      case "becomehoststudio":
        return `made you host of ${message.gallery_title}`;
      case "forumpost":
        return `posted in ${message.topic_title}`;
      case "admin":
        return message.message;
    }
  }, [message]);

  const pfpLink = useMemo(() => {
    if (message.type == "studioactivity") {
      return `https://uploads.scratch.mit.edu/galleries/thumbnails/${message.gallery_id}.png`;
    } else if (message.type == "admin") {
      return `https://uploads.scratch.mit.edu/users/avatars/15883188.png`;
    } else {
      return `https://uploads.scratch.mit.edu/users/avatars/${message.actor_id}.png`;
    }
  }, [message]);

  const openAuthor = useCallback(() => {
    const actor =
      message.type == "admin" || message.actor_username == "systemuser"
        ? "ScratchCat"
        : message.actor_username;
    router.push(`/users/${actor}`);
  }, [message]);

  const openMessage = useCallback(() => {
    switch (message.type) {
      case "followuser":
        openAuthor();
        break;
      case "loveproject":
        router.push(`/projects/${message.project_id}`);
        break;
      case "favoriteproject":
        router.push(`/projects/${message.project_id}`);
        break;
      case "addcomment":
        if (message?.comment_type === 0) {
          router.push(
            `/projects/${message.comment_obj_id}/comments?comment_id=comments-${message.comment_id}`
          );
        } else if (message?.comment_type === 1) {
          router.push(
            `/users/${message.comment_obj_title}/comments?comment_id=comments-${message.comment_id}`
          );
        } else if (message?.comment_type === 2) {
          router.push(
            `/studios/${message.comment_obj_id}/comments?comment_id=${message.comment_id}`
          );
        }
        break;
      case "studioactivity":
        router.push(`/studios/${message.gallery_id}`);
        break;
      case "remixproject":
        router.push(`/projects/${message.project_id}`);
        break;
      case "curatorinvite":
        router.push(`/studios/${message.gallery_id}`);
        break;
      case "becomeownerstudio":
        router.push(`/studios/${message.gallery_id}`);
        break;
      case "becomehoststudio":
        router.push(`/studios/${message.gallery_id}`);
        break;
      case "forumpost":
        linkWithFallback(
          `https://scratch.mit.edu/discuss/topic/${message.topic_id}/`,
          colors.accent
        );
        return `posted in ${message.topic_title}`;
      case "admin":
        return message.message;
    }
  }, [message]);

  const timeAgoDate = useMemo(() => {
    return timeago.ago(message.datetime_created);
  }, [message]);

  return (
    <Pressable
      android_ripple={{ color: colors.ripple, foreground: true }}
      onPress={openMessage}
    >
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 15,
          borderBottomWidth: 1,
          borderBottomColor: colors.backgroundTertiary,
          backgroundColor: colors.background,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            marginRight: 20,
            borderRadius: 25,
            overflow: "hidden",
            height: 36,
            width: 36,
          }}
        >
          <Pressable
            android_ripple={{ color: colors.ripple, foreground: true }}
            onPress={openAuthor}
          >
            <Image
              source={{ uri: pfpLink }}
              placeholder={require("../assets/avatar.png")}
              placeholderContentFit="cover"
              style={{ width: 36, height: 36, backgroundColor: "white" }}
            />
          </Pressable>
        </View>
        <View style={{ maxWidth: "85%" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ItchyText style={{ color: colors.text, fontWeight: "bold" }}>
              {headerText}
            </ItchyText>
            {message.type == "addcomment" && message?.comment_type === 0 && (
              <>
                <ItchyText
                  style={{
                    color: colors.text,
                    fontStyle: "italic",
                    opacity: 0.6,
                  }}
                >
                  {" "}
                  on
                </ItchyText>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/projects/${message.comment_obj_id}`)
                  }
                >
                  <ItchyText
                    style={{
                      color: colors.accent,
                      fontStyle: "italic",
                      opacity: 1,
                      fontWeight: "bold",
                    }}
                  >
                    {" "}
                    {message.comment_obj_title}
                  </ItchyText>
                </TouchableOpacity>
              </>
            )}
            {message.type == "addcomment" && message?.comment_type === 1 && (
              <>
                <ItchyText
                  style={{
                    color: colors.text,
                    fontStyle: "italic",
                    opacity: 0.6,
                  }}
                >
                  {" "}
                  on
                </ItchyText>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/users/${message.comment_obj_title}`)
                  }
                >
                  <ItchyText
                    style={{
                      color: colors.accent,
                      fontStyle: "italic",
                      opacity: 1,
                      fontWeight: "bold",
                    }}
                  >
                    {" "}
                    {message.comment_obj_title == username
                      ? "your profile"
                      : `${message.comment_obj_title}'s profile`}
                  </ItchyText>
                </TouchableOpacity>
              </>
            )}
            {message.type == "addcomment" && message?.comment_type === 2 && (
              <>
                <ItchyText
                  style={{
                    color: colors.text,
                    fontStyle: "italic",
                    opacity: 0.6,
                  }}
                >
                  {" "}
                  in
                </ItchyText>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/studios/${message.comment_obj_id}`)
                  }
                >
                  <ItchyText
                    style={{
                      color: colors.accent,
                      fontStyle: "italic",
                      opacity: 1,
                      fontWeight: "bold",
                    }}
                  >
                    {" "}
                    {message.comment_obj_title}
                  </ItchyText>
                </TouchableOpacity>
              </>
            )}
            <ItchyText
              style={{
                color: colors.textSecondary,
                fontStyle: "italic",
                opacity: 0.6,
              }}
            >
              {" "}
              {timeAgoDate}
            </ItchyText>
          </View>
          {message.type == "addcomment" ? (
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 15,
                borderRadius: 10,
                marginTop: 5,
                marginRight: "auto",
                backgroundColor: colors.backgroundSecondary,
              }}
            >
              <ItchyText style={{ color: colors.text, marginRight: "auto" }}>
                {bodyText}
              </ItchyText>
            </View>
          ) : (
            <ItchyText style={{ color: colors.text, marginRight: 64 }}>
              {bodyText}
            </ItchyText>
          )}
        </View>
      </View>
    </Pressable>
  );
}
