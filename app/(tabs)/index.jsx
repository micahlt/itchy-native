import { RefreshControl, ScrollView, Text, View } from 'react-native';
import ScratchAPIWrapper from '../../utils/api-wrapper';
import { useTheme } from '../../utils/theme';
import { useEffect, useState } from 'react';
import ProjectCard from '../../components/ProjectCard';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMMKVString } from 'react-native-mmkv';
import Feed from '../../components/Feed';
import SignInPrompt from '../../components/SignInPrompt';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const { colors, isDark } = useTheme();
    const [exploreData, setExploreData] = useState(null);
    const [friendsLoves, setFriendsLoves] = useState([]);
    const [friendsProjects, setFriendsProjects] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [username] = useMMKVString("username");
    const [token] = useMMKVString("token");

    useEffect(() => {
        load()
    }, []);

    const load = async () => {
        const d = await ScratchAPIWrapper.explore.getExplore();
        setExploreData(d);
        if (username) {
            const l = await ScratchAPIWrapper.explore.getFriendsLoves(username, token);
            setFriendsLoves(l);
            const p = await ScratchAPIWrapper.explore.getFriendsProjects(username, token);
            setFriendsProjects(p);
        }
    }

    const refresh = () => {
        setIsRefreshing(true);
        load();
        setIsRefreshing(false);
    }

    return (
        <SafeAreaView style={{ backgroundColor: colors.background, flex: 1, paddingBottom: 50 }}>
            <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} progressBackgroundColor={colors.accent} colors={isDark ? ["black"] : ["white"]} />}>
                <>
                    {!!username ? <Feed style={{ margin: 20, marginBottom: 0 }} username={username} /> : <SignInPrompt />}
                    <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 0, gap: 10 }}>
                        <MaterialIcons name='workspace-premium' size={24} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Featured</Text>
                    </View>
                    <ScrollView horizontal contentContainerStyle={{
                        padding: 20, paddingTop: 10, paddingBottom: 0, columnGap: 10
                    }} showsHorizontalScrollIndicator={false}>
                        {exploreData?.featured?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                    </ScrollView>
                </>

                {friendsLoves.length > 0 && <>
                    <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 0, gap: 10 }}>
                        <MaterialIcons name='people' size={24} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Loved by Friends</Text>
                    </View>
                    <ScrollView horizontal contentContainerStyle={{
                        padding: 20, paddingTop: 10, paddingBottom: 0, columnGap: 10
                    }} showsHorizontalScrollIndicator={false}>
                        {friendsLoves?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                    </ScrollView>
                </>}

                {friendsProjects.length > 0 && <>
                    <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 0, gap: 10 }}>
                        <MaterialIcons name='people' size={24} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Created by Friends</Text>
                    </View>
                    <ScrollView horizontal contentContainerStyle={{
                        padding: 20, paddingTop: 10, paddingBottom: 0, columnGap: 10
                    }} showsHorizontalScrollIndicator={false}>
                        {friendsProjects?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                    </ScrollView>
                </>}

                <>
                    <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 0, gap: 10 }}>
                        <MaterialIcons name='favorite' size={24} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Top Loved</Text>
                    </View>
                    <ScrollView horizontal contentContainerStyle={{
                        padding: 20, paddingTop: 10, paddingBottom: 0, columnGap: 10
                    }} showsHorizontalScrollIndicator={false}>
                        {exploreData?.topLoved?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                    </ScrollView>
                </>

                <>
                    <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 0, gap: 10 }}>
                        <MaterialIcons name='sync' size={24} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Top Remixed</Text>
                    </View>
                    <ScrollView horizontal contentContainerStyle={{
                        padding: 20, paddingTop: 10, paddingBottom: 0, columnGap: 10
                    }} showsHorizontalScrollIndicator={false}>
                        {exploreData?.topRemixed?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                    </ScrollView>
                </>

                <>
                    <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 0, gap: 10 }}>
                        <MaterialIcons name='more-time' size={24} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Newest</Text>
                    </View>
                    <ScrollView horizontal contentContainerStyle={{
                        padding: 20, paddingTop: 10, columnGap: 10
                    }} showsHorizontalScrollIndicator={false}>
                        {exploreData?.newest?.map((item, index) => (<ProjectCard key={index} project={item} />))}
                    </ScrollView>
                </>
            </ScrollView>
        </SafeAreaView>
    );
}