const REFRESH_TRIGGER_HEIGHT = 50;
const MAX_PULL_HEIGHT = 75;

import { Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { Gesture, GestureDetector, ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { useTheme } from '../../utils/theme';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMMKVBoolean, useMMKVObject, useMMKVString } from 'react-native-mmkv';
import Feed from '../../components/Feed';
import SignInPrompt from '../../components/SignInPrompt';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StudioCard from '../../components/StudioCard';
import Animated, { Easing, useAnimatedRef, useAnimatedStyle, useScrollOffset, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { withPause } from 'react-native-redash';
import { Redirect, router } from 'expo-router';
import HorizontalContentScroller from '../../components/HorizontalContentScroller';
import FastSquircleView from 'react-native-fast-squircle';
import ItchyText from '../../components/ItchyText';
import { Ionicons } from '@expo/vector-icons';

// Memoized header component to prevent unnecessary re-renders
const Header = memo(({ insets, colors, headerStyle, logoStyle }) => (
    <Animated.View style={[headerStyle, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 5, paddingBottom: 15, paddingHorizontal: 20, gap: 10 }]}>
        <TouchableOpacity onPress={() => router.push(`/multiplay`)}><Ionicons name="radio" style={{ marginLeft: 7 }} size={26} color={colors.textSecondary} /></TouchableOpacity>
        <Animated.Image source={require("../../assets/logo-nobg.png")} style={[logoStyle, { height: 65, width: 65 }]} />
        <TouchableOpacity onPress={() => router.push('/settings')}><Ionicons style={{ marginRight: 7 }} name="settings" size={26} color={colors.textSecondary} /></TouchableOpacity>
    </Animated.View>
));

// Memoized studios section
const FeaturedStudios = memo(({ studios, colors }) => (
    <>
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 20,
            paddingBottom: 10,
            paddingTop: 5,
            gap: 10
        }}>
            <Ionicons name='bookmarks' size={24} color={colors.text} />
            <ItchyText style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>Featured Studios</ItchyText>
        </View>
        <ScrollView horizontal contentContainerStyle={{
            padding: 20, paddingTop: 10, paddingBottom: 10, columnGap: 10
        }} showsHorizontalScrollIndicator={false}>
            {studios.map((item, index) => (<StudioCard key={`studio-${item.id || index}`} studio={item} />))}
        </ScrollView>
    </>
));

