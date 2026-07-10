import { useTheme } from '../../utils/theme';
import { useEffect, useState } from 'react';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { useMMKVString } from 'react-native-mmkv';
import { VectorIcon, withLayoutContext } from "expo-router";
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { SystemBars } from "react-native-edge-to-edge"
import { getCrashlytics, log, recordError } from '@react-native-firebase/crashlytics';
import Ionicons from '@react-native-vector-icons/ionicons/static';

const c = getCrashlytics();

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

            <NativeTabs
                tabBarActiveTintColor={colors.accent}
                activeIndicatorColor={colors.accentTransparent}
                ignoresTopSafeArea={false}
                tabBarStyle={{
                    backgroundColor: colors.backgroundSecondary,
                }}
                disableTransparentOnScrollEdge={true}
                sidebarAdaptable={false}
                translucent={true}
                backgroundColor={colors.backgroundSecondary}

            >
                <NativeTabs.Trigger name="index" contentStyle={{
                    backgroundColor: colors.background
                }}>
                    <NativeTabs.Trigger.Icon renderingMode="template" src={<VectorIcon family={Ionicons} name="earth" />} />
                    <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="search" contentStyle={{
                    backgroundColor: colors.background
                }}>
                    <NativeTabs.Trigger.Icon renderingMode="template" src={<VectorIcon family={Ionicons} name="search" />} />
                    <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="messages" contentStyle={{
                    backgroundColor: colors.background
                }}>
                    <NativeTabs.Trigger.Icon renderingMode="template" src={<VectorIcon family={Ionicons} name="mail" />}></NativeTabs.Trigger.Icon>
                    <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
                    <NativeTabs.Trigger.Badge hidden={messageCount < 1 ? true : false}>{messageCount}</NativeTabs.Trigger.Badge>
                </NativeTabs.Trigger>
            </NativeTabs >
        </>
    );
}
