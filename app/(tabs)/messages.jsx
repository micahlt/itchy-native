import { FlatList, RefreshControl, Text, ScrollView, View } from "react-native";
import { useTheme } from "../../utils/theme";
import { useMMKVString } from "react-native-mmkv";
import { useCallback, useEffect, useMemo, useState } from "react";
import ScratchAPIWrapper from "../../utils/api-wrapper";
import Message from "../../components/Message";
import { SafeAreaView } from "react-native-safe-area-context";
import SignInPrompt from "../../components/SignInPrompt";
import Chip from "../../components/Chip";

export default function Messages() {
    const { colors, isDark } = useTheme();
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
                setMessages(messages.concat(newMessages));
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
                contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 10 }}
                style={{ maxHeight: 60 }}
            >
                {hasActiveFilters && (
                    <Chip.Icon
                        icon="clear"
                        text="Clear Filters"
                        color={"red"}
                        mode="filled"
                        onPress={clearAllFilters}
                    />
                )}
                <Chip.Icon
                    icon="collections"
                    text="Studios"
                    color={filters.studio ? colors.accent : colors.textSecondary}
                    mode={filters.studio ? "filled" : "outlined"}
                    onPress={() => toggleFilter('studio')}
                />
                <Chip.Icon
                    icon="comment"
                    text="Comments"
                    color={filters.comment ? colors.accent : colors.textSecondary}
                    mode={filters.comment ? "filled" : "outlined"}
                    onPress={() => toggleFilter('comment')}
                />
                <Chip.Icon
                    icon="favorite"
                    text="Interactions"
                    color={filters.interaction ? colors.accent : colors.textSecondary}
                    mode={filters.interaction ? "filled" : "outlined"}
                    onPress={() => toggleFilter('interaction')}
                />
                <Chip.Icon
                    icon="forum"
                    text="Forum Posts"
                    color={filters.forum ? colors.accent : colors.textSecondary}
                    mode={filters.forum ? "filled" : "outlined"}
                    onPress={() => toggleFilter('forum')}
                />
            </ScrollView>
        );
    };

    const renderHeader = () => {
        return (
            <View style={{ backgroundColor: colors.background }}>
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 24, marginVertical: 20, marginBottom: 10, marginHorizontal: 15 }}>Messages</Text>
            </View>
        );
    };

    const renderStickyFilters = () => {
        return (
            <View style={{ backgroundColor: colors.background }}>
                {renderFilterChips()}
            </View>
        );
    };

    const renderMessage = (m) => {
        return <Message message={m.item} />
    };


    if (!username || !token) {
        return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 24, marginBottom: 10, marginHorizontal: 20 }}>Messages</Text>
            <SignInPrompt />
        </SafeAreaView>
    }

    return <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <FlatList
            data={[{}, ...filteredMessages]}
            style={{ backgroundColor: colors.background }}
            renderItem={(item) => {
                if (item.index === 0) {
                    return renderStickyFilters();
                }
                return renderMessage({ item: item.item });
            }}
            keyExtractor={(item, index) => {
                if (index === 0) return "sticky-filters";
                return item.id;
            }}
            ListHeaderComponent={renderHeader}
            stickyHeaderIndices={[1]}
            onRefresh={() => {
                setOffset(0);
                loadMessages();
            }}
            refreshing={loading}
            refreshControl={<RefreshControl refreshing={loading} tintColor={"white"} progressBackgroundColor={colors.accent} colors={isDark ? ["black"] : ["white"]} />}
            onEndReachedThreshold={1.2}
            onEndReached={() => {
                if (loading) return;
                setOffset(messages.length);
            }} />
    </SafeAreaView>
}