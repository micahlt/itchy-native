const REFRESH_TRIGGER_HEIGHT = 50;
const MAX_PULL_HEIGHT = 75;

import { getCrashlytics, log } from '@react-native-firebase/crashlytics';
import { Platform, View, Animated, Easing } from "react-native";
import * as Haptics from "expo-haptics";
import ScratchAPIWrapper from "../../utils/api-wrapper";
import {
  Gesture,
  GestureDetector,
  ScrollView,
  TouchableOpacity,
} from "react-native-gesture-handler";
import { useTheme } from "../../utils/theme";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  useMMKVBoolean,
  useMMKVObject,
  useMMKVString,
} from "react-native-mmkv";
import Feed from "../../components/Feed";
import SignInPrompt from "../../components/SignInPrompt";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StudioCard from "../../components/StudioCard";
import { Redirect, router, useFocusEffect } from "expo-router";
import HorizontalContentScroller from "../../components/HorizontalContentScroller";
import ItchyText from "../../components/ItchyText";
import { Ionicons } from "@expo/vector-icons";
import useSWR, { mutate as swrMutate } from "swr";
import TexturedButton from "../../components/TexturedButton";
import SquircleView from '../../components/SquircleView';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedView = Animated.createAnimatedComponent(SquircleView);

const c = getCrashlytics();

const Header = memo(({ insets, colors, headerStyle, logoStyle, username }) => (
  <Animated.View
    collapsable={false}
    style={[
      headerStyle,
      {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: insets.top + 5,
        paddingBottom: 15,
        paddingHorizontal: 20,
        gap: 10,
      },
    ]}
  >
    <TouchableOpacity onPress={() => router.push(`/multiplay`)}>
      <Ionicons
        name="radio"
        style={{ marginLeft: 7 }}
        size={26}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
    <Animated.Image
      source={require("../../assets/logo-nobg.png")}
      style={[logoStyle, { height: 65, width: 65 }]}
    />
    <TouchableOpacity onPress={() => router.push("/settings")} onLongPress={() => router.push(`/users/${username}`)}>
      <Ionicons
        style={{ marginRight: 7 }}
        name="settings"
        size={26}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  </Animated.View>
));

// Memoized studios section
const FeaturedStudios = memo(({ studios, colors }) => (
  <>
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        paddingBottom: 10,
        paddingTop: 5,
        gap: 10,
      }}
    >
      <Ionicons name="bookmarks" size={24} color={colors.text} />
      <ItchyText
        style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}
      >
        Featured Studios
      </ItchyText>
    </View>
    <ScrollView
      horizontal
      contentContainerStyle={{
        padding: 20,
        paddingTop: 10,
        paddingBottom: 10,
        columnGap: 10,
      }}
      showsHorizontalScrollIndicator={false}
    >
      {studios.map((item, index) => (
        <StudioCard key={`studio-${item.id || index}`} studio={item} />
      ))}
    </ScrollView>
  </>
));

