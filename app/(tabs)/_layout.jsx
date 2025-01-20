import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { useTheme } from '../../utils/theme';
import { StatusBar } from 'react-native';
import { useEffect, useState } from 'react';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { useMMKVString } from 'react-native-mmkv';

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
                        tabBarIcon: ({ color }) => <MaterialIcons size={28} name="public" color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="search"
                    options={{
                        title: 'Search',
                        tabBarIcon: ({ color }) => <MaterialIcons size={28} name="search" color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="messages"
                    options={{
                        title: 'Messages',
                        tabBarIcon: ({ color }) => <MaterialIcons size={28} name="email" color={color} />,
                        tabBarBadge: messageCount > 0 ? messageCount : undefined,
                        tabBarBadgeStyle: { backgroundColor: colors.accent, color: "white", fontSize: 9, fontWeight: "bold", transform: [{ translateX: 5 }], padding: 0 }
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: 'Settings',
                        tabBarIcon: ({ color }) => <MaterialIcons size={28} name="settings" color={color} />,
                    }}
                />
            </Tabs>
        </>
    );
}
