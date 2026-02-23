import {
  getCrashlytics,
  log,
  recordError,
} from "@react-native-firebase/crashlytics";
import React, { useEffect, useMemo } from "react";
import Stack from "expo-router/stack";
import { ThemeProvider, useTheme } from "../utils/theme";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useMMKVBoolean,
  useMMKVNumber,
  useMMKVObject,
  useMMKVString,
} from "react-native-mmkv";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import APIAuth from "../utils/api-wrapper/auth";
import storage from "../utils/storage";
import encryptedStorage from "../utils/encryptedStorage";
import { router, usePathname } from "expo-router";
import { SWRConfig } from "swr";
import * as Network from "expo-network";
import { isLiquidPlus } from "../utils/platformUtils";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// @ts-expect-error
import Pressable from "../components/Pressable";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedReaction,
} from "react-native-reanimated";
import { FullWindowOverlay } from "react-native-screens";
import { GlassView } from "expo-glass-effect";

const c = getCrashlytics();

interface TurboWarpConfig {
  interpolate?: boolean;
  autoplay?: boolean;
  fps60?: boolean;
  hqPen?: boolean;
  turbo?: boolean;
}

interface SavedLogin {
  username: string;
  password: string;
}

interface UserData {
  id: number;
  username: string;
  token: string;
  [key: string]: any;
}

export default function App() {
  const [twConfig] = useMMKVObject<TurboWarpConfig>("twConfig");
  const [user, setUser] = useMMKVObject<UserData | null>("user");
  const [cookieSet] = useMMKVString("cookieSet");
  const [localControllerMappings, setLocalControllerMappings] = useMMKVObject<
    Record<string, any>
  >("localControllerMappings");
  const [savedLogins] = useMMKVObject<SavedLogin[]>(
    "savedLogins",
    encryptedStorage
  );

  // Check network connectivity when app opens
  useEffect(() => {
    const checkNetworkConnectivity = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected || !networkState.isInternetReachable) {
          router.replace(
            "/error?errorText=You appear to be offline. Please check your internet connection and try again."
          );
        }
      } catch (error) {
        console.warn("Failed to check network state:", error);
        log(c, "Failed initial network connection test");
        recordError(c, error as Error);
      }
    };

    checkNetworkConnectivity();
  }, []);

  useEffect(() => {
    log(c, "Clearing image cache");
    Image.clearDiskCache();
    if (!!user) {
      APIAuth.getSession(cookieSet)
        .then((d) => {
          if (
            !!d?.sessionToken &&
            !!d?.csrfToken &&
            !!d?.sessionJSON &&
            !!d?.sessionJSON?.user
          ) {
            log(c, "Authenticating with existing cookies");
            storage.set("sessionID", d.sessionToken);
            storage.set("csrfToken", d.csrfToken);
            storage.set("cookieSet", d.cookieSet);
            storage.set("token", d.sessionJSON.user.token);
            setUser(d.sessionJSON.user);
          }
          if (!d.isLoggedIn) {
            log(c, "Removing existing user auth data");
            storage.delete("sessionID");
            storage.delete("csrfToken");
            storage.delete("cookieSet");
            storage.delete("token");
            storage.delete("user");
            setUser(null);
            APIAuth.logout().finally(async () => {
              if (!savedLogins) {
                log(c, "Won't log in as there are no saved logins");
                return;
              }
              log(c, "Searching saved logins");
              const currentLogin = savedLogins.find(
                (o) => o.username === storage.getString("username")
              );
              if (!currentLogin) {
                log(
                  c,
                  "Current login uname and password do not exist.  Staying logged out"
                );
                return;
              }
              log(c, "Attempting to log in with details from saved passwords");
              APIAuth.login(currentLogin.username, currentLogin.password)
                .then((d) => {
                  log(c, "Logged in successfully, setting up user data");
                  storage.set("sessionID", d.sessionToken);
                  storage.set("csrfToken", d.csrfToken);
                  storage.set("username", d.username || "");
                  storage.set("cookieSet", d.cookieSet);
                  storage.set("token", d.sessionJSON.user.token);
                  setUser(d.sessionJSON.user);
                  log(c, "Navigating to index route");
                  router.dismissTo("/");
                })
                .catch((e) => {
                  log(c, "Login with saved info failed.  Staying logged out");
                  storage.delete("username");
                });
            });
          }
        })
        .catch(() => {
          log(c, "No existing cookies were found.  Logging out completely");
          APIAuth.logout().finally(async () => {
            storage.delete("sessionID");
            storage.delete("csrfToken");
            storage.delete("cookieSet");
            storage.delete("token");
            storage.delete("user");
            if (!savedLogins) {
              log(c, "No saved logins exist");
              return storage.delete("username");
            }
            log(c, "Searching saved logins");
            const currentLogin = savedLogins.find(
              (o) => o.username === storage.getString("username")
            );
            if (!currentLogin) {
              log(
                c,
                "Current login uname and password do not exist.  Staying logged out"
              );
              return storage.delete("username");
            }
            log(c, "Attempting to log in with details from saved passwords");
            APIAuth.login(currentLogin.username, currentLogin.password)
              .then((d) => {
                log(c, "Logged in successfully, setting up user data");
                storage.set("sessionID", d.sessionToken);
                storage.set("csrfToken", d.csrfToken);
                storage.set("username", d.username || "");
                storage.set("cookieSet", d.cookieSet);
                storage.set("token", d.sessionJSON.user.token);
                setUser(d.sessionJSON.user);
                log(c, "Navigating to index route");
                router.dismissTo("/");
              })
              .catch((e) => {
                log(c, "Login with saved info failed.  Staying logged out");
                storage.delete("username");
              });
          });
        });
    } else {
      log(c, "User is not logged in.");
    }
    if (!localControllerMappings) {
      log(c, "Setting up local controller mappings");
      setLocalControllerMappings({});
    }
  }, []);
  return (
    <SWRConfig
      value={{
        dedupingInterval: 2000,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        errorRetryCount: 2,
      }}
    >
      <ThemeProvider>
        <GestureHandlerRootView collapsable={false}>
          <BottomSheetModalProvider>
            {/* Inner component consumes theme after ThemeProvider mounts */}
            <ThemeConsumerInner twConfig={twConfig} />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SWRConfig>
  );
}

