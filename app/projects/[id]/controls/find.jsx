import { View, RefreshControl, FlatList, ToastAndroid } from "react-native";
import ItchyText from "../../../../components/ItchyText";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../../utils/theme";
import { TextInput } from "react-native-gesture-handler";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Card from "../../../../components/Card";
import { MaterialIcons } from "@expo/vector-icons";
import { controlOptionToFullName } from "../../../../utils/controlOptions";
import { useMMKVObject } from "react-native-mmkv";
import { TouchableOpacity } from "react-native";

export default function FindControls() {
    const { colors, isDark } = useTheme();
    const { id } = useLocalSearchParams();
    const searchBarRef = useRef(null);
    const [results, setResults] = useState([]);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [localControllerMappings, setLocalControllerMappings] = useMMKVObject("localControllerMappings");
    const [currentMapping, setCurrentMapping] = useMMKVObject("currentMapping");
    const [username] = useMMKVObject("user");

    const setControllerForProject = (item) => {
        // Set the controller for the project
        setCurrentMapping({
            controlOptions: item.controlOptions,
            controls: item.controls
        });
        setLocalControllerMappings((prev) => ({
            ...prev,
            [id]: item.id
        }));
        router.dismissTo(`/projects/${id}`);
    };

    const getMappings = () => {
        if (!localControllerMappings) {
            setLocalControllerMappings({});
        };
        fetch(`https://itchy-controldb.vercel.app/api/controllermapping?projectId=${id}&date=${Date.now()}`)
            .then((response) => response.json())
            .then((data) => {
                setIsLoading(false);
                if (data.error) {
                    setResults([]);
                    return;
                }
                if (!data || !Array.isArray(data)) {
                    setResults([]);
                    return;
                }
                setResults(data);
            });
    };

    useEffect(() => {
        getMappings();
    }, []);

    const makeNewMapping = () => {
        if (!!username) {
            router.push(`/projects/${id}/controls/config`);
        } else {
            ToastAndroid.show("You must be logged in to create a new controller mapping.", ToastAndroid.LONG);
            router.push("/login");
        }
    }

    const renderItem = (item) => {
        return (
            <Card style={{ padding: 10 }} onPress={() => setControllerForProject(item)}>
                <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10 }}>
                    <View style={{ flex: 1 }}>
                        <ItchyText style={{ color: colors.textSecondary, fontSize: 16, marginBottom: 8 }}>Left: <ItchyText style={{ fontWeight: "bold", color: colors.accent, textTransform: 'capitalize' }}>{item.controlOptions.primaryController || "Unknown"}</ItchyText></ItchyText>
                        {Object.keys(item.controls.primary).map((key) => (
                            <ItchyText key={key} style={{ color: colors.textSecondary, fontSize: 12 }}>
                                {key.toUpperCase()}: <ItchyText style={{ fontWeight: "bold", color: colors.text }}>
                                    {controlOptionToFullName(item.controls.primary[key])}
                                </ItchyText>
                            </ItchyText>
                        ))}
                    </View>
                    <View style={{ flex: 1 }}>
                        <ItchyText style={{ color: colors.textSecondary, fontSize: 16, marginBottom: 8 }}>Right: <ItchyText style={{ fontWeight: "bold", color: colors.accent, textTransform: 'capitalize' }}>{item.controlOptions.secondaryController}</ItchyText></ItchyText>
                        {Object.keys(item.controls.secondary).map((key) => (
                            <ItchyText key={key} style={{ color: colors.textSecondary, fontSize: 12 }}>{key.toUpperCase()}: <ItchyText style={{ fontWeight: "bold", color: colors.text }}>{controlOptionToFullName(item.controls.secondary[key])}</ItchyText></ItchyText>
                        ))}
                    </View>
                </View>
                <ItchyText style={{ color: colors.textSecondary, fontSize: 12, marginHorizontal: 10, marginBottom: 10 }}>{item.controls.extra.length > 0 && <ItchyText style={{ color: colors.textSecondary, fontSize: 12, marginHorizontal: 10 }}>EXTRAS: {item.controls.extra.map((key) => (
                    <ItchyText key={key} style={{ fontWeight: "bold", color: colors.text }}>{controlOptionToFullName(key)} </ItchyText>
                ))}  —  </ItchyText>}mapping created by <ItchyText style={{ fontWeight: "bold", color: colors.text }}>{item.username || "Unknown"}</ItchyText></ItchyText>
            </Card>
        );
    };

    const queriedResults = useMemo(() => results.filter((item) => {
        return item.username.toLowerCase().includes(query.toLowerCase());
    }), [query, results]);

    return (<>
        <Stack.Screen options={{ headerRight: () => (<MaterialIcons.Button name="playlist-add" onPressIn={makeNewMapping} size={24} color={colors.textSecondary} backgroundColor="transparent" style={{ paddingRight: 0 }} />) }} />
        <View>
            <FlatList
                data={queriedResults}
                renderItem={({ item }) => renderItem(item)}
                stickyHeaderIndices={[0]}
                keyExtractor={(item) => item._id || item.id || String(Math.random())}
                contentContainerStyle={{
                    marginHorizontal: 20,
                    gap: 10,
                    paddingBottom: 100,
                }}
                refreshing={isLoading}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        tintColor={"white"}
                        progressBackgroundColor={colors.accent}
                        colors={isDark ? ["black"] : ["white"]}
                    />
                }
                onRefresh={getMappings}
                ListHeaderComponent={
                    <>
                        <View
                            style={{
                                backgroundColor: colors.background,
                                zIndex: 0,
                                height: 40,
                            }}
                        ></View>
                        <View
                            style={{
                                backgroundColor: colors.backgroundTertiary,
                                paddingVertical: 15,
                                paddingLeft: 15,
                                paddingRight: 9,
                                marginBottom: 5,
                                borderRadius: 10,
                                marginTop: -30,
                                zIndex: 1,
                                elevation: 3,
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.2,
                                shadowRadius: 3,
                            }}
                        >
                            <TextInput
                                ref={searchBarRef}
                                placeholder="Search by creator's username"
                                inputMode="search"
                                enterKeyHint="search"
                                style={{
                                    backgroundColor: "transparent",
                                    color: colors.text,
                                    fontSize: 18,
                                    width: "100%",

                                }}
                                placeholderTextColor={colors.textSecondary}
                                inlineImageLeft={isDark ? "search_24_white" : "search_24_black"}
                                inlineImagePadding={28}
                                clearButtonMode="always"
                                onChangeText={(t) => setQuery(t)}
                            />
                        </View>
                    </>
                }
                ListEmptyComponent={
                    query === "" ? (
                        <Fragment key="empty-state">
                            {!isLoading && <View style={{ padding: 20, alignItems: "center" }} >
                                <MaterialIcons name="videogame-asset-off" size={64} color={colors.textSecondary} style={{ marginBottom: 20 }} />
                                <ItchyText style={{ color: colors.textSecondary, fontSize: 16 }}>No controller mappings found for this project.</ItchyText>
                                <TouchableOpacity onPress={makeNewMapping} style={{ padding: 8 }}>
                                    <ItchyText style={{ color: colors.accent, fontWeight: "bold", fontSize: 16 }}>Create your own mapping</ItchyText>
                                </TouchableOpacity>
                            </View>}
                        </Fragment>
                    ) : (
                        <View style={{ padding: 20, alignItems: "center" }} key="no-results">
                            <MaterialIcons name="search-off" size={64} color={colors.textSecondary} style={{ marginBottom: 20 }} />
                            <ItchyText style={{ color: colors.textSecondary, fontSize: 16 }}>No controller mappings match that username.</ItchyText>
                            <TouchableOpacity onPress={makeNewMapping} style={{ padding: 8 }}>
                                <ItchyText style={{ color: colors.accent, fontWeight: "bold", fontSize: 16 }}>Create your own mapping</ItchyText>
                            </TouchableOpacity>
                        </View>
                    )
                }
            />
        </View>
    </>);
}