export default function HomeScreen() {
  const { colors, dimensions } = useTheme();
  const [hasOpenedBefore, setHasOpenedBefore] =
    useMMKVBoolean("hasOpenedBefore");
  const [user] = useMMKVObject("user");
  const [username] = useMMKVString("username");
  const [token] = useMMKVString("token");
  const [experimentalFeed] = useMMKVBoolean("experimentalFeed");
  const insets = useSafeAreaInsets();

  const scrollRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const panPosition = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  // Refs for mutable values that don't need to trigger re-renders
  const isAtTop = useRef(true);
  const didVibrate = useRef(false);
  const rotationPaused = useRef(false);
  const panPositionValue = useRef(0);

  // Listener to keep track of panPosition value for logic
  useEffect(() => {
    const id = panPosition.addListener(({ value }) => {
      panPositionValue.current = value;
    });
    return () => panPosition.removeListener(id);
  }, []);

  // SWR data fetching for explore data
  const {
    data: exploreData,
    isLoading: exploreLoading,
    mutate: refreshExplore,
  } = useSWR("explore", async () => {
    try {
      log(c, "Fetching explore data");
      const result = await ScratchAPIWrapper.explore.getExplore();
      log(c, "Successfully fetched explore data");
      return result;
    } catch (error) {
      log(c, "Failed to fetch explore data");
      recordError(c, error);
      throw error;
    }
  }, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // SWR for friends data
  const { data: friendsLoves = [], mutate: refreshFriendsLoves } = useSWR(
    username && token ? ["friendsLoves", username, token] : null,
    async () => {
      try {
        log(c, "Fetching friends loved projects");
        const result = await ScratchAPIWrapper.explore.getFriendsLoves(username, token);
        log(c, `Successfully fetched ${result.length} friends loved projects`);
        return result;
      } catch (error) {
        log(c, "Failed to fetch friends loved projects");
        recordError(c, error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { data: friendsProjects = [], mutate: refreshFriendsProjects } = useSWR(
    username && token ? ["friendsProjects", username, token] : null,
    async () => {
      try {
        log(c, "Fetching friends created projects");
        const result = await ScratchAPIWrapper.explore.getFriendsProjects(username, token);
        log(c, `Successfully fetched ${result.length} friends created projects`);
        return result;
      } catch (error) {
        log(c, "Failed to fetch friends created projects");
        recordError(c, error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Simple refresh function using SWR mutate
  const refresh = useCallback(() => {
    try {
      log(c, "User initiated pull to refresh");
      rotationPaused.current = false;

      // Start rotation
      rotate.setValue(0);
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Refresh all data sources
      refreshExplore();
      refreshFriendsLoves();
      refreshFriendsProjects();
      // Refresh feed using SWR's global mutate
      if (username && token) {
        swrMutate(['feed', username, token]);
      }

      log(c, "Successfully triggered data refresh");

      // Stop rotation after a delay
      setTimeout(() => {
        rotationPaused.current = true;
        rotate.stopAnimation();
        rotate.setValue(0);
      }, 2000);
    } catch (error) {
      log(c, "Error during refresh operation");
      recordError(c, error);
    }
  }, [refreshExplore, refreshFriendsLoves, refreshFriendsProjects]);

  // Memoize vib function to prevent recreations
  const vib = useCallback((length) => {
    try {
      log(c, `Triggering haptic feedback: ${length}`);
      if (length === "tick") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      } else if (length === "long") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      }
    } catch (error) {
      log(c, "Error triggering haptic feedback");
      recordError(c, error);
    }
  }, []);

  useEffect(() => {
    try {
      log(c, "Initializing home screen animations and data loading");

      // Start initial rotation, data loads automatically via SWR
      refresh();
      log(c, "Home screen initialization completed");
      return () => {
        log(c, "Cleaning up home screen animations");
        rotationPaused.current = true;
        rotate.stopAnimation();
        rotate.setValue(0);
        panPosition.setValue(0);
      };
    } catch (error) {
      log(c, "Error during home screen initialization");
      recordError(c, error);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (!!scrollRef?.current) {
      scrollRef?.current.scrollTo({ x: 0, y: 0, animated: false });
    }
  }, [scrollRef]));

  const headerStyle = {
    transform: [
      {
        translateY: scrollY,
      },
    ],
  };

  const logoStyle = {
    transform: [
      {
        translateY: Platform.OS === "ios"
          ? panPosition.interpolate({ inputRange: [0, 1000], outputRange: [0, 2000] }) // * 2
          : panPosition.interpolate({ inputRange: [0, 1000], outputRange: [0, 500] }) // / 2
      },
      {
        scale: panPosition.interpolate({
          inputRange: [0, MAX_PULL_HEIGHT],
          outputRange: [1, 1 + MAX_PULL_HEIGHT / 100],
          extrapolate: 'clamp'
        })
      },
      {
        rotate: rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        })
      },
    ],
  };

  const contentStyle = {
    transform: [{ translateY: panPosition }],
  };

  // Memoize pan gesture to prevent recreations
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .simultaneousWithExternalGesture(scrollRef)
        .runOnJS(true)
        .onUpdate((e) => {
          if (isAtTop.current && e.translationY > 0) {
            const newPan = e.translationY * 0.18 +
              0.5 *
              (1 -
                Math.min(e.translationY, MAX_PULL_HEIGHT) / MAX_PULL_HEIGHT);

            panPosition.setValue(newPan);

            if (Math.floor(newPan) % 18 == 0) vib("tick");
            if (newPan > REFRESH_TRIGGER_HEIGHT) {
              if (!didVibrate.current) {
                vib("long");
                didVibrate.current = true;
              }
            }
          }
        })
        .onEnd((e) => {
          didVibrate.current = false;
          if (isAtTop.current && panPositionValue.current > REFRESH_TRIGGER_HEIGHT) {
            vib("long");
            refresh();
          }
          Animated.spring(panPosition, {
            toValue: 0,
            friction: 6,
            tension: 30,
            useNativeDriver: true
          }).start();
        }),
    [vib, refresh]
  );

  // Memoize scroll handlers
  const onScrollBeginDrag = useCallback((e) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    isAtTop.current = offsetY <= 0;
  }, []);

  const onScroll = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (e) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        isAtTop.current = offsetY <= 0;
      }
    }
  ), [scrollY]);

  // Memoize content style object
  const containerStyle = useMemo(
    () => ({
      paddingBottom: Platform.OS == "ios" ? 60 : insets.bottom + 20,
      paddingTop: 10,
      marginLeft: 0, marginRight: 0,
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
      borderTopWidth: 2,
      borderTopColor: colors.background,
      flex: 1,
      overflow: "visible",
    }),
    [colors, insets.bottom, dimensions]
  );

  return (
    <View style={{ backgroundColor: colors.accentTransparent }} collapsable={false}>
      {!hasOpenedBefore ? <Redirect href="/onboarding" /> : <></>}
      <GestureDetector gesture={panGesture}>
        <AnimatedScrollView
          collapsable={false}
          ref={scrollRef}
          scrollEventThrottle={16}
          onScrollBeginDrag={onScrollBeginDrag}
          onScroll={onScroll}
          showsVerticalScrollIndicator={false}
        >
          <Header
            insets={insets}
            colors={colors}
            headerStyle={headerStyle}
            logoStyle={logoStyle}
            username={username}
          />
          <AnimatedView
            style={[{
              boxShadow:
                "0px -2px 16px rgba(0,94,185,0.15), 0px 6px 8px 0px #ffffff15 inset, 0px 3px 0px 0px #FFFFFF11 inset",
            }, contentStyle, containerStyle]}
            collapsable={false}
          >
            {!!username ? <Feed style={{ margin: 20 }} username={username} /> : <SignInPrompt />}
            {exploreData?.featured?.length > 0 ? (
              <HorizontalContentScroller
                title="Featured Projects"
                data={exploreData.featured}
                iconName="sparkles"
                headerStyle={{ marginTop: 10 }}
              />
            ) : <></>}

            {friendsLoves.length > 0 ? (
              <HorizontalContentScroller
                title="Friends Loved"
                data={friendsLoves}
                iconName="people"
              />
            ) : <></>}

            {friendsProjects.length > 0 ? (
              <HorizontalContentScroller
                title="Created by Friends"
                data={friendsProjects}
                iconName="people"
              />
            ) : <></>}

            {exploreData?.topLoved?.length > 0 ? (
              <HorizontalContentScroller
                title="Top Loved"
                data={exploreData.topLoved}
                iconName="heart"
              />
            ) : <></>}

            {exploreData?.featuredStudios?.length > 0 ? (
              <FeaturedStudios
                studios={exploreData.featuredStudios}
                colors={colors}
              />
            ) : <></>}

            {exploreData?.topRemixed?.length > 0 ? (
              <HorizontalContentScroller
                title="Top Remixed"
                data={exploreData.topRemixed}
                iconName="sync"
              />
            ) : <></>}

            {exploreData?.newest?.length > 0 ? (
              <HorizontalContentScroller
                title="Newest Projects"
                data={exploreData.newest}
                iconName="time"
              />
            ) : <></>}
            <View style={{ marginTop: 10 }}></View>
            {experimentalFeed ? <TexturedButton
              onPress={() => router.push("scroll")}
              icon="globe"
              iconSide="left"
              style={{ margin: "auto" }}
              size={18}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ItchyText style={{ color: colors.text }}>
                  Explore more{" "}
                </ItchyText>
                <View
                  style={{
                    backgroundColor: colors.accent,
                    paddingHorizontal: 5,
                    borderRadius: 10,
                    marginLeft: 5,
                  }}
                >
                  <ItchyText
                    style={{
                      color: "#fff",
                      fontSize: 12,
                      lineHeight: 20,
                      fontWeight: "bold",
                    }}
                  >
                    BETA
                  </ItchyText>
                </View>
              </View>
            </TexturedButton> : <></>}
          </AnimatedView>
        </AnimatedScrollView>
      </GestureDetector>
    </View>
  );
}
