const REFRESH_TRIGGER_HEIGHT = 50;
const MAX_PULL_HEIGHT = 75;
const ITCHY_FEATURED_STUDIO_ID = 51280014;
import {
  getCrashlytics,
  log,
  recordError,
} from "@react-native-firebase/crashlytics";
import { Platform, View, Insets } from "react-native";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing as ReanimatedEasing,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import ScratchAPIWrapper from "../../utils/api-wrapper";
import {
  Gesture,
  GestureDetector,
  ScrollView,
  TouchableOpacity,
  FlatList,
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
import SquircleView from "../../components/SquircleView";
import { Studio } from "../../utils/api-wrapper/types/studio";
import { ItchyThemeColors } from "../../utils/theme/colors";
import { useIsTablet } from "utils/hooks/useIsTablet";
import { IPADOS_TOPBAR_HEIGHT } from "utils/magicNumbers";
import { isiOS18Plus, isLiquidPlus } from "utils/platformUtils";

const AnimatedScrollView = Reanimated.createAnimatedComponent(ScrollView);
const AnimatedView = Reanimated.createAnimatedComponent(SquircleView);

const c = getCrashlytics();

const Header = memo(
  ({
    insets,
    colors,
    headerStyle,
    logoStyle,
    username,
  }: {
    insets: Insets;
    colors: ItchyThemeColors;
    headerStyle: any;
    logoStyle: any;
    username: string;
  }) => (
    <Reanimated.View
      collapsable={false}
      style={[
        headerStyle,
        {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          paddingTop: (insets?.top || 0) + 5,
          paddingBottom: 15,
          paddingHorizontal: 20,
          gap: 10,
        },
      ]}
    >
      <TouchableOpacity onPress={() => router.push(`/multiplay`)}>
        <Ionicons
          name="radio"
          style={{ marginLeft: 7, marginTop: 20 }}
          size={26}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      <Reanimated.Image
        source={require("../../assets/logo-transparent.png")}
        style={[logoStyle, { height: 65, width: 65 }]}
      />
      <TouchableOpacity
        onPress={() => router.push("/settings")}
        onLongPress={() => router.push(`/users/${username}`)}
      >
        <Ionicons
          style={{ marginRight: 7, marginTop: 20 }}
          name="settings"
          size={26}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </Reanimated.View>
  ),
);

// Memoized studios section
const FeaturedStudios = memo(
  ({ studios, colors }: { studios: Studio[]; colors: ItchyThemeColors }) => (
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
      <FlatList
        horizontal
        data={studios}
        keyExtractor={(item, index) => `studio-${item.id || index}`}
        renderItem={({ item }) => <StudioCard studio={item} />}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 10,
          paddingBottom: 10,
          gap: 10,
        }}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={3}
        windowSize={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews={true}
      />
    </>
  ),
);

