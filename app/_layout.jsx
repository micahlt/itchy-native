import React, { useEffect, useState } from 'react';
import Stack from 'expo-router/stack';
import { ThemeProvider } from '../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from '../utils/theme/colors';

export default function App() {
    const theme = useColorScheme();
    const [colors, setColors] = useState(null);
    useEffect(() => {
        setColors(theme === "dark" ? darkColors : lightColors);
    }, [theme]);

    if (!!colors) {
        return (
            <ThemeProvider>
                <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
                    <Stack screenOptions={{
                        contentStyle: {
                            backgroundColor: colors.background,
                            color: colors.text
                        },
                    }} >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="project/[id]" options={{
                            headerShown: true, presentation: "modal", animation: "fade_from_bottom", headerBackButtonDisplayMode: "default", headerStyle: {
                                backgroundColor: colors.background,
                            },
                            headerTitleStyle: {
                                color: colors.text,
                                fontWeight: "bold"
                            },
                            headerTintColor: colors.text,
                        }} />
                        <Stack.Screen name="user/[username]/profile" options={{
                            headerShown: true, presentation: "modal", animation: "fade_from_bottom", headerBackButtonDisplayMode: "default", headerStyle: {
                                backgroundColor: colors.background,
                            },
                            headerTitleStyle: {
                                color: colors.text,
                                fontWeight: "bold"
                            },
                            headerTintColor: colors.text
                        }} />
                        <Stack.Screen name="user/[username]/about" options={{
                            headerShown: true, presentation: "modal", animation: "fade_from_bottom", headerBackButtonDisplayMode: "default", headerStyle: {
                                backgroundColor: colors.background,
                            },
                            headerTitleStyle: {
                                color: colors.text,
                                fontWeight: "bold"
                            },
                            headerTintColor: colors.text
                        }} />
                        <Stack.Screen name="login" options={{
                            headerShown: true, presentation: "modal", animation: "fade_from_bottom", headerBackButtonDisplayMode: "default", headerStyle: {
                                backgroundColor: colors.background,
                            },
                            headerTitleStyle: {
                                color: colors.text,
                                fontWeight: "bold"
                            },
                            headerTintColor: colors.text,
                            title: "Log In"
                        }} />
                    </Stack>
                </SafeAreaView>
            </ThemeProvider >
        );
    }
}