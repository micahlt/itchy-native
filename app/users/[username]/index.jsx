import { View, useWindowDimensions, ScrollView } from "react-native";
import ItchyText from "../../../components/ItchyText";
import Pressable from "../../../components/Pressable";
import { useTheme } from "../../../utils/theme";
import { Stack } from "expo-router/stack";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScratchAPIWrapper from "../../../utils/api-wrapper";
import ProjectCard from "../../../components/ProjectCard";
import { Image } from "expo-image";
import approximateNumber from "approximate-number";
import linkWithFallback from "../../../utils/linkWithFallback";
import { useMMKVString } from "react-native-mmkv";
import HorizontalContentScroller from "../../../components/HorizontalContentScroller";
import TexturedButton from "../../../components/TexturedButton";
import { getLiquidPlusPadding } from "../../../utils/platformUtils";
import PressableIcon from "../../../components/PressableIcon";
import { useIsTablet } from "../../../utils/hooks/useIsTablet";
import Card from "../../../components/Card";
import LinkifiedText from "../../../utils/regex/LinkifiedText";
import timeago from "time-ago";
import { flag } from "country-emoji";
import { dimensions } from "utils/theme/dimensions";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function User() {
  const { username } = useLocalSearchParams();
  const [myUsername] = useMMKVString("username");
  const [csrfToken] = useMMKVString("csrfToken");
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = useIsTablet();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState(null);
  const [favorites, setFavorites] = useState(null);
  const [curatedStudios, setCuratedStudios] = useState(null);
  const [followingStatus, setFollowingStatus] = useState(undefined);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!!loading) return;
    setLoading(true);
    ScratchAPIWrapper.user
      .getCompleteProfile(username)
      .then((d) => {
        setProfile(d);
      })
      .catch(console.error);
    ScratchAPIWrapper.user
      .amIFollowing(username)
      .then((d) => {
        setFollowingStatus(d);
      })
      .catch(console.error);
    ScratchAPIWrapper.user
      .getProjects(username)
      .then((d) => {
        setProjects(d);
      })
      .catch(console.error);
    ScratchAPIWrapper.user
      .getFavorites(username)
      .then((d) => {
        setFavorites(d);
      })
      .catch(console.error);
    ScratchAPIWrapper.user
      .getCuratedStudios(username)
      .then((d) => {
        setCuratedStudios(d);
      })
      .catch(console.error);
  };

  const profileStats = useMemo(() => {
    let stats = {};
    if (!profile) return stats;
    if (profile.followers === -1) stats.followers = "∞";
    else stats.followers = approximateNumber(profile.followers);
    if (profile.following === -1) stats.following = "∞";
    else stats.following = approximateNumber(profile.following);
    return stats;
  }, [profile]);

  useEffect(() => {
    if (!loading) return;
    if (!!profile && !!projects && !!favorites) {
      setLoading(false);
    }
  }, [profile, projects, favorites]);

  useEffect(() => {
    load();
  }, [username]);

  const openProfile = () => {
    linkWithFallback(
      `https://scratch.mit.edu/users/${username}`,
      colors.accent,
    );
  };

  const changeFollowingStatus = () => {
    if (followingStatus === undefined) return;
    if (followingStatus === true) {
      ScratchAPIWrapper.user
        .unfollow(username, myUsername, csrfToken)
        .then(() => {
          setFollowingStatus(!followingStatus);
        })
        .catch(console.error);
    } else {
      ScratchAPIWrapper.user
        .follow(username, myUsername, csrfToken)
        .then(() => {
          setFollowingStatus(!followingStatus);
        })
        .catch(console.error);
    }
  };

  const renderStats = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        flex: 1,
      }}
    >
      <Pressable
        style={{ alignItems: "center" }}
        onPress={() => router.push(`users/${username}/followers`)}
        android_ripple={{
          color: colors.ripple,
          borderless: false,
          foreground: true,
        }}
      >
        <ItchyText
          style={{
            color: colors.accent,
            fontWeight: "bold",
            fontSize: isTablet ? 30 : 20,
          }}
        >
          {profileStats?.followers?.toUpperCase()}
        </ItchyText>
        <ItchyText style={{ color: colors.text, fontSize: 12 }}>
          Followers
        </ItchyText>
      </Pressable>
      <Pressable
        style={{ alignItems: "center" }}
        onPress={() => router.push(`users/${username}/following`)}
        android_ripple={{
          color: colors.ripple,
          borderless: false,
          foreground: true,
        }}
      >
        <ItchyText
          style={{
            color: colors.accent,
            fontWeight: "bold",
            fontSize: isTablet ? 30 : 20,
          }}
        >
          {profileStats?.following}
        </ItchyText>
        <ItchyText style={{ color: colors.text, fontSize: 12 }}>
          Following
        </ItchyText>
      </Pressable>
      <View style={{ alignItems: "center" }}>
        <ItchyText
          style={{
            color: colors.accent,
            fontWeight: "bold",
            fontSize: isTablet ? 30 : 20,
          }}
        >
          {new Date(profile.history.joined).getFullYear()}
        </ItchyText>
        <ItchyText style={{ color: colors.text, fontSize: 12 }}>
          Joined{" "}
        </ItchyText>
      </View>
    </View>
  );

  const renderButtons = ({ style } = { style: {} }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: isTablet ? 15 : 15,
        columnGap: 10,
        paddingHorizontal: isTablet ? 0 : 20,
        ...style,
      }}
    >
      {myUsername === username ? (
        <TexturedButton
          size={11}
          style={{ flex: 1 }}
          onPress={() => router.push(`/users/${username}/edit`)}
        >
          Edit Profile
        </TexturedButton>
      ) : null}
      {followingStatus !== undefined ? (
        <TexturedButton
          size={11}
          style={{ flex: 1 }}
          onPress={changeFollowingStatus}
        >
          {followingStatus === true ? "Unfollow" : "Follow"}
        </TexturedButton>
      ) : null}
      {!isTablet && (
        <TexturedButton
          size={11}
          style={{ flex: 1 }}
          onPress={() => router.push(`/users/${username}/about`)}
        >
          About
        </TexturedButton>
      )}
      <TexturedButton
        size={11}
        style={{ flex: 1 }}
        onPress={() => router.push(`/users/${username}/activity`)}
      >
        Activity
      </TexturedButton>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: username,
          headerRight: () => (
            <>
              <PressableIcon
                onPress={() => router.push(`/users/${username}/comments`)}
                name="chatbubble-ellipses"
                size={22}
                color={colors.textSecondary}
                backgroundColor="transparent"
                style={{
                  paddingLeft: 10,
                  paddingVertical: 0,
                }}
              />
              <PressableIcon
                onPress={openProfile}
                name="open"
                size={24}
                color={colors.textSecondary}
                backgroundColor="transparent"
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 0,
                }}
              />
            </>
          ),
        }}
      />

      <ScrollView
        // refreshControl={
        //   <RefreshControl
        //     refreshing={loading}
        //     onRefresh={load}
        //     progressBackgroundColor={colors.accent}
        //     colors={isDark ? ["black"] : ["white"]}
        //   />
        // }
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
        contentContainerStyle={{
          paddingTop: getLiquidPlusPadding(),
          paddingBottom: 100,
        }}
      >
        {!!profile ? (
          <>
            {!isTablet && (
              <Animated.View
                entering={FadeInDown.delay(0).springify()}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 20,
                  paddingBottom: 0,
                }}
              >
                <Image
                  source={{ uri: profile.profile.images["90x90"] }}
                  placeholder={require("../../../assets/avatar.png")}
                  placeholderContentFit="cover"
                  style={{
                    height: 75,
                    width: 75,
                    borderRadius: 75,
                    marginRight: 25,
                    backgroundColor: "white",
                  }}
                />
                {renderStats()}
              </Animated.View>
            )}
            {!isTablet && (
              <Animated.View entering={FadeInDown.delay(50).springify()}>
                {renderButtons()}
              </Animated.View>
            )}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={{
                flexDirection: isTablet ? "row" : "column",
                paddingHorizontal: isTablet ? 20 : 0,
              }}
            >
              {isTablet && (
                <View style={{ flex: 1, paddingRight: 20 }}>
                  <View style={{ marginBottom: 10, padding: 16 }}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Image
                        source={{ uri: profile.profile.images["90x90"] }}
                        placeholder={require("../../../assets/avatar.png")}
                        placeholderContentFit="cover"
                        style={{
                          height: 90,
                          width: 90,
                          borderRadius: dimensions.mediumRadius,
                          marginRight: 15,
                          backgroundColor: "white",
                        }}
                      />
                      {renderStats()}
                    </View>
                  </View>
                  {renderButtons({ style: { marginTop: 0 } })}
                  {profile.profile.bio ? (
                    <Card style={{ marginBottom: 10, padding: 16 }}>
                      <ItchyText
                        style={{
                          fontWeight: "bold",
                          color: colors.accent,
                          fontSize: 16,
                          marginBottom: 10,
                        }}
                      >
                        About Me
                      </ItchyText>
                      <LinkifiedText
                        style={{ color: colors.text }}
                        text={profile.profile.bio}
                      />
                    </Card>
                  ) : null}
                  {profile.profile.status ? (
                    <Card style={{ marginBottom: 10, padding: 16 }}>
                      <ItchyText
                        style={{
                          fontWeight: "bold",
                          color: colors.accent,
                          fontSize: 16,
                          marginBottom: 10,
                        }}
                      >
                        What I'm Working On
                      </ItchyText>
                      <LinkifiedText
                        style={{ color: colors.text }}
                        text={profile.profile.status}
                      />
                    </Card>
                  ) : null}
                  <Card style={{ marginBottom: 10, padding: 16 }}>
                    <ItchyText style={{ color: colors.text }}>
                      Joined{" "}
                      <ItchyText style={{ fontWeight: "bold" }}>
                        {timeago.ago(profile.history.joined)}
                      </ItchyText>{" "}
                      | from{" "}
                      <ItchyText style={{ fontWeight: "bold" }}>
                        {profile.profile.country}{" "}
                        {flag(profile.profile.country)}
                      </ItchyText>
                    </ItchyText>
                  </Card>
                </View>
              )}
              <View style={{ flex: isTablet ? 1 : undefined }}>
                {profile.featuredProject ? (
                  <ProjectCard
                    project={profile.featuredProject}
                    width={isTablet ? (width - 60) / 2 : width - 40}
                    style={{ margin: "auto", marginTop: 0 }}
                  />
                ) : null}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <HorizontalContentScroller
                title="Created Projects"
                data={projects}
                iconName="sparkles"
                headerStyle={{ marginTop: 16 }}
                onShowMore={() => router.push(`/users/${username}/projects`)}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <HorizontalContentScroller
                title="Favorites"
                data={favorites}
                iconName="star"
                headerStyle={{ marginTop: 5 }}
                onShowMore={() => router.push(`/users/${username}/favorites`)}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).springify()}>
              <HorizontalContentScroller
                title="Curated Studios"
                data={curatedStudios}
                itemType="studios"
                iconName="albums"
                headerStyle={{ marginTop: 5 }}
                onShowMore={() => router.push(`/users/${username}/studios`)}
              />
            </Animated.View>
          </>
        ) : (
          <></>
        )}
      </ScrollView>
    </>
  );
}
