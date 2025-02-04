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

            <Tabs tabBarActiveTintColor={colors.accent} activeIndicatorColor={colors.accentTransparent} tabBarStyle={{
                backgroundColor: colors.backgroundSecondary
            }} screenOptions={{
                headerShown: false
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
                        tabBarBadge: String(messageCount > 0 ? messageCount : ""),
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
