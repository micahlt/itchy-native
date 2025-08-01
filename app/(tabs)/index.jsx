const REFRESH_TRIGGER_HEIGHT = 50;
const MAX_PULL_HEIGHT = 75;

import { Platform, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { Gesture, GestureDetector, ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { useTheme } from '../../utils/theme';
import { useEffect, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMMKVBoolean, useMMKVObject, useMMKVString } from 'react-native-mmkv';
import Feed from '../../components/Feed';
import SignInPrompt from '../../components/SignInPrompt';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StudioCard from '../../components/StudioCard';
import Animated, { Easing, runOnJS, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { withPause } from 'react-native-redash';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import HorizontalContentScroller from '../../components/HorizontalContentScroller';

export default function HomeScreen() {
    const { colors } = useTheme();
    const [hasOpenedBefore, setHasOpenedBefore] = useMMKVBoolean("hasOpenedBeforeDev");
    const [exploreData, setExploreData] = useState(null);
    const [friendsLoves, setFriendsLoves] = useState([]);
    const [friendsProjects, setFriendsProjects] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);
    const [user] = useMMKVObject("user");
    const [username] = useMMKVString("username");
    const [token] = useMMKVString("token");
    const insets = useSafeAreaInsets();
    const scrollRef = useAnimatedRef();
    const scrollOffset = useScrollViewOffset(scrollRef);
    const panPosition = useSharedValue(0);
    const rotate = useSharedValue(0);
    const isAtTop = useSharedValue(true);
    const didVibrate = useSharedValue(false);
    const rotationPaused = useSharedValue(false);

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
                { translateY: withSpring(scrollOffset.value, { damping: 100, stiffness: 200 }) },
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

    const load = async () => {
        const d = await ScratchAPIWrapper.explore.getExplore();
        setExploreData(d);
        if (username) {
            const l = await ScratchAPIWrapper.explore.getFriendsLoves(username, token);
            setFriendsLoves(l);
            const p = await ScratchAPIWrapper.explore.getFriendsProjects(username, token);
            setFriendsProjects(p);
        }
        setIsRefreshing(false);
        setRefreshCount(prev => prev + 1);
        setTimeout(() => {
            rotationPaused.value = true;
        }, 1500);
    }

    const refresh = () => {
        rotationPaused.value = false;
        setIsRefreshing(true);
        setTimeout(load, 250);
    }

    const vib = (length) => {
        if (length === "tick") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        } else if (length === "long") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        }
    }

    const panGesture = Gesture.Pan()
        .simultaneousWithExternalGesture(scrollRef)
        .enabled(!isRefreshing)
        .onUpdate((e) => {
            if (!isRefreshing && isAtTop.value && scrollOffset.value <= 0 && e.translationY > 0) {
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
            panPosition.value = withSpring(0, { damping: 10, stiffness: 80 });
        });

    return (
        <View style={{ backgroundColor: colors.accentTransparent }}>
            {!hasOpenedBefore && <Redirect href="/onboarding" />}
            <GestureDetector gesture={panGesture}>
                <ScrollView ref={scrollRef} scrollEventThrottle={2} onScrollBeginDrag={(e) => {
                    const offsetY = e.nativeEvent.contentOffset.y;
                    isAtTop.value = offsetY <= 0;
                }}
                    onScroll={(e) => {
                        const offsetY = e.nativeEvent.contentOffset.y;
                        isAtTop.value = offsetY <= 0;
                    }} showsVerticalScrollIndicator={false}>
                    <Animated.View style={[headerStyle, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: insets.top + 5, paddingBottom: 15, paddingHorizontal: 20, gap: 10 }]}>
                        <TouchableOpacity onPress={() => router.push(`/multiplay`)}><MaterialIcons name="tap-and-play" style={{ marginLeft: 7 }} size={26} color={colors.textSecondary} /></TouchableOpacity>
                        <Animated.Image source={require("../../assets/logo-nobg.png")} style={[logoStyle, { height: 65, width: 65 }]} />
                        <TouchableOpacity onPress={() => router.push('/settings')}><MaterialIcons style={{ marginRight: 7 }} name="settings" size={26} contentFit="cover" color={colors.textSecondary} /></TouchableOpacity>
                    </Animated.View>
                    <Animated.View style={[contentStyle, { backgroundColor: colors.background, paddingBottom: Platform.OS == "ios" ? 60 : insets.bottom + 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 10, boxShadow: "0px -2px 10px rgba(0,0,0,0.1)" }]}>
                        {!!username ? <Feed style={{ margin: 20, marginBottom: 0, marginTop: 15 }} username={username} rerender={refreshCount} /> : <SignInPrompt />}

                        {exploreData?.featured?.length > 0 &&
                            <HorizontalContentScroller title="Featured Projects" data={exploreData.featured} iconName="workspace-premium" headerStyle={{ marginTop: 10 }} />}

                        {friendsLoves.length > 0 &&
                            <HorizontalContentScroller title="Friends Loved" data={friendsLoves} iconName="people" />}

                        {friendsProjects.length > 0 &&
                            <HorizontalContentScroller title="Created by Friends" data={friendsProjects} iconName="people" />}

                        {exploreData?.topLoved?.length > 0 &&
                            <HorizontalContentScroller title="Top Loved" data={exploreData.topLoved} iconName="favorite" />}

                        {exploreData?.featuredStudios?.length > 0 && <>
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                padding: 20,
                                paddingBottom: 0,
                                paddingTop: 5,
                                gap: 10
                            }}>
                                <MaterialIcons name='photo-filter' size={24} color={colors.text} />
                                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>Featured Studios</Text>
                            </View>
                            <ScrollView horizontal contentContainerStyle={{
                                padding: 20, paddingTop: 10, paddingBottom: 10, columnGap: 10
                            }} showsHorizontalScrollIndicator={false}>
                                {exploreData?.featuredStudios?.map((item, index) => (<StudioCard key={index} studio={item} />))}
                            </ScrollView>
                        </>}

                        {exploreData?.topRemixed?.length > 0 &&
                            <HorizontalContentScroller title="Top Remixed" data={exploreData.topRemixed} iconName="sync" />}

                        {exploreData?.newest?.length > 0 &&
                            <HorizontalContentScroller title="Newest Projects" data={exploreData.newest} iconName="more-time" />}
                    </Animated.View>
                </ScrollView>
            </GestureDetector>
        </View>
    );
}
