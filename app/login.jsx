import { Text, TextInput, View } from 'react-native';
import Pressable from '../components/Pressable';
import ScratchAPIWrapper from '../utils/api-wrapper';
import { useTheme } from '../utils/theme';
import { useRef, useState } from 'react';
import Card from '../components/Card';
import storage from '../utils/storage';
import { useMMKVObject } from 'react-native-mmkv';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import encryptedStorage from '../utils/encryptedStorage';

export default function LoginScreen() {
    const { colors } = useTheme();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [user, setUser] = useMMKVObject("user");
    const [savedLogins, setSavedLogins] = useMMKVObject("savedLogins", encryptedStorage);
    const passwordInput = useRef(null);

    const logIn = () => {
        ScratchAPIWrapper.auth.login(username, password).then((d) => {
            storage.set("sessionID", d.sessionToken)
            storage.set("csrfToken", d.csrfToken);
            storage.set("username", d.username);
            storage.set("cookieSet", d.cookieSet);
            storage.set("token", d.sessionJSON.user.token);
            setSavedLogins((prev) => {
                const newLogins = [...(prev || []), { username, password }];
                return newLogins;
            });
            setUser(d.sessionJSON.user);
            router.dismissTo("/");
        }).catch((e) => {
            setError(e.message);
            console.error(e);
        });
    };

    return (
        <View style={{ backgroundColor: colors.background }}>
            <Card style={{ padding: 20, margin: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: "center", alignItems: "center", gap: 20, marginVertical: 20 }}>
                    <Image source={require("../assets/logo.webp")} style={{ width: 65, height: 65, alignSelf: "center", borderRadius: 65 }} />
                    <MaterialIcons name='arrow-forward' size={45} color={"dimgray"} />
                    <Image source={require("../assets/avatar2.png")} style={{ width: 65, height: 65, alignSelf: "center", borderRadius: 65 }} />
                </View>
                <TextInput placeholder="Username" style={{ backgroundColor: colors.backgroundSecondary, color: colors.text, padding: 10, margin: 10, borderBottomColor: "silver", borderBottomWidth: 1 }} underlineColorAndroid={colors.text} placeholderTextColor={colors.textSecondary} onChangeText={(t) => setUsername(t)} value={username} importantForAutofill='yes' autoComplete="username" autoCapitalize="none" autoCorrect={false} autoFocus={true} returnKeyType="next" onSubmitEditing={() => passwordInput?.current?.focus()} submitBehavior="submit" />
                <TextInput placeholder="Password" ref={passwordInput} style={{ backgroundColor: colors.backgroundSecondary, color: colors.text, padding: 10, margin: 10, borderBottomColor: "silver", borderBottomWidth: 1 }} underlineColorAndroid={colors.text} placeholderTextColor={colors.textSecondary} secureTextEntry={true} onChangeText={(t) => setPassword(t)} value={password} importantForAutofill='yes' autoComplete="password" autoCapitalize="none" autoCorrect={false} onSubmitEditing={() => logIn()} />
                <View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: colors.accent, margin: 10, elevation: 2 }}>
                    <Pressable onPress={() => logIn()} style={{ padding: 10 }} android_ripple={{ color: colors.ripple, borderless: false, foreground: true }}>
                        <Text style={{ color: colors.text, textAlign: "center", fontWeight: "bold", color: "white" }}>Log In</Text>
                    </Pressable>
                </View>
                {error && <Text style={{ color: "#f85a5a", textAlign: "center", fontSize: 16, marginBottom: 5 }}>{error}</Text>}
                <Text style={{ color: colors.text, textAlign: "center", opacity: 0.5, fontSize: 12 }}>Your username and password will be sent directly to Scratch's servers and not shared with any third parties.</Text>
            </Card>
        </View>
    );
}