interface ThemeConsumerInnerProps {
  twConfig: TurboWarpConfig | undefined;
}

function ThemeConsumerInner({ twConfig }: ThemeConsumerInnerProps) {
  const { colors } = useTheme();
  const liquidPlus = isLiquidPlus();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [commentsHeight] = useMMKVNumber("commentsHeight");
  const [showHomeButton, setShowHomeButton] =
    useMMKVBoolean("globalHomeButton");

  useEffect(() => {
    if (showHomeButton == undefined || showHomeButton == null) {
      setShowHomeButton(true);
    }
  }, [showHomeButton]);

  const shouldHide = useMemo(() => {
    switch (path) {
      case "/":
      case "/login":
      case "/settings":
      case "/multiplay":
      case "/messages":
      case "/search":
      case "/onboarding":
        return true;
      default:
        return !showHomeButton;
    }
  }, [path]);

  const shouldElevate = useMemo(() => {
    if (path.includes("/comments")) {
      return true;
    }
  }, [path]);

  useAnimatedReaction(
    () => shouldHide,
    (shouldHideValue) => {
      translateX.value = withTiming(shouldHideValue ? -100 : 0, {
        duration: 200,
      });
    }
  );

  useAnimatedReaction(
    () => shouldElevate,
    (shouldElevateValue) => {
      translateY.value = withTiming(
        shouldElevateValue ? -(commentsHeight ?? 90) : 0,
        {
          duration: 200,
        }
      );
    }
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // If colors aren't ready yet, render nothing (prevents flash)
  if (!colors) return null;

  return (
    <View
      style={{ backgroundColor: colors.background, flex: 1 }}
      collapsable={false}
    >
      {Platform.OS === "ios" ? (
        <FullWindowOverlay>
          <View
            style={{
              position: "absolute",
              bottom: insets.bottom + 5,
              left: 10,
              zIndex: 100,
            }}
          >
            <Animated.View style={animatedStyle}>
              <GlassView
                isInteractive={true}
                style={{ borderRadius: "100%", overflow: "hidden" }}
              >
                <Pressable
                  onPress={() => router.dismissTo("/")}
                  android_ripple={{
                    color: colors.ripple,
                    foreground: true,
                  }}
                  style={{
                    padding: 20,
                  }}
                >
                  <Ionicons size={20} name="home" color={colors.text} />
                </Pressable>
              </GlassView>
            </Animated.View>
          </View>
        </FullWindowOverlay>
      ) : (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 5,
            left: 10,
            zIndex: 100,
          }}
        >
          <Animated.View
            style={[
              {
                backgroundColor: colors.backgroundSecondary,
                boxShadow:
                  "0px -2px 8px rgba(0,94,185,0.1),0px 5px 6px rgba(0,0,0,0.2), 0px 4px 5px 0px #ffffff15 inset, 0px 3px 0px 0px #FFFFFF11 inset",
                borderRadius: "100%",
                overflow: "hidden",
              },
              animatedStyle,
            ]}
          >
            <Pressable
              onPress={() => router.dismissTo("/")}
              android_ripple={{
                color: colors.ripple,
                foreground: true,
              }}
              style={{
                padding: 20,
              }}
            >
              <Ionicons size={20} name="home" color={colors.text} />
            </Pressable>
          </Animated.View>
        </View>
      )}
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerShown: true,
          headerBackButtonDisplayMode: "default",
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "bold",
          },
          headerTintColor: colors.text,
          // fixes back button artifact for iOS, check how it impacts android
          headerLeft: () => null,
          headerTransparent: liquidPlus,
          headerStyle: {
            backgroundColor: liquidPlus ? "transparent" : colors.background, // no fallback bg
          },
          animationDuration: 120,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, animation: "default" }}
        />
        <Stack.Screen
          name="projects/[id]/index"
          options={{
            animation: "fade_from_bottom",
            headerBackButtonDisplayMode: "minimal",
            headerBackVisible: Platform.OS === "ios",
            headerRight: () => (
              <MaterialIcons
                name="question-answer"
                size={24}
                color={colors.textSecondary}
              />
            ),
          }}
        />
        <Stack.Screen
          name="projects/[id]/comments"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="studios/[id]/index"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
            headerRight: () => (
              <MaterialIcons
                name="launch"
                size={24}
                color={colors.textSecondary}
              />
            ),
          }}
        />
        <Stack.Screen
          name="studios/[id]/comments"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="users/[username]/index"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
            headerRight: () => (
              <MaterialIcons
                name="launch"
                size={24}
                color={colors.textSecondary}
              />
            ),
          }}
        />
        <Stack.Screen
          name="users/[username]/about"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="users/[username]/activity"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="users/[username]/comments"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
          }}
        />
        <Stack.Screen
          name="feed"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
            headerTitle: "What's Happening",
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            animation: "fade_from_bottom",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
            headerTitle: "Settings",
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            presentation: "modal",
            animation: "default",
            headerTitle: "Log In",
          }}
        />
        <Stack.Screen
          name="multiplay"
          options={{
            animation: "fade_from_bottom",
            headerTitle: "MultiPlay",
          }}
        />
        <Stack.Screen
          name="projects/[id]/controls/find"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
            headerTitle: "Find Controller Setups",
          }}
        />
        <Stack.Screen
          name="projects/[id]/controls/config"
          options={{
            presentation: "modal",
            animation: "fade_from_bottom",
            headerTitle: "Controller Config",
          }}
        />
        <Stack.Screen
          name="error"
          options={{
            presentation: "modal",
            animation: "fade",
            headerTitle: "Error",
          }}
        />
      </Stack>
    </View>
  );
}
