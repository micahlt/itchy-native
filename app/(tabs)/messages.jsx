import { RefreshControl, ScrollView, Platform } from "react-native";
import ItchyText from "../../components/ItchyText";
import { useTheme } from "../../utils/theme";
import { useMMKVString } from "react-native-mmkv";
import { useCallback, useEffect, useMemo, useState } from "react";
import ScratchAPIWrapper from "../../utils/api-wrapper";
import Message from "../../components/Message";
import { SafeAreaView } from "react-native-safe-area-context";
import SignInPrompt from "../../components/SignInPrompt";
import Chip from "../../components/Chip";
import FastSquircleView from "react-native-fast-squircle";
import Animated from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";

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
        forum: false
    });
    const AnimatedSquircleView = Animated.createAnimatedComponent(FastSquircleView);

    useEffect(() => {
        if (!username || !token) return;
        setOffset(0);
        loadMessages();
    }, [username, token]);

    const loadMessages = () => {
        setLoading(true);
        ScratchAPIWrapper.messages.getMessages(username, token, offset, "", 30).then((d) => {
            if (offset === 0) {
                setMessages(d);
            } else {
                // Dedupe messages based on ID before concatenating
                const existingIds = new Set(messages.map(m => m.id));
                const newMessages = d.filter(m => !existingIds.has(m.id));
                setMessages(prev => prev.concat(newMessages));
            }
            setLoading(false);
        });
    }

    useEffect(() => {
        loadMessages();
    }, [offset])

    const filteredMessages = useMemo(() => {
        // If no filters are active, show all messages
        const hasActiveFilters = filters.studio || filters.comment || filters.interaction || filters.forum;
        if (!hasActiveFilters) {
            return messages;
        }

        return messages.filter(message => {
            // Categorize messages based on type
            const isStudioMessage = message.type === "becomeownerstudio" ||
                message.type === "becomecurator" ||
                message.type === "addproject" ||
                message.type === "studioactivity";

            const isCommentMessage = message.type === "remixproject" ||
                message.type === "shareproject" ||
                message.type.includes("comment");

            const isInteractionMessage = message.type === "loveproject" ||
                message.type === "favoriteproject" ||
                message.type === "followuser";

            const isForumMessage = message.type === "forumpost";

            return (filters.studio && isStudioMessage) ||
                (filters.comment && isCommentMessage) ||
                (filters.interaction && isInteractionMessage) ||
                (filters.forum && isForumMessage);
        });
    }, [messages, filters]);

    const toggleFilter = useCallback((filterType) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: !prev[filterType]
        }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters({
            studio: false,
            comment: false,
            interaction: false,
            forum: false
        });
    }, []);

    const renderFilterChips = () => {
        const hasActiveFilters = filters.studio || filters.comment || filters.interaction || filters.forum;
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, gap: 5, paddingBottom: 0 }}
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
                    color={filters.studio ? colors.accent : colors.textSecondary}
                    mode={filters.studio ? "filled" : "outlined"}
                    onPress={() => toggleFilter('studio')}
                />
                <Chip.Icon
                    icon="chatbubble"
                    text="Comments"
                    color={filters.comment ? colors.accent : colors.textSecondary}
                    mode={filters.comment ? "filled" : "outlined"}
                    onPress={() => toggleFilter('comment')}
                />
                <Chip.Icon
                    icon="star"
                    text="Interactions"
                    color={filters.interaction ? colors.accent : colors.textSecondary}
                    mode={filters.interaction ? "filled" : "outlined"}
                    onPress={() => toggleFilter('interaction')}
                />
                <Chip.Icon
                    icon="chatbox"
                    text="Forum Posts"
                    color={filters.forum ? colors.accent : colors.textSecondary}
                    mode={filters.forum ? "filled" : "outlined"}
                    onPress={() => toggleFilter('forum')}
                />
            </ScrollView>
        );
    };

    const renderMessage = (m) => {
        return <Message message={m.item} />
    };


    if (!username || !token) {
        return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
            <ItchyText style={{ color: colors.text, fontWeight: 'bold', fontSize: 24, marginBottom: 10, marginHorizontal: 20 }}>Messages</ItchyText>
            <SignInPrompt />
        </SafeAreaView>
    }

    return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.accentTransparent }}>
        <ItchyText style={{ color: colors.text, fontWeight: 'bold', fontSize: 24, marginTop: 20, marginHorizontal: 15 }}>Messages</ItchyText>
        {renderFilterChips()}
        <FastSquircleView cornerSmoothing={0.6} style={{
            backgroundColor: colors.background, marginTop: 0, marginHorizontal: 1.5, paddingBottom: Platform.OS == "ios" ? 60 : 0, borderTopLeftRadius: 32, borderTopRightRadius: 32, outlineColor: colors.outline,
            outlineStyle: "solid",
            outlineWidth: dimensions.outlineWidth,
            borderWidth: 0.1,
            borderColor: colors.background,
            borderTopWidth: 4,
            borderTopColor: colors.highlight,
            flex: 1,
            overflow: 'visible',
            boxShadow: "0px -2px 10px rgba(0,0,0,0.15)"
        }}>
            <FastSquircleView style={{ flex: 1, overflow: "hidden", borderTopLeftRadius: dimensions.largeRadius, borderTopRightRadius: dimensions.largeRadius, marginTop: -4 }}>
                <FlashList
                    data={filteredMessages}
                    style={{ backgroundColor: colors.background, flex: 1 }}
                    renderItem={(item) => renderMessage({ item: item.item })}
                    keyExtractor={(item) => item.id}
                    onRefresh={() => {
                        setOffset(0);
                        loadMessages();
                    }}
                    refreshControl={<RefreshControl refreshing={loading} tintColor={"white"} progressBackgroundColor={colors.accent} colors={isDark ? ["black"] : ["white"]} />}
                    onEndReachedThreshold={1.2}
                    onEndReached={() => {
                        if (loading) return;
                        setLoading(true);
                        setOffset(messages.length);
                    }} />
            </FastSquircleView>
        </FastSquircleView>
    </SafeAreaView>
}