export default function HomeScreen() {
  const { colors, dimensions } = useTheme();
  const [hasOpenedBefore] = useMMKVBoolean("hasOpenedBefore");
  const [username] = useMMKVString("username");
  const [token] = useMMKVString("token");
  const insets = useSafeAreaInsets();
  const isTablet = useIsTablet();
  const iPadOSTopMargin = useMemo(() => {
    if (Platform.OS === "ios" && isTablet && isiOS18Plus()) {
      return insets.top + 10;
    } else {
      return 0;
    }
  }, [insets, isTablet, Platform]);

  const scrollRef = useRef<ScrollView | null>(null);
  const scrollY = useSharedValue(0);
  const panPosition = useSharedValue(0);
  const rotate = useSharedValue(0);

  // Shared values for worklets
  const isAtTop = useSharedValue(true);
  const didVibrate = useSharedValue(false);
  const rotationPaused = useRef(false);

  // SWR data fetching for explore data
  const {
    data: exploreData,
    isLoading: exploreLoading,
    mutate: refreshExplore,
  } = useSWR(
    "explore",
    async () => {
      try {
        log(c, "Fetching explore data");
        const result = await ScratchAPIWrapper.explore.getExplore();
        log(c, "Successfully fetched explore data");
        return result;
      } catch (error) {
        log(c, "Failed to fetch explore data");
        recordError(c, error as Error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const {
    data: itchyFeaturedData,
    isLoading: itchyFeaturedLoading,
    mutate: refreshItchyFeatured,
  } = useSWR(
    "itchy-featured",
    async () => {
      try {
        log(c, "Fetching Itchy Featured data");
        const result = await ScratchAPIWrapper.studio.getProjects(
          ITCHY_FEATURED_STUDIO_ID,
        );
        log(c, "Successfully fetched Itchy Featured data");
        return result;
      } catch (error) {
        log(c, "Failed to fetch Itchy Featured data");
        recordError(c, error as Error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // SWR for friends data
  const { data: friendsLoves = [], mutate: refreshFriendsLoves } = useSWR(
    username && token ? ["friendsLoves", username, token] : null,
    async () => {
      try {
        if (!username || !token) return false;
        log(c, "Fetching friends loved projects");
        const result = await ScratchAPIWrapper.explore.getFriendsLoves(
          username,
          token,
        );
        log(c, `Successfully fetched ${result.length} friends loved projects`);
        return result;
      } catch (error) {
        log(c, "Failed to fetch friends loved projects");
        recordError(c, error as Error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const { data: friendsProjects = [], mutate: refreshFriendsProjects } = useSWR(
    username && token ? ["friendsProjects", username, token] : null,
    async () => {
      try {
        if (!username || !token) return false;
        log(c, "Fetching friends created projects");
        const result = await ScratchAPIWrapper.explore.getFriendsProjects(
          username,
          token,
        );
        log(
          c,
          `Successfully fetched ${result.length} friends created projects`,
        );
        return result;
      } catch (error) {
        log(c, "Failed to fetch friends created projects");
        recordError(c, error as Error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Simple refresh function using SWR mutate
  const refresh = useCallback(() => {
    try {
      log(c, "User initiated pull to refresh");
      rotationPaused.current = false;

      // Start rotation
      rotate.value = 0;
      rotate.value = withRepeat(
        withTiming(1, {
          duration: 1000,
          easing: ReanimatedEasing.linear,
        }),
        -1,
        false,
      );

      // Refresh all data sources
      refreshExplore();
      refreshFriendsLoves();
      refreshFriendsProjects();
      refreshItchyFeatured();
      // Refresh feed using SWR's global mutate
      if (username && token) {
        swrMutate(["feed", username, token]);
      }

      log(c, "Successfully triggered data refresh");

      // Stop rotation after a delay
      setTimeout(() => {
        rotationPaused.current = true;
        rotate.value = 0;
      }, 2000);
    } catch (error) {
      log(c, "Error during refresh operation");
      recordError(c, error as Error);
    }
  }, [
    refreshExplore,
    refreshFriendsLoves,
    refreshFriendsProjects,
    refreshItchyFeatured,
  ]);

  // Memoize vib function to prevent recreations
  const vib = useCallback((length: "tick" | "long") => {
    try {
      log(c, `Triggering haptic feedback: ${length}`);
      if (length === "tick") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      } else if (length === "long") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      }
    } catch (error) {
      log(c, "Error triggering haptic feedback");
      recordError(c, error as Error);
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
        rotate.value = 0;
        panPosition.value = 0;
      };
    } catch (error) {
      log(c, "Error during home screen initialization");
      recordError(c, error as Error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!!scrollRef?.current) {
        scrollRef?.current.scrollTo({ x: 0, y: 0, animated: false });
      }
    }, [scrollRef]),
  );

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scrollY.value }],
    };
  });

  const logoStyle = useAnimatedStyle(() => {
    const translateY =
      Platform.OS === "ios"
        ? interpolate(panPosition.value, [0, 1000], [0, 2000])
        : interpolate(panPosition.value, [0, 1000], [0, 500]);
    const scale = interpolate(
      panPosition.value,
      [0, MAX_PULL_HEIGHT],
      [1, 1 + MAX_PULL_HEIGHT / 100],
      Extrapolation.CLAMP,
    );
    const rotateDeg = interpolate(rotate.value, [0, 1], [0, 360]);

    return {
      transform: [{ translateY }, { scale }, { rotate: `${rotateDeg}deg` }],
      marginTop: iPadOSTopMargin,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: panPosition.value }],
    };
  });

  // Memoize pan gesture to prevent recreations
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        // @ts-ignore
        .simultaneousWithExternalGesture(scrollRef)
        .onUpdate((e) => {
          if (isAtTop.value && e.translationY > 0) {
            const newPan =
              e.translationY * 0.18 +
              0.5 *
                (1 -
                  Math.min(e.translationY, MAX_PULL_HEIGHT) / MAX_PULL_HEIGHT);

            panPosition.value = newPan;

            if (Math.floor(newPan) % 18 == 0) scheduleOnRN(vib, "tick");
            if (newPan > REFRESH_TRIGGER_HEIGHT) {
              if (!didVibrate.value) {
                scheduleOnRN(vib, "long");
                didVibrate.value = true;
              }
            }
          }
        })
        .onEnd((e) => {
          didVibrate.value = false;
          if (isAtTop.value && panPosition.value > REFRESH_TRIGGER_HEIGHT) {
            scheduleOnRN(vib, "long");
            scheduleOnRN(refresh);
          }
          panPosition.value = withSpring(0, {
            damping: 10,
            stiffness: 100,
            mass: 0.5,
          });
        }),
    [vib, refresh],
  );

  // Memoize scroll handlers
  const onScrollBeginDrag = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      isAtTop.value = offsetY <= 0;
    },
    [],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      isAtTop.value = event.contentOffset.y <= 0;
    },
  });

  // Memoize content style object
  const containerStyle = useMemo(
    () => ({
      paddingBottom: Platform.OS == "ios" ? 60 : insets.bottom + 20,
      paddingTop: 10,
      marginLeft: 0,
      marginRight: 0,
      backgroundColor: colors.background,
      marginTop: 0,
      marginHorizontal: 1.5,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      outlineColor: colors.outlineCard,
      outlineStyle: "solid" as const,
      outlineWidth: dimensions.outlineWidth,
      borderWidth: 0.1,
      borderColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.background,
      flex: 1,
      overflow: "visible" as const,
    }),
    [colors, insets.bottom, dimensions],
  );

  return (
    <View
      style={{ backgroundColor: colors.accentTransparent }}
      collapsable={false}
    >
      {!hasOpenedBefore ? <Redirect href="/onboarding" /> : <></>}
      <GestureDetector gesture={panGesture}>
        <AnimatedScrollView
          collapsable={false}
          ref={scrollRef}
          scrollEventThrottle={16}
          onScrollBeginDrag={onScrollBeginDrag}
          onScroll={scrollHandler}
          showsVerticalScrollIndicator={false}
        >
          <Header
            insets={insets}
            colors={colors}
            headerStyle={headerStyle}
            logoStyle={logoStyle}
            username={username || ""}
          />
          <AnimatedView
            style={[
              {
                boxShadow:
                  "0px -2px 16px rgba(0,94,185,0.15), 0px 6px 8px 0px #ffffff15 inset, 0px 3px 0px 0px #FFFFFF11 inset",
              },
              contentStyle,
              containerStyle,
            ]}
            collapsable={false}
          >
            {!!username ? (
              // @ts-ignore
              <Feed style={{ margin: 20 }} username={username} />
            ) : (
              <SignInPrompt />
            )}
            {exploreData?.featured?.length ? (
              <HorizontalContentScroller
                title="Featured Projects"
                data={exploreData.featured}
                iconName="sparkles"
                headerStyle={{ marginTop: 10 }}
              />
            ) : (
              <></>
            )}

            {friendsLoves.length > 0 ? (
              <HorizontalContentScroller
                title="Friends Loved"
                data={friendsLoves}
                iconName="people"
              />
            ) : (
              <></>
            )}

            {friendsProjects.length > 0 ? (
              <HorizontalContentScroller
                title="Created by Friends"
                data={friendsProjects}
                iconName="people"
              />
            ) : (
              <></>
            )}

            {itchyFeaturedData?.length ? (
              <HorizontalContentScroller
                title="Featured by Itchy"
                data={itchyFeaturedData}
                iconName="checkbox"
                onShowMore={() => {
                  router.push(`/studios/${ITCHY_FEATURED_STUDIO_ID}/projects`);
                  return true;
                }}
              />
            ) : (
              <></>
            )}

            {exploreData?.topLoved?.length ? (
              <HorizontalContentScroller
                title="Top Loved"
                data={exploreData.topLoved}
                iconName="heart"
              />
            ) : (
              <></>
            )}

            {exploreData?.featuredStudios?.length ? (
              <FeaturedStudios
                studios={exploreData.featuredStudios}
                colors={colors}
              />
            ) : (
              <></>
            )}

            {exploreData?.topRemixed?.length ? (
              <HorizontalContentScroller
                title="Top Remixed"
                data={exploreData.topRemixed}
                iconName="sync"
              />
            ) : (
              <></>
            )}

            {exploreData?.newest?.length ? (
              <HorizontalContentScroller
                title="Newest Projects"
                data={exploreData.newest}
                iconName="time"
              />
            ) : (
              <></>
            )}
            <View style={{ marginTop: 10 }}></View>
          </AnimatedView>
        </AnimatedScrollView>
      </GestureDetector>
    </View>
  );
}
