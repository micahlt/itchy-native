const REFRESH_TRIGGER_HEIGHT = 50;
const MAX_PULL_HEIGHT = 75;

import { Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { Gesture, GestureDetector, ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { useTheme } from '../../utils/theme';
import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
import useSWR from 'swr';

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
    const feedRef = useRef(null);
    const AniamtedSquircleView = Animated.createAnimatedComponent(FastSquircleView);

    // SWR data fetching for explore data
    const { data: exploreData, isLoading: exploreLoading, mutate: refreshExplore } = useSWR(
        'explore',
        () => ScratchAPIWrapper.explore.getExplore(),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // SWR for friends data
    const { data: friendsLoves = [], mutate: refreshFriendsLoves } = useSWR(
        username && token ? ['friendsLoves', username, token] : null,
        () => ScratchAPIWrapper.explore.getFriendsLoves(username, token),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    const { data: friendsProjects = [], mutate: refreshFriendsProjects } = useSWR(
        username && token ? ['friendsProjects', username, token] : null,
        () => ScratchAPIWrapper.explore.getFriendsProjects(username, token),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Simple refresh function using SWR mutate
    const refresh = useCallback(() => {
        console.log("Starting refresh");
        rotationPaused.value = false;

        // Refresh all data sources
        refreshExplore();
        refreshFriendsLoves();
        refreshFriendsProjects();
        feedRef.current?.refresh();

        // Stop rotation after a delay
        setTimeout(() => {
            console.log("Stopping rotation");
            rotationPaused.value = true;
        }, 2000);
    }, [refreshExplore, refreshFriendsLoves, refreshFriendsProjects]);    // Memoize vib function to prevent recreations
    const vib = useCallback((length) => {
        if (length === "tick") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        } else if (length === "long") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        }
    }, []);

    useEffect(() => {
        rotate.value = withPause(
            withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false),
            rotationPaused
        );
        // Start initial rotation, data loads automatically via SWR
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
        .onUpdate((e) => {
            if (isAtTop.value && scrollOffset.value <= 0 && e.translationY > 0) {
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
        }), [vib, refresh]);

    // Memoize feed with stable dependency
    const memoizedFeed = useMemo(() => {
        return <Feed ref={feedRef} style={{ margin: 20 }} username={username} />
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
                        {exploreData?.featured?.length > 0 &&
                            <HorizontalContentScroller title="Featured Projects" data={exploreData.featured} iconName="sparkles" headerStyle={{ marginTop: 10 }} />}

                        {friendsLoves.length > 0 &&
                            <HorizontalContentScroller title="Friends Loved" data={friendsLoves} iconName="people" />}

                        {friendsProjects.length > 0 &&
                            <HorizontalContentScroller title="Created by Friends" data={friendsProjects} iconName="people" />}

                        {exploreData?.topLoved?.length > 0 &&
                            <HorizontalContentScroller title="Top Loved" data={exploreData.topLoved} iconName="heart" />}

                        {exploreData?.featuredStudios?.length > 0 &&
                            <FeaturedStudios studios={exploreData.featuredStudios} colors={colors} />}

                        {exploreData?.topRemixed?.length > 0 &&
                            <HorizontalContentScroller title="Top Remixed" data={exploreData.topRemixed} iconName="sync" />}

                        {exploreData?.newest?.length > 0 &&
                            <HorizontalContentScroller title="Newest Projects" data={exploreData.newest} iconName="time" />}
                    </AniamtedSquircleView>
                </ScrollView>
            </GestureDetector>
        </View>
    );
}
