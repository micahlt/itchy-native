const REFRESH_TRIGGER_HEIGHT = 75;
const MAX_PULL_HEIGHT = 100;

import { Platform, StyleSheet, Text, Vibration, View } from 'react-native';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { useTheme } from '../../utils/theme';
import { useEffect, useRef, useState } from 'react';
import ProjectCard from '../../components/ProjectCard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMMKVString } from 'react-native-mmkv';
import Feed from '../../components/Feed';
import SignInPrompt from '../../components/SignInPrompt';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StudioCard from '../../components/StudioCard';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedRef, useAnimatedStyle, useScrollViewOffset, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const s = new StyleSheet.create({
    scrollHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        paddingBottom: 0,
        paddingTop: 5,
        gap: 10
    }
});

export default function HomeScreen() {
    const { colors, isDark } = useTheme();
    const [exploreData, setExploreData] = useState(null);
    const [friendsLoves, setFriendsLoves] = useState([]);
    const [friendsProjects, setFriendsProjects] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);
    const [username] = useMMKVString("username");
    const [token] = useMMKVString("token");
    const insets = useSafeAreaInsets();
    const scrollRef = useAnimatedRef();
    const scrollOffset = useScrollViewOffset(scrollRef);
    const panPosition = useSharedValue(0);
    const rotate = useSharedValue(0);
    const isAtTop = useSharedValue(true);
    const didVibrate = useSharedValue(false);

    useEffect(() => {
        refresh()
    }, []);

    const headerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: scrollOffset.value },
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
        console.log("Refresh complete!");
        setTimeout(() => {
            cancelAnimation(rotate);
        }, 1500);
    }

    const refresh = () => {
        console.log("Refreshing...");
        rotate.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false);
        setIsRefreshing(true);
        setTimeout(load, 1000);
    }

    const vib = () => Vibration.vibrate(50);

    const panGesture = Gesture.Pan()
        .simultaneousWithExternalGesture(scrollRef)
        .enabled(!isRefreshing)
        .onUpdate((e) => {
            if (!isRefreshing && isAtTop.value && scrollOffset.value <= 0 && e.translationY > 0) {
                panPosition.value = e.translationY * 0.18 + 0.5 * (1 - Math.min(e.translationY, MAX_PULL_HEIGHT) / MAX_PULL_HEIGHT);
                if (panPosition.value > REFRESH_TRIGGER_HEIGHT) {
                    if (!didVibrate.value) {
                        runOnJS(vib)();
                        didVibrate.value = true;
                    }
                }
            }
        })
        .onEnd((e) => {
            didVibrate.value = false;
            if (isAtTop.value && panPosition.value > REFRESH_TRIGGER_HEIGHT) {
                runOnJS(refresh)();
            }
            panPosition.value = withTiming(0, { duration: 300 });
        });

    return (
        <View style={{ backgroundColor: colors.accentTransparent }}>
            <GestureDetector gesture={panGesture}>
                <ScrollView ref={scrollRef} scrollEventThrottle={16} bounces={true}
                    onScrollBeginDrag={(e) => {
                        const offsetY = e.nativeEvent.contentOffset.y;
                        isAtTop.value = offsetY <= 0;
                    }}
                    onScroll={(e) => {
                        const offsetY = e.nativeEvent.contentOffset.y;
                        isAtTop.value = offsetY <= 0;
                    }}>
                    <Animated.View style={[headerStyle, { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: insets.top + 5, paddingBottom: 15, gap: 10 }]}>
                        <Animated.Image source={require("../../assets/logo-nobg.png")} style={[logoStyle, { height: 50, width: 50 }]} />
                    </Animated.View>
                    <Animated.View style={[contentStyle, { backgroundColor: colors.background, paddingBottom: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 10 }]}>
                        {!!username ? <Feed style={{ margin: 20, marginBottom: 0, marginTop: 15 }} username={username} rerender={refreshCount} /> : <SignInPrompt />}
                        {exploreData?.featured?.length > 0 && <>
                            <View style={{ ...s.scrollHeader, marginTop: 10 }}>
                                <MaterialIcons name='workspace-premium' size={24} color={colors.text} />
                                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Featured</Text>
                            </View>
                            <ScrollView horizontal contentContainerStyle={{
                                padding: 20, paddingTop: 10, paddingBottom: 10, columnGap: 10
                            }} showsHorizontalScrollIndicator={false}>
                                {exploreData?.featured?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                            </ScrollView>
                        </>}

                        {friendsLoves.length > 0 && <>
                            <View style={s.scrollHeader}>
                                <MaterialIcons name='people' size={24} color={colors.text} />
                                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Loved by Friends</Text>
                            </View>
                            <ScrollView horizontal contentContainerStyle={{
                                padding: 20, paddingTop: 10, paddingBottom: 10, columnGap: 10
                            }} showsHorizontalScrollIndicator={false}>
                                {friendsLoves?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                            </ScrollView>
                        </>}

                        {friendsProjects.length > 0 && <>
                            <View style={s.scrollHeader}>
                                <MaterialIcons name='people' size={24} color={colors.text} />
                                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Created by Friends</Text>
                            </View>
                            <ScrollView horizontal contentContainerStyle={{
                                padding: 20, paddingTop: 10, paddingBottom: 10, columnGap: 10
                            }} showsHorizontalScrollIndicator={false}>
                                {friendsProjects?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                            </ScrollView>
                        </>}

                        {exploreData?.topLoved?.length > 0 && <>
                            <View style={s.scrollHeader}>
                                <MaterialIcons name='favorite' size={24} color={colors.text} />
                                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Top Loved</Text>
                            </View>
                            <ScrollView horizontal contentContainerStyle={{
                                padding: 20, paddingTop: 10, paddingBottom: 10, columnGap: 10
                            }} showsHorizontalScrollIndicator={false}>
                                {exploreData?.topLoved?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                            </ScrollView>
                        </>}

                        {exploreData?.featuredStudios?.length > 0 && <>
                            <View style={s.scrollHeader}>
                                <MaterialIcons name='photo-filter' size={24} color={colors.text} />
                                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Featured Studios</Text>
                            </View>
                            <ScrollView horizontal contentContainerStyle={{
                                padding: 20, paddingTop: 10, paddingBottom: 10, columnGap: 10
                            }} showsHorizontalScrollIndicator={false}>
                                {exploreData?.featuredStudios?.map((item, index) => (<StudioCard key={index} studio={item} />))}
                            </ScrollView>
                        </>}

                        {exploreData?.topRemixed?.length > 0 && <>
                            <View style={s.scrollHeader}>
                                <MaterialIcons name='sync' size={24} color={colors.text} />
                                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Top Remixed</Text>
                            </View>
                            <ScrollView horizontal contentContainerStyle={{
                                padding: 20, paddingTop: 10, paddingBottom: 10, columnGap: 10
                            }} showsHorizontalScrollIndicator={false}>
                                {exploreData?.topRemixed?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                            </ScrollView>
                        </>}

                        {exploreData?.newest?.length > 0 && <>
                            <View style={s.scrollHeader}>
                                <MaterialIcons name='more-time' size={24} color={colors.text} />
                                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Newest</Text>
                            </View>
                            <ScrollView horizontal contentContainerStyle={{
                                padding: 20, paddingTop: 10, paddingBottom: 10, columnGap: 10
                            }} showsHorizontalScrollIndicator={false}>
                                {exploreData?.newest?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                            </ScrollView>
                        </>}
                    </Animated.View>
                </ScrollView>
            </GestureDetector>
        </View>
    );
}