export default function HomeScreen() {
    const { colors } = useTheme();
    const [hasOpenedBefore, setHasOpenedBefore] = useMMKVBoolean("hasOpenedBeforeDev");
    // Combine related state to minimize updates
    const [dataState, setDataState] = useState({
        exploreData: null,
        friendsLoves: [],
        friendsProjects: [],
        isRefreshing: false
    });
    const [user] = useMMKVObject("user");
    const [username] = useMMKVString("username");
    const [token] = useMMKVString("token");
    const insets = useSafeAreaInsets();
    const scrollRef = useAnimatedRef();
    const scrollOffset = useScrollOffset(scrollRef);
    const panPosition = useSharedValue(0);
    const rotate = useSharedValue(0);
    const isAtTop = useSharedValue(true);
    const didVibrate = useSharedValue(false);
    const rotationPaused = useSharedValue(false);
    const AniamtedSquircleView = Animated.createAnimatedComponent(FastSquircleView);

    // Memoize vib function to prevent recreations
    const vib = useCallback((length) => {
        if (length === "tick") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        } else if (length === "long") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        }
    }, []);

    // Optimized load function with batched state updates
    const load = useCallback(async () => {
        try {
            const promises = [ScratchAPIWrapper.explore.getExplore()];

            if (username) {
                promises.push(
                    ScratchAPIWrapper.explore.getFriendsLoves(username, token),
                    ScratchAPIWrapper.explore.getFriendsProjects(username, token)
                );
            }

            const results = await Promise.all(promises);

            // Batch all state updates into a single update
            setDataState(prev => ({
                ...prev,
                exploreData: results[0],
                friendsLoves: results[1] || [],
                friendsProjects: results[2] || [],
                isRefreshing: false,
            }));

            setTimeout(() => {
                rotationPaused.value = true;
            }, 1500);
        } catch (error) {
            console.error('Error loading data:', error);
            setDataState(prev => ({ ...prev, isRefreshing: false }));
        }
    }, [username, token]);

    const refresh = useCallback(() => {
        rotationPaused.value = false;
        setDataState(prev => ({ ...prev, isRefreshing: true }));
        setTimeout(load, 250);
    }, [load]);

    useEffect(() => {
        rotate.value = withPause(
            withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false),
            rotationPaused
        );
        refresh();
        return () => {
            rotationPaused.value = true;
            rotate.value = 0;
            panPosition.value = 0;
        };
    }, []);

    const headerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: scrollOffset.value
                },
            ],
        };
    });

    const logoStyle = useAnimatedStyle(() => {
        if (Platform.OS === "ios") {
            return {
                transform: [
                    { translateY: panPosition.value * 2 },
                    { scale: 1 + Math.min(panPosition.value, MAX_PULL_HEIGHT) / 100 },
                    { rotate: `${rotate.value}deg` }
                ],
            };
        } else {
            return {
                transform: [
                    { translateY: panPosition.value / 2 },
                    { scale: 1 + Math.min(panPosition.value, MAX_PULL_HEIGHT) / 100 },
                    { rotate: `${rotate.value}deg` }
                ],
            };
        }
    });

    const contentStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: panPosition.value }
            ]
        };
    });

    // ...existing animated styles...

    // Memoize pan gesture to prevent recreations
    const panGesture = useMemo(() => Gesture.Pan()
        .simultaneousWithExternalGesture(scrollRef)
        .enabled(!dataState.isRefreshing)
        .onUpdate((e) => {
            if (!dataState.isRefreshing && isAtTop.value && scrollOffset.value <= 0 && e.translationY > 0) {
                panPosition.value = e.translationY * 0.18 + 0.5 * (1 - Math.min(e.translationY, MAX_PULL_HEIGHT) / MAX_PULL_HEIGHT);
                if (Math.floor(panPosition.value) % 18 == 0) runOnJS(vib)("tick");
                if (panPosition.value > REFRESH_TRIGGER_HEIGHT) {
                    if (!didVibrate.value) {
                        runOnJS(vib)("long");
                        didVibrate.value = true;
                    }
                }
            }
        })
        .onEnd((e) => {
            didVibrate.value = false;
            if (isAtTop.value && panPosition.value > REFRESH_TRIGGER_HEIGHT) {
                runOnJS(vib)("long");
                runOnJS(refresh)();
            }
            panPosition.value = withSpring(0, { damping: 35, stiffness: 400 });
        }), [dataState.isRefreshing, vib, refresh]);

    // Memoize feed with stable dependency
    const memoizedFeed = useMemo(() => {
        return <Feed style={{ margin: 20 }} username={username} />
    }, [username]);

    // Memoize scroll handlers
    const onScrollBeginDrag = useCallback((e) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        isAtTop.value = offsetY <= 0;
    }, []);

    const onScroll = useCallback((e) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        isAtTop.value = offsetY <= 0;
    }, []);

    // Memoize content style object
    const containerStyle = useMemo(() => ({
        backgroundColor: colors.background,
        marginHorizontal: 1.5,
        paddingBottom: Platform.OS == "ios" ? 60 : insets.bottom + 20,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderRadius: 0,
        paddingTop: 8,
        outlineColor: colors.outline,
        outlineStyle: "solid",
        outlineWidth: 1.5,
        borderWidth: 1,
        borderColor: colors.background,
        borderTopWidth: 4,
        borderTopColor: colors.highlight,
        boxShadow: "0px -2px 10px rgba(0,0,0,0.15)",
    }), [colors, insets.bottom]);

    return (
        <View style={{ backgroundColor: colors.accentTransparent }}>
            {!hasOpenedBefore && <Redirect href="/onboarding" />}
            <GestureDetector gesture={panGesture}>
                <ScrollView
                    ref={scrollRef}
                    scrollEventThrottle={2}
                    onScrollBeginDrag={onScrollBeginDrag}
                    onScroll={onScroll}
                    showsVerticalScrollIndicator={false}
                >
                    <Header insets={insets} colors={colors} headerStyle={headerStyle} logoStyle={logoStyle} />
                    <AniamtedSquircleView cornerSmoothing={0.6} style={[contentStyle, containerStyle]}>
                        {!!username ? memoizedFeed : <SignInPrompt />}
                        {dataState.exploreData?.featured?.length > 0 &&
                            <HorizontalContentScroller title="Featured Projects" data={dataState.exploreData.featured} iconName="sparkles" headerStyle={{ marginTop: 10 }} />}

                        {dataState.friendsLoves.length > 0 &&
                            <HorizontalContentScroller title="Friends Loved" data={dataState.friendsLoves} iconName="people" />}

                        {dataState.friendsProjects.length > 0 &&
                            <HorizontalContentScroller title="Created by Friends" data={dataState.friendsProjects} iconName="people" />}

                        {dataState.exploreData?.topLoved?.length > 0 &&
                            <HorizontalContentScroller title="Top Loved" data={dataState.exploreData.topLoved} iconName="heart" />}

                        {dataState.exploreData?.featuredStudios?.length > 0 &&
                            <FeaturedStudios studios={dataState.exploreData.featuredStudios} colors={colors} />}

                        {dataState.exploreData?.topRemixed?.length > 0 &&
                            <HorizontalContentScroller title="Top Remixed" data={dataState.exploreData.topRemixed} iconName="sync" />}

                        {dataState.exploreData?.newest?.length > 0 &&
                            <HorizontalContentScroller title="Newest Projects" data={dataState.exploreData.newest} iconName="time" />}
                    </AniamtedSquircleView>
                </ScrollView>
            </GestureDetector>
        </View>
    );
}
