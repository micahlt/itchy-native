import { useTheme } from '../../utils/theme';
import { useEffect, useState } from 'react';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { useMMKVString } from 'react-native-mmkv';
import { withLayoutContext } from "expo-router";
import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { SystemBars } from "react-native-edge-to-edge"
import { getCrashlytics, log, recordError } from '@react-native-firebase/crashlytics';

const c = getCrashlytics();

export const Tabs = withLayoutContext(
    createNativeBottomTabNavigator().Navigator
);

export default function TabLayout() {
    const { colors, isDark } = useTheme();
    const [messageCount, setMessageCount] = useState(0);
    const [username] = useMMKVString("username");

    useEffect(() => {
        log(c, "Tab layout rendered")
        if (!username) {
            log(c, "User is not logged in")
            return;
        }
        log(c, "Fetching message count for authenticated user")
        ScratchAPIWrapper.messages.getMessageCount(username).then((d) => {
            setMessageCount(d);
        }).catch((error) => {
            log(c, "Failed to get message count for authenticated user")
            recordError(c, error);
        })
    }, [username]);

    return (
        <>
            <SystemBars style={isDark ? "light" : "dark"} backgroundColor={colors.background} />

            <Tabs
                tabBarActiveTintColor={colors.accent}
                activeIndicatorColor={colors.accentTransparent}
                ignoresTopSafeArea={true}
                tabBarStyle={{
                    backgroundColor: colors.backgroundSecondary
                }}
                screenOptions={{
                    headerShown: false,
                    // ensure the tab bar does not hide or shift when keyboard opens
                    tabBarHideOnKeyboard: false,
                }}
                sidebarAdaptable={true}
                translucent={false}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Explore',
                        tabBarIcon: () => require("../../assets/icons/explore.png"),
                    }}
                />
                <Tabs.Screen
                    name="search"
                    options={{
                        title: 'Search',
                        tabBarIcon: () => require("../../assets/icons/search.png"),

                    }}
                />
                <Tabs.Screen
                    name="messages"
                    options={{
                        title: 'Messages',
                        tabBarIcon: () => require("../../assets/icons/messages.png"),
                        tabBarBadge: String(messageCount > 0 ? messageCount : ""),
                        sceneStyle: { backgroundColor: "green" }
                    }}
                />
            </Tabs>
        </>
    );
}
