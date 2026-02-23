import { ReactNode, useEffect, useRef, useState } from "react";
import ItchyText from "../components/ItchyText";
import { Dimensions, Platform, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useTheme } from "../utils/theme";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
// @ts-expect-error
import Pressable from "../components/Pressable";
import onboarding from "../assets/onboarding/onboarding";
import { Ionicons } from "@expo/vector-icons";
import { useMMKVBoolean } from "react-native-mmkv";
import { router, useNavigation } from "expo-router";
import { GlassView } from "expo-glass-effect";

const data = [
  {
    key: 0,
    title: "Welcome to Itchy",
    description:
      "Itchy is a Scratch client for Android and iOS, designed to provide a seamless experience for Scratch users on mobile devices.",
    imgSrc: onboarding.welcome,
  },
  {
    key: 1,
    title: "What's Happening",
    description:
      "Get the latest updates from your friends on Scratch right on your phone, without having to deal with the desktop Scratch UI.",
    imgSrc: onboarding.feed,
  },
  {
    key: 2,
    title: "Messages",
    description:
      "Check your messages, reply to comments, and stay connected in the smoothest way possible.",
    imgSrc: onboarding.messages,
  },
  {
    key: 3,
    title: "TurboWarp",
    description:
      "Say goodbye to laggy Scratch projects with built-in TurboWarp, featuring faster loading times and 60FPS performance.",
    imgSrc: onboarding.turbowarp,
  },
  {
    key: 4,
    title: "Custom Controls",
    description:
      "For the first time ever, play keyboard-controlled Scratch games on mobile with custom controls that work seamlessly.",
    imgSrc: onboarding.controller,
  },
  {
    key: 5,
    title: "Search",
    description:
      "Easily find projects, studios, and even users with our enhanced search engine.",
    imgSrc: onboarding.search,
  },
  {
    key: 6,
    title: "Profiles",
    description:
      "Visit your friends' profiles, check out their projects, and follow users, all in a mobile-friendly format.",
    imgSrc: onboarding.accounts,
  },
  {
    key: 7,
    title: "Security",
    description:
      "Itchy communicates directly with the official Scratch website uses, so your account data stays secure.",
    imgSrc: onboarding.security,
  },
];
const { width, height } = Dimensions.get("screen");

export default function Onboarding({}) {
  const nav = useNavigation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const carouselRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue(0);
  const [hasOpenedBefore, setHasOpenedBefore] =
    useMMKVBoolean("hasOpenedBefore");
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Update isAtEnd whenever progress changes
  const handleProgressChange = (
    offsetProgress: number,
    absoluteProgress: number
  ) => {
    // Ensure progress is exactly at the last index when we're at the end
    if (absoluteProgress >= data.length - 1) {
      progress.value = data.length - 1;
      setIsAtEnd(true);
    } else {
      progress.value = absoluteProgress;
      setIsAtEnd(false);
    }
  };

  useEffect(() => {
    const listener = nav.addListener("beforeRemove", (e) => {
      if (e.data.action.type === "GO_BACK") {
        e.preventDefault();
      }
    });

    return () => {
      nav.removeListener("beforeRemove", listener);
    };
  }, []);

  const onPressPagination = (index: number) => {
    // Remove the manual isAtEnd setting - let handleProgressChange handle it
    carouselRef.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    });
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0082ff", position: "relative" }}
      collapsable={false}
    >
      <Carousel
        ref={carouselRef}
        width={width}
        height={height}
        data={data}
        onProgressChange={handleProgressChange}
        loop={false}
        renderItem={({ item }) => (
          <View
            style={{
              flex: 1,
              borderWidth: 0,
              justifyContent: "center",
            }}
          >
            <Image
              source={item.imgSrc}
              style={{
                height: width * 0.6,
                width: width * 0.6,
                marginHorizontal: "auto",
              }}
            />
            <ItchyText
              style={{
                textAlign: "center",
                fontSize: 30,
                fontWeight: "bold",
                color: "#fff",
              }}
            >
              {item.title}
            </ItchyText>
            <ItchyText
              style={{
                textAlign: "center",
                fontSize: 16,
                color: "#fff",
                marginTop: 10,
                paddingHorizontal: 36,
                marginBottom: 70,
              }}
            >
              {item.description}
            </ItchyText>
          </View>
        )}
      />
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 80,
          width: "100%",
        }}
      >
        <Pressable
          onPress={() => {
            if (isAtEnd) {
              setHasOpenedBefore(true);
              router.dismissTo("(tabs)");
            } else {
              // Move to the next slide
              onPressPagination(Math.floor(progress.value) + 1);
            }
          }}
          android_ripple={{
            color: "#ffffff80",
            borderless: true,
            foreground: true,
            radius: 28,
          }}
          style={{ margin: "auto" }}
        >
          <GlassView
            isInteractive={true}
            style={{
              backgroundColor: Platform.OS == "ios" ? undefined : "#f4a935",
              padding: 10,
              borderRadius: 100,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              outlineColor: Platform.OS == "ios" ? undefined : "#d68a1a",
              outlineStyle: "solid",
              outlineWidth: Platform.OS == "ios" ? 0 : 1.5,
              boxShadow:
                Platform.OS == "ios"
                  ? undefined
                  : "0px 2px 4px 0px #ffffff22 inset, 0px 2px 0px 0px #f9c56a inset",
            }}
          >
            <Ionicons
              name={isAtEnd ? "checkmark" : "arrow-forward"}
              size={36}
              color="white"
            />
          </GlassView>
        </Pressable>
      </View>
    </View>
  );
}
