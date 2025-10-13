import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Dimensions, StatusBar, Platform, ActivityIndicator, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMMKVString } from 'react-native-mmkv';
import { useTheme } from '../utils/theme';
import reelsContentAggregator from '../utils/reelsContentAggregator';
import ReelsContentItem from '../components/ReelsContentItem';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ItchyText from '../components/ItchyText';
import { Stack } from 'expo-router';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScrollScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [username] = useMMKVString("username");
    const [token] = useMMKVString("token");

    const [content, setContent] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasError, setHasError] = useState(false);

    const flashListRef = useRef(null);
    const isLoadingMoreRef = useRef(false);
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80,
        minimumViewTime: 300,
    });

    // Calculate item height (full screen minus safe areas)
    const itemHeight = SCREEN_HEIGHT + insets.top;

    // Initialize content aggregator with user credentials
    useEffect(() => {
        if (username && token) {
            reelsContentAggregator.setUser(username, token);
        }
    }, [username, token]);

    // Load initial content
    useEffect(() => {
        loadInitialContent();
    }, []);

    const loadInitialContent = async () => {
        setIsLoading(true);
        setHasError(false);
        try {
            const initialBatch = await reelsContentAggregator.getNextBatch(5);
            if (initialBatch.length === 0) {
                setHasError(true);
            } else {
                setContent(initialBatch);
            }
        } catch (error) {
            console.error('Error loading initial content:', error);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreContent = async () => {
        if (isLoadingMoreRef.current || !reelsContentAggregator.hasMore()) return;

        isLoadingMoreRef.current = true;
        try {
            const nextBatch = await reelsContentAggregator.getNextBatch(3);
            if (nextBatch.length > 0) {
                setContent(prevContent => [...prevContent, ...nextBatch]);
            }
        } catch (error) {
            console.error('Error loading more content:', error);
        } finally {
            isLoadingMoreRef.current = false;
        }
    };

    const onRefresh = async () => {
        setIsRefreshing(true);
        setHasError(false);
        try {
            const refreshedContent = await reelsContentAggregator.refresh();
            if (refreshedContent.length === 0) {
                setHasError(true);
            } else {
                setContent(refreshedContent);
                setCurrentIndex(0);
                flashListRef.current?.scrollToIndex({ index: 0, animated: false });
            }
        } catch (error) {
            console.error('Error refreshing content:', error);
            setHasError(true);
        } finally {
            setIsRefreshing(false);
        }
    };

    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const visibleIndex = viewableItems[0].index;
            setCurrentIndex(visibleIndex);

            // Load more content when user is near the end
            if (visibleIndex >= content.length - 2) {
                loadMoreContent();
            }
        }
    }, [content.length]);

    const renderItem = useCallback(({ item, index }) => {
        return (
            <ReelsContentItem
                item={item}
                index={index}
                isActive={index === currentIndex}
                height={itemHeight}
                width={SCREEN_WIDTH}
                topInset={insets.top + 5}
            />
        );
    }, [currentIndex, itemHeight]);

    const renderFooter = useCallback(() => {
        if (!reelsContentAggregator.hasMore()) {
            return (
                <View style={{
                    height: itemHeight,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.background,
                }}>
                    <ItchyText style={{
                        color: colors.textSecondary,
                        fontSize: 16,
                        textAlign: 'center',
                        paddingHorizontal: 40,
                    }}>
                        You've reached the end!{'\n'}Pull down to refresh for new content.
                    </ItchyText>
                </View>
            );
        }

        if (isLoadingMoreRef.current) {
            return (
                <View style={{
                    height: itemHeight,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.background,
                }}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <ItchyText style={{
                        color: colors.textSecondary,
                        fontSize: 14,
                        marginTop: 10,
                    }}>
                        Loading more content...
                    </ItchyText>
                </View>
            );
        }

        return null;
    }, [colors, itemHeight]);

    const keyExtractor = useCallback((item) => item.id, []);

    const getItemLayout = useCallback((data, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
    }), [itemHeight]);

    const onScrollToIndexFailed = useCallback((info) => {
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
            flashListRef.current?.scrollToIndex({
                index: info.index,
                animated: false
            });
        });
    }, []);

    // Loading state
    if (isLoading && content.length === 0) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: colors.background,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <ActivityIndicator size="large" color={colors.accent} />
                <ItchyText style={{
                    color: colors.textSecondary,
                    fontSize: 16,
                    marginTop: 15,
                }}>
                    Loading amazing projects...
                </ItchyText>
            </View>
        );
    }

    // Error state
    if (hasError && content.length === 0) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: colors.background,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 40,
            }}>
                <ItchyText style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: 10,
                }}>
                    Oops! Something went wrong
                </ItchyText>
                <ItchyText style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    textAlign: 'center',
                    marginBottom: 20,
                    lineHeight: 20,
                }}>
                    We couldn't load content right now. Check your internet connection and try again.
                </ItchyText>
                <Pressable
                    onPress={loadInitialContent}
                    style={{
                        backgroundColor: colors.accent,
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        borderRadius: 25,
                    }}
                >
                    <ItchyText style={{
                        color: 'white',
                        fontSize: 16,
                        fontWeight: 'bold',
                    }}>
                        Try Again
                    </ItchyText>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={{
            flex: 1,
            backgroundColor: colors.background
        }}>
            <Stack.Screen options={{ headerShown: false }} />
            <FlashList
                ref={flashListRef}
                data={content}
                renderItem={renderItem}
                ListFooterComponent={renderFooter}
                keyExtractor={keyExtractor}
                estimatedItemSize={itemHeight}
                getItemLayout={getItemLayout}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig.current}
                onScrollToIndexFailed={onScrollToIndexFailed}
                showsVerticalScrollIndicator={false}
                snapToInterval={itemHeight}
                snapToAlignment="start"
                decelerationRate="fast"
                pagingEnabled={Platform.OS === 'ios'}
                onRefresh={onRefresh}
                refreshing={isRefreshing}
                onEndReached={loadMoreContent}
                onEndReachedThreshold={0.7}
            />
        </View>
    );
}