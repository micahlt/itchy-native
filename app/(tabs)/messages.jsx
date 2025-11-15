import { RefreshControl, ScrollView, Platform } from "react-native";
import { getCrashlytics, log, recordError } from '@react-native-firebase/crashlytics';
import ItchyText from "../../components/ItchyText";
import { useTheme } from "../../utils/theme";
import { useMMKVString } from "react-native-mmkv";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ScratchAPIWrapper from "../../utils/api-wrapper";
import Message from "../../components/Message";
import { SafeAreaView } from "react-native-safe-area-context";
import SignInPrompt from "../../components/SignInPrompt";
import Chip from "../../components/Chip";
import SquircleView from "../../components/SquircleView";
import Animated from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect } from "expo-router";

const c = getCrashlytics();

export default function Messages() {
  const { colors, dimensions, isDark } = useTheme();
  const [username] = useMMKVString("username");
  const [token] = useMMKVString("token");
  const [messages, setMessages] = useState([]);
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    studio: false,
    comment: false,
    interaction: false,
    forum: false,
  });
  const scrollRef = useRef();

  useEffect(() => {
    log(c, "Messages page rendered")
    if (!username || !token) {
      log(c, "No username or token available for messages");
      return;
    }
    log(c, "Username/token changed, reloading messages from beginning");
    setOffset(0);
    loadMessages();
  }, [username, token]);

  const loadMessages = () => {
    try {
      log(c, `Loading messages - offset: ${offset}, isInitialLoad: ${offset === 0}`);
      setLoading(true);
      ScratchAPIWrapper.messages
        .getMessages(username, token, offset, "", 30)
        .then((d) => {
          log(c, `Successfully fetched ${d.length} messages`);
          if (offset === 0) {
            log(c, "Setting initial messages");
            setMessages(d);
          } else {
            // Dedupe messages based on ID before concatenating
            const existingIds = new Set(messages.map((m) => m.id));
            const newMessages = d.filter((m) => !existingIds.has(m.id));
            log(c, `Adding ${newMessages.length} new messages (${d.length - newMessages.length} duplicates filtered)`);
            setMessages((prev) => prev.concat(newMessages));
          }
          setLoading(false);
        })
        .catch((error) => {
          log(c, "Failed to load messages");
          recordError(c, error);
          setLoading(false);
        });
    } catch (error) {
      log(c, "Error in loadMessages function");
      recordError(c, error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [offset]);

  useFocusEffect(useCallback(() => {
    if (!!scrollRef?.current) {
      scrollRef?.current.scrollTo({ x: 0, y: 0, animated: false });
    }
  }, [scrollRef]));

  const filteredMessages = useMemo(() => {
    try {
      // If no filters are active, show all messages
      const hasActiveFilters =
        filters.studio || filters.comment || filters.interaction || filters.forum;

      if (!hasActiveFilters) {
        log(c, `Showing all ${messages.length} messages (no filters active)`);
        return messages;
      }

      const activeFilters = Object.entries(filters)
        .filter(([_, active]) => active)
        .map(([key, _]) => key);

      const filtered = messages.filter((message) => {
        // Categorize messages based on type
        const isStudioMessage =
          message.type === "becomeownerstudio" ||
          message.type === "becomecurator" ||
          message.type === "addproject" ||
          message.type === "studioactivity";

        const isCommentMessage =
          message.type === "remixproject" ||
          message.type === "shareproject" ||
          message.type.includes("comment");

        const isInteractionMessage =
          message.type === "loveproject" ||
          message.type === "favoriteproject" ||
          message.type === "followuser";

        const isForumMessage = message.type === "forumpost";

        return (
          (filters.studio && isStudioMessage) ||
          (filters.comment && isCommentMessage) ||
          (filters.interaction && isInteractionMessage) ||
          (filters.forum && isForumMessage)
        );
      });

      log(c, `Filtered ${messages.length} messages to ${filtered.length} using filters: ${activeFilters.join(', ')}`);
      return filtered;
    } catch (error) {
      log(c, "Error filtering messages");
      recordError(c, error);
      return messages; // Fallback to showing all messages
    }
  }, [messages, filters]);

  const toggleFilter = useCallback((filterType) => {
    try {
      setFilters((prev) => {
        const newValue = !prev[filterType];
        log(c, `Filter ${filterType} ${newValue ? 'enabled' : 'disabled'}`);
        return {
          ...prev,
          [filterType]: newValue,
        };
      });
    } catch (error) {
      log(c, `Error toggling filter ${filterType}`);
      recordError(c, error);
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    try {
      log(c, "Clearing all message filters");
      setFilters({
        studio: false,
        comment: false,
        interaction: false,
        forum: false,
      });
    } catch (error) {
      log(c, "Error clearing all filters");
      recordError(c, error);
    }
  }, []);

  const renderFilterChips = () => {
    const hasActiveFilters =
      filters.studio || filters.comment || filters.interaction || filters.forum;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 10,
          gap: 5,
          paddingBottom: 0,
        }}
        style={{ maxHeight: 60 }}
      >
        {hasActiveFilters && (
          <Chip.Icon
            icon="close"
            text="Clear Filters"
            color={"red"}
            mode="filled"
            onPress={clearAllFilters}
          />
        )}
        <Chip.Icon
          icon="albums"
          text="Studios"
          color={filters.studio ? colors.accent : colors.chipColor}
          mode={filters.studio ? "filled" : "outlined"}
          onPress={() => toggleFilter("studio")}
        />
        <Chip.Icon
          icon="chatbubble"
          text="Comments"
          color={filters.comment ? colors.accent : colors.chipColor}
          mode={filters.comment ? "filled" : "outlined"}
          onPress={() => toggleFilter("comment")}
        />
        <Chip.Icon
          icon="star"
          text="Interactions"
          color={filters.interaction ? colors.accent : colors.chipColor}
          mode={filters.interaction ? "filled" : "outlined"}
          onPress={() => toggleFilter("interaction")}
        />
        <Chip.Icon
          icon="chatbox"
          text="Forum Posts"
          color={filters.forum ? colors.accent : colors.chipColor}
          mode={filters.forum ? "filled" : "outlined"}
          onPress={() => toggleFilter("forum")}
        />
      </ScrollView>
    );
  };

  const renderMessage = (m) => {
    return <Message message={m.item} />;
  };

  if (!username || !token) {
    log(c, "Messages page loaded without authentication - showing sign in prompt");
    return (
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ItchyText
          style={{
            color: colors.text,
            fontWeight: "bold",
            fontSize: 24,
            marginBottom: 10,
            marginHorizontal: 20,
          }}
        >
          Messages
        </ItchyText>
        <SignInPrompt />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.accentTransparent }}
    >
      <ItchyText
        style={{
          color: colors.text,
          fontWeight: "bold",
          fontSize: 24,
          marginTop: 10,
          marginHorizontal: 15,
        }}
      >
        Messages
      </ItchyText>
      {renderFilterChips()}
      <SquircleView
        cornerSmoothing={0.6}
        style={{
          backgroundColor: colors.background,
          marginTop: 0,
          marginHorizontal: 1.5,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          outlineColor: colors.outlineCard,
          outlineStyle: "solid",
          outlineWidth: dimensions.outlineWidth,
          borderWidth: 0.1,
          borderColor: colors.background,
          borderTopWidth: 4,
          borderTopColor: colors.highlight,
          flex: 1,
          overflow: "visible",
          boxShadow:
            "0px -2px 16px rgba(0,94,185,0.15), 0px 6px 8px 0px #ffffff15 inset, 0px 3px 0px 0px #FFFFFF11 inset",
        }}
      >
        <SquircleView
          style={{
            flex: 1,
            overflow: "hidden",
            borderTopLeftRadius: dimensions.largeRadius,
            borderTopRightRadius: dimensions.largeRadius,
            marginTop: 0,
          }}
        >
          <FlashList
            data={filteredMessages}
            style={{ backgroundColor: colors.background, flex: 1 }}
            renderItem={(item) => renderMessage({ item: item.item })}
            keyExtractor={(item) => item.id}
            ref={scrollRef}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                tintColor={"white"}
                progressBackgroundColor={colors.accent}
                colors={isDark ? ["black"] : ["white"]}
                onRefresh={() => {
                  try {
                    log(c, "User initiated pull-to-refresh on messages");
                    setOffset(0);
                    loadMessages();
                  } catch (error) {
                    console.error(error);
                    log(c, "Error during messages refresh");
                    recordError(c, error);
                  }
                }}
              />
            }
            onEndReachedThreshold={1.2}
            onEndReached={() => {
              try {
                if (loading) return;
                log(c, `User reached end of messages list, loading more from offset ${messages.length}`);
                setLoading(true);
                setOffset(messages.length);
              } catch (error) {
                log(c, "Error during pagination");
                recordError(c, error);
              }
            }}
          />
        </SquircleView>
      </SquircleView>
    </SafeAreaView>
  );
}
