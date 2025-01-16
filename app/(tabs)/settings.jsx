import { Linking, Pressable, Text, TouchableOpacity, View } from 'react-native';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { useTheme } from '../../utils/theme';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { version } from "../../package.json";
import { useMMKVString } from 'react-native-mmkv';
import storage from '../../utils/storage';

export default function SettingsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [username, setUsername] = useMMKVString("username");
    useEffect(() => {
    }, []);
    return (
        <View style={{ backgroundColor: colors.background, flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 24, padding: 10 }}>Settings</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, padding: 10 }}>Account</Text>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: username ? 0 : 0.5, borderTopWidth: 0.5 }}>
                <Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>{username ? `Signed in as ${username}` : "Signed out"}</Text>
                <View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: colors.accent, elevation: 5, marginRight: 10, }}>
                    <Pressable onPress={() => {
                        if (username) {
                            storage.clearAll();
                        } else {
                            router.push("/login");
                        }
                    }} style={{ paddingVertical: 5, paddingHorizontal: 10 }} android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}>
                        <Text style={{ color: "white", fontWeight: 'bold', fontSize: 12 }}>{username ? "LOG OUT" : "LOG IN"}</Text>
                    </Pressable>
                </View>
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: "flex-start", alignItems: 'center', borderColor: colors.backgroundTertiary, borderTopWidth: 0.5, borderBottomWidth: 0.5 }}>
                <TouchableOpacity onPress={() => router.push(`/user/${username}/profile`)}><Text style={{ color: colors.accent, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>Open your profile</Text>
                </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, padding: 10, marginTop: 10 }}>About</Text>
            <View style={{ backgroundColor: colors.backgroundSecondary, borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5, borderTopWidth: 0.5 }}>
                <Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15, paddingHorizontal: 10 }}>Itchy v{version}</Text>
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: "flex-start", alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5 }}>
                <TouchableOpacity onPress={() => Linking.openURL("https://itchy.micahlindley.com/privacy.html")}><Text style={{ color: colors.accent, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>Privacy Policy</Text>
                </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: colors.backgroundSecondary, flexDirection: 'row', justifyContent: "flex-start", alignItems: 'center', borderColor: colors.backgroundTertiary, borderBottomWidth: 0.5, }}>
                <Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15, paddingLeft: 10 }}>Made </Text><TouchableOpacity onPress={() => Linking.openURL("https://github.com/micahlt")}><Text style={{ color: colors.accent, fontSize: 16 }}>open source</Text></TouchableOpacity><Text style={{ color: colors.text, fontSize: 16, paddingVertical: 15 }}> with ❤️</Text>
            </View>
        </View>
    );
}