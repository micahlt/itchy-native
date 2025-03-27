import React, { useEffect, useState } from 'react';
import Stack from 'expo-router/stack';
import { ThemeProvider } from '../utils/theme';
import { useColorScheme, View } from 'react-native';
import { darkColors, lightColors } from '../utils/theme/colors';
import { useMMKVObject } from 'react-native-mmkv';
import { MaterialIcons } from '@expo/vector-icons';

export default function App() {
    const theme = useColorScheme();
    const [colors, setColors] = useState(null);
    const [twConfig, setTWConfig] = useMMKVObject("twConfig");
    useEffect(() => {
        setColors(theme === "dark" ? darkColors : lightColors);
        if (!twConfig) {
            setTWConfig({});
        }
    }, [theme]);

    if (!!colors) {
        return (
            <ThemeProvider>
                <View style={{ backgroundColor: colors.background, flex: 1 }}>
                    <Stack screenOptions={{
                        contentStyle: {
                            backgroundColor: colors.background,
                            color: colors.text
                        },
                        headerShown: true,
                        headerBackButtonDisplayMode: "default",
                        headerStyle: {
                            backgroundColor: colors.background,
                        },
                        headerTitleStyle: {
                            color: colors.text,
                            fontWeight: "bold"
                        },
                        headerTintColor: colors.text
                    }} >
                        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "default" }} />
                        <Stack.Screen name="projects/[id]/index" options={{
                            presentation: "modal",
                            animation: "fade_from_bottom",
                            headerRight: () =>
                                <MaterialIcons name='question-answer' size={24} color={colors.textSecondary} />
                        }} />
                        <Stack.Screen name="projects/[id]/comments" options={{
                            presentation: "modal",
                            animation: "fade_from_bottom"
                        }} />
                        <Stack.Screen name="studios/[id]/index" options={{
                            presentation: "modal",
                            animation: "fade_from_bottom",
                            headerRight: () =>
                                <MaterialIcons name='launch' size={24} color={colors.textSecondary} />
                        }} />
                        <Stack.Screen name="studios/[id]/comments" options={{
                            presentation: "modal",
                            animation: "fade_from_bottom"
                        }} />
                        <Stack.Screen name="users/[username]/index" options={{
                            presentation: "modal",
                            animation: "fade_from_bottom",
                            headerRight: () =>
                                <MaterialIcons name='launch' size={24} color={colors.textSecondary} />
                        }} />
                        <Stack.Screen name="users/[username]/about" options={{
                            presentation: "modal",
                            animation: "fade_from_bottom",
                        }} />
                        <Stack.Screen name="users/[username]/comments" options={{
                            presentation: "modal",
                            animation: "fade_from_bottom",
                        }} />
                        <Stack.Screen name="feed" options={{
                            presentation: "modal",
                            animation: "fade_from_bottom",
                            headerTitle: "What's Happening"
                        }} />
                        <Stack.Screen name="login" options={{
                            presentation: "modal",
                            animation: "fade_from_bottom",
                            title: "Log In"
                        }} />
                        <Stack.Screen name="error" options={{
                            presentation: "modal",
                            animation: "fade",
                            title: "Error"
                        }} />
                    </Stack>
                </View>
            </ThemeProvider >
        );
    }
}