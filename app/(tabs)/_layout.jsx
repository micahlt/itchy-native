import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../utils/theme';
import { StatusBar } from 'react-native';
import { useEffect, useState } from 'react';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { useMMKVString } from 'react-native-mmkv';
import { withLayoutContext } from "expo-router";
import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";

export const Tabs = withLayoutContext(
    createNativeBottomTabNavigator().Navigator
);

export default function TabLayout() {
    const { colors } = useTheme();
    const [messageCount, setMessageCount] = useState(0);
    const [username] = useMMKVString("username");

    useEffect(() => {
        if (!username) return;
        ScratchAPIWrapper.messages.getMessageCount(username).then((d) => {
            setMessageCount(d);
        });
    }, [username]);

    return (
        <>
            <StatusBar style="auto" backgroundColor={colors.background} />

            <Tabs screenOptions={{
                tabBarActiveTintColor: colors.accent, headerShown: false, tabBarStyle: {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: "transparent",
                    height: 60,
                },
                tabBarIconStyle: {
                    marginTop: 4
                },
            }}>
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
                        tabBarBadge: messageCount > 0 ? messageCount : undefined,
                        tabBarBadgeStyle: { backgroundColor: colors.accent, color: "white", fontSize: 9, fontWeight: "bold", transform: [{ translateX: 5 }], padding: 0 }
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: 'Settings',
                        tabBarIcon: () => require("../../assets/icons/settings.png"),
                    }}
                />
            </Tabs>
        </>
    );
}
