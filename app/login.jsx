import { Pressable, Text, TextInput, View } from 'react-native';
import ScratchAPIWrapper from '../utils/api-wrapper';
import { useTheme } from '../utils/theme';
import { useState } from 'react';
import Card from '../components/Card';
import storage from '../utils/storage';
import { useMMKVObject } from 'react-native-mmkv';
import { router } from 'expo-router';

export default function LoginScreen() {
    const { colors } = useTheme();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [user, setUser] = useMMKVObject("user");

    const logIn = () => {
        ScratchAPIWrapper.auth.login(username, password).then((d) => {
            storage.set("token", d.token);
            storage.set("csrfToken", d.csrfToken);
            storage.set("username", d.username);
            setUser(d.sessionJSON.user);
            router.push("/");
        }).catch((e) => {
            setError(e.message);
            console.error(e);
        });
    };

    return (
        <View style={{ backgroundColor: colors.background }}>
            <Card style={{ padding: 20, margin: 20 }}>
                <TextInput placeholder="Username" style={{ backgroundColor: colors.backgroundSecondary, color: colors.text, padding: 10, margin: 10, borderBottomColor: colors.text, borderBottomWidth: 1 }} underlineColorAndroid={colors.text} placeholderTextColor={colors.textSecondary} onChangeText={(t) => setUsername(t)} value={username} />
                <TextInput placeholder="Password" style={{ backgroundColor: colors.backgroundSecondary, color: colors.text, padding: 10, margin: 10, borderBottomColor: colors.text, borderBottomWidth: 1 }} underlineColorAndroid={colors.text} placeholderTextColor={colors.textSecondary} secureTextEntry={true} onChangeText={(t) => setPassword(t)} value={password} />
                <View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: colors.accent, margin: 10, elevation: 2 }}>
                    <Pressable onPress={() => logIn()} style={{ padding: 10 }} android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}>
                        <Text style={{ color: colors.text, textAlign: "center", fontWeight: "bold" }}>Log In</Text>
                    </Pressable>
                </View>
                {error && <Text style={{ color: "#f85a5a", textAlign: "center", fontSize: 16, marginBottom: 5 }}>{error}</Text>}
                <Text style={{ color: colors.text, textAlign: "center", opacity: 0.5, fontSize: 12 }}>Your username and password will be sent directly to Scratch's servers and not shared with any third parties.</Text>
            </Card>
        </View>
    );
}