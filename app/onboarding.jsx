import { useEffect, useRef, useState } from "react";
import { Dimensions, Text, useWindowDimensions, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useTheme } from "../utils/theme";
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Pressable from "../components/Pressable";
import onboarding from "../assets/onboarding/onboarding";
import { MaterialIcons } from "@expo/vector-icons";
import { useMMKVBoolean } from "react-native-mmkv";
import { router, useNavigation } from "expo-router";

const data = [{
    key: 1,
    title: "Welcome to Itchy",
    description: "Itchy is a Scratch client for Android and iOS, designed to provide a seamless experience for Scratch users on mobile devices.",
    imgSrc: onboarding.welcome,
}, {
    key: 2,
    title: "What's Happening",
    description: "Get the latest updates from your friends on Scratch right on your phone, without having to deal with the desktop Scratch UI.",
    imgSrc: onboarding.feed,
}, {
    key: 3,
    title: "Messages",
    description: "Check your messages, reply to comments, and stay connected in the smoothest way possible.",
    imgSrc: onboarding.messages,
}, {
    key: 4,
    title: "TurboWarp",
    description: "Say goodbye to laggy Scratch projects with built-in TurboWarp, featuring faster loading times and 60FPS performance.",
    imgSrc: onboarding.turbowarp,
}, {
    key: 5,
    title: "Custom Controls",
    description: "For the first time ever, play keyboard-controlled Scratch games on mobile with custom controls that work seamlessly.",
    imgSrc: onboarding.controller,
}, {
    key: 6,
    title: "Search",
    description: "Easily find projects, studios, and even users with our enhanced search engine.",
    imgSrc: onboarding.search,
}, {
    key: 7,
    title: "Profiles",
    description: "Visit your friends' profiles, check out their projects, and follow users, all in a mobile-friendly format.",
    imgSrc: onboarding.accounts,
},
];
const { width, height } = Dimensions.get("screen")

export default function Onboarding({ }) {
    const nav = useNavigation();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const carouselRef = useRef(null);
    const progress = useSharedValue(0);
    const [hasOpenedBefore, setHasOpenedBefore] = useMMKVBoolean("hasOpenedBeforeDev");
    const [isAtEnd, setIsAtEnd] = useState(false);

    // Update isAtEnd whenever progress changes
    const handleProgressChange = (offsetProgress, absoluteProgress) => {
        progress.value = absoluteProgress;
        // If the progress is at or past the last slide, set isAtEnd to true
        setIsAtEnd(Math.round(absoluteProgress) >= data.length - 1);
    };

    useEffect(() => {
        const listener = nav.addListener('beforeRemove', (e) => {
            if (e.data.action.type === "GO_BACK") {
                e.preventDefault();
            }
        });

        return () => {
            nav.removeListener('beforeRemove', listener);
        };
    }, []);

    const onPressPagination = (index) => {
        if (index == data.length - 1) {
            setIsAtEnd(true);
        } else {
            setIsAtEnd(false);
        }
        carouselRef.current?.scrollTo({
            /**
             * Calculate the difference between the current index and the target index
             * to ensure that the carousel scrolls to the nearest index
             */
            count: index - progress.value,
            animated: true,
        });
    };

    return <View style={{ flex: 1, backgroundColor: "#0082ff", position: "relative" }}>
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
                        style={{ height: width * 0.6, width: width * 0.6, marginHorizontal: "auto" }}
                    />
                    <Text style={{ textAlign: "center", fontSize: 30, fontWeight: "bold", color: "#fff" }}>{item.title}</Text>
                    <Text style={{ textAlign: "center", fontSize: 16, color: "#fff", marginTop: 10, paddingHorizontal: 36, marginBottom: 70 }}>{item.description}</Text>
                </View>
            )}
        />
        <Pagination.Basic
            progress={progress}
            data={data}
            dotStyle={{ backgroundColor: "white", borderRadius: 50 }}
            activeDotStyle={{ backgroundColor: colors.accent, width: 20, height: 6, borderRadius: 3 }}
            containerStyle={{ gap: 20, marginTop: 10, position: "absolute", bottom: insets.bottom + 20 }}
            onPress={onPressPagination}
        />
        <View style={{ position: "absolute", bottom: insets.bottom + 80, width: "100%" }}>
            <Pressable onPress={() => {
                if (isAtEnd) {
                    setHasOpenedBefore(true);
                    router.dismissTo("(tabs)");
                } else {
                    // Move to the next slide
                    onPressPagination(Math.floor(progress.value) + 1);
                }
            }} android_ripple={{ color: "#ffffff80", borderless: true, foreground: true, radius: 28 }} style={{ margin: "auto" }}>
                <View style={{
                    backgroundColor: "#f4a935",
                    padding: 10,
                    borderRadius: 100,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    // Shadow for iOS
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    // Shadow for Android
                    elevation: 5
                }} >
                    <MaterialIcons name={isAtEnd ? "check" : "play-arrow"} size={36} color="white" />
                </View>
            </Pressable>
        </View>
    </View>;
};