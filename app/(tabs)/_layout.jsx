import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { useTheme } from '../../utils/theme';
import { StatusBar } from 'react-native';
import { useEffect } from 'react';

export default function TabLayout() {
    const { colors } = useTheme();
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
                }
            }}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Explore',
                        tabBarIcon: ({ color }) => <MaterialIcons size={28} name="public" color={color} />,
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
