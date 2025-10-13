import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Animated, Dimensions, Modal } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/theme';
import { CONTENT_TYPES } from '../utils/reelsContentAggregator';
import ItchyText from './ItchyText';
import Chip from './Chip';
import FastSquircleView from 'react-native-fast-squircle';
import APIProject from '../utils/api-wrapper/project';
import APIStudio from '../utils/api-wrapper/studio';
import APIUser from '../utils/api-wrapper/user';
import approximateNumber from 'approximate-number';
import Pressable from './Pressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReelsContentItem({ item, index, isActive, height, width, topInset = 0 }) {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [projectDescription, setProjectDescription] = useState(item.description || '');
    const [showWhyModal, setShowWhyModal] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Animation when content becomes active
    useEffect(() => {
        if (isActive) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0.7,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isActive]);

    // State for studio data and host username
    const [studioData, setStudioData] = useState(null);
    const [hostUsername, setHostUsername] = useState(null);

    // Fetch project description or studio data if missing
    useEffect(() => {
        const fetchMissingData = async () => {
            // Fetch project description if missing
            if (item.type === CONTENT_TYPES.PROJECT && !item.description && item.projectId) {
                try {
                    const projectData = await APIProject.getProject(item.projectId);
                    setProjectDescription(projectData.description || projectData.instructions || '');
                } catch (error) {
                    console.warn('Failed to fetch project description:', error);
                }
            } else if (item.type === CONTENT_TYPES.FEED_ITEM && item.target?.type === CONTENT_TYPES.PROJECT && item.target.id) {
                try {
                    const projectData = await APIProject.getProject(item.target.id);
                    setProjectDescription(projectData.description || projectData.instructions || '');
                } catch (error) {
                    console.warn('Failed to fetch project description:', error);
                }
            }

            // Fetch studio data if needed
            if (item.type === CONTENT_TYPES.STUDIO && item.studioId) {
                try {
                    let studio = item;

                    // Fetch full studio data if needed
                    if (item.needsFetch) {
                        studio = await APIStudio.getStudio(item.studioId);
                        setStudioData(studio);
                    }

                    // Fetch host username from user ID
                    if (studio.host && !isNaN(studio.host)) {
                        try {
                            const userData = await APIUser.getUserById(studio.host);
                            if (userData && userData.username) {
                                setHostUsername(userData.username);
                            }
                        } catch (error) {
                            console.warn('Failed to fetch host username:', error);
                        }
                    }
                } catch (error) {
                    console.warn('Failed to fetch studio data:', error);
                }
            } else if (item.type === CONTENT_TYPES.FEED_ITEM &&
                item.target?.type === CONTENT_TYPES.STUDIO &&
                item.target.id) {
                try {
                    let studio = item.target;

                    // Fetch full studio data if needed
                    if (item.target.needsFetch) {
                        studio = await APIStudio.getStudio(item.target.id);
                        setStudioData(studio);
                    }

                    // Fetch host username from user ID
                    if (studio.host && !isNaN(studio.host)) {
                        try {
                            const userData = await APIUser.getUserById(studio.host);
                            if (userData && userData.username) {
                                setHostUsername(userData.username);
                            }
                        } catch (error) {
                            console.warn('Failed to fetch host username:', error);
                        }
                    }
                } catch (error) {
                    console.warn('Failed to fetch studio data:', error);
                }
            }
        };

        if (isActive) {
            fetchMissingData();
        }
    }, [isActive, item]);

    const onImageLoad = useCallback(() => {
        setImageLoaded(true);
    }, []);

    const handleContentPress = useCallback(() => {
        let route;
        switch (item.type) {
            case CONTENT_TYPES.PROJECT:
                route = `/projects/${item.projectId}`;
                break;
            case CONTENT_TYPES.STUDIO:
                route = `/studios/${item.studioId}`;
                break;
            case CONTENT_TYPES.FEED_ITEM:
                if (item.target) {
                    if (item.target.type === CONTENT_TYPES.PROJECT) {
                        route = `/projects/${item.target.id}`;
                    } else if (item.target.type === CONTENT_TYPES.STUDIO) {
                        route = `/studios/${item.target.id}`;
                    }
                }
                break;
        }
        if (route) {
            router.push(route);
        }
    }, [item, router]);

    const handleUserPress = useCallback(() => {
        let username;
        switch (item.type) {
            case CONTENT_TYPES.PROJECT:
                username = item.creator;
                break;
            case CONTENT_TYPES.STUDIO:
                // Use the resolved host username if available
                username = hostUsername || studioData?.host || item.host;
                break;
            case CONTENT_TYPES.FEED_ITEM:
                if (item.target?.type === CONTENT_TYPES.STUDIO) {
                    // Use the resolved host username if available
                    username = hostUsername || studioData?.host || item.target?.host || item.actorUsername;
                } else {
                    username = item.actorUsername;
                }
                break;
        }
        if (username) {
            router.push(`/users/${username}`);
        }
    }, [item, studioData, hostUsername, router]);

    const handleLike = useCallback(() => {
        setIsLiked(!isLiked);
        // TODO: Implement actual like functionality
    }, [isLiked]);

    const handleFavorite = useCallback(() => {
        setIsFavorited(!isFavorited);
        // TODO: Implement actual favorite functionality
    }, [isFavorited]);

    const handleComment = useCallback(() => {
        // TODO: Implement actual comment functionality
        console.log('Comment pressed for item:', item.id);
    }, [item.id]);

    const handleWhyModal = useCallback(() => {
        setShowWhyModal(true);
    }, []);

    const closeWhyModal = useCallback(() => {
        setShowWhyModal(false);
    }, []);

    const getWhyText = () => {
        switch (item.source) {
            case 'featured':
                return 'This project is featured by the Scratch Team.';
            case 'top_loved':
                return 'This project is currently trending and has many loves.';
            case 'friends_loved':
                return 'Someone you follow loved this project.';
            case 'friends_projects':
                return 'This project was created by someone you follow.';
            case 'newest':
                return 'This is a recently shared project.';
            case 'feed':
                return 'This appeared in your activity feed.';
            case 'featured_studios':
                return 'This studio is featured by the Scratch Team.';
            default:
                return 'This content was recommended for you.';
        }
    };

    const getImageSource = () => {
        switch (item.type) {
            case CONTENT_TYPES.PROJECT:
                return item.thumbnail ? { uri: item.thumbnail } : require('../assets/project.png');
            case CONTENT_TYPES.STUDIO:
                return item.studioId ?
                    { uri: `https://uploads.scratch.mit.edu/galleries/thumbnails/${item.studioId}.png` } :
                    require('../assets/project.png');
            case CONTENT_TYPES.FEED_ITEM:
                if (item.target?.type === CONTENT_TYPES.STUDIO && item.target?.id) {
                    return { uri: `https://uploads.scratch.mit.edu/galleries/thumbnails/${item.target.id}.png` };
                }
                return item.target?.thumbnail ?
                    { uri: item.target.thumbnail } :
                    require('../assets/project.png');
            default:
                return require('../assets/project.png');
        }
    };

    const getTitle = () => {
        switch (item.type) {
            case CONTENT_TYPES.PROJECT:
                return item.title;
            case CONTENT_TYPES.STUDIO:
                return item.title;
            case CONTENT_TYPES.FEED_ITEM:
                return item.target?.title || 'Activity';
            default:
                return 'Unknown Content';
        }
    };

    const getSubtitle = () => {
        switch (item.type) {
            case CONTENT_TYPES.PROJECT:
                return null; // Remove duplicate author info since chip shows it
            case CONTENT_TYPES.STUDIO:
                // Use hostUsername (fetched from ID) if available
                if (hostUsername) {
                    return `hosted by ${hostUsername}`;
                }
                return null;
            case CONTENT_TYPES.FEED_ITEM:
                if (item.target?.type === CONTENT_TYPES.STUDIO) {
                    // Use hostUsername (fetched from ID) if available
                    if (hostUsername) {
                        return `hosted by ${hostUsername}`;
                    }
                    return null;
                }
                return `${item.actorUsername} ${item.activityType}`;
            default:
                return '';
        }
    };

    const getCreatorAvatar = () => {
        switch (item.type) {
            case CONTENT_TYPES.PROJECT:
                // Use the author object structure if available, fallback to creator name
                if (item.originalData?.author?.profile?.images) {
                    return item.originalData.author.profile.images["32x32"];
                }
                if (!item.creator) return null;
                return `https://uploads.scratch.mit.edu/get_image/user/${item.creator}_50x50.png`;
            case CONTENT_TYPES.STUDIO:
                // Use hostUsername if available, otherwise use the ID
                if (hostUsername) {
                    return `https://uploads.scratch.mit.edu/get_image/user/${hostUsername}_50x50.png`;
                }
                const studioHost = studioData?.host || item.host;
                if (!studioHost) return null;
                return `https://uploads.scratch.mit.edu/get_image/user/${studioHost}_50x50.png`;
            case CONTENT_TYPES.FEED_ITEM:
                if (item.target?.type === CONTENT_TYPES.STUDIO) {
                    // Use hostUsername if available
                    if (hostUsername) {
                        return `https://uploads.scratch.mit.edu/get_image/user/${hostUsername}_50x50.png`;
                    }
                    const targetHost = studioData?.host || item.target?.host;
                    if (targetHost) {
                        return `https://uploads.scratch.mit.edu/get_image/user/${targetHost}_50x50.png`;
                    }
                }
                if (!item.actorUsername) return null;
                return `https://uploads.scratch.mit.edu/get_image/user/${item.actorUsername}_50x50.png`;
            default:
                return null;
        }
    };

    const getCreatorName = () => {
        switch (item.type) {
            case CONTENT_TYPES.PROJECT:
                return item.creator;
            case CONTENT_TYPES.STUDIO:
                // Return the resolved username if available
                return hostUsername || studioData?.host || item.host || '';
            case CONTENT_TYPES.FEED_ITEM:
                if (item.target?.type === CONTENT_TYPES.STUDIO) {
                    // Return the resolved username if available
                    return hostUsername || studioData?.host || item.target?.host || item.actorUsername;
                }
                return item.actorUsername;
            default:
                return '';
        }
    };

    const getStats = () => {
        if (item.type === CONTENT_TYPES.PROJECT && item.stats) {
            return item.stats;
        }
        return { loves: 0, favorites: 0, views: 0, remixes: 0 };
    };

    const stats = getStats();

    return (
        <Animated.View
            style={{
                height,
                width,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
            }}
        >
            <Pressable
                style={{ flex: 1 }}
                onPress={handleContentPress}
                android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
                <View style={{ flex: 1, position: 'relative' }}>
                    {/* Background Backdrop Image (Blurred and Cropped) */}
                    <Image
                        source={getImageSource()}
                        style={{
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            opacity: 0.3,
                        }}
                        contentFit="cover"
                        blurRadius={4}
                        placeholder={require('../assets/project.png')}
                    />

                    {/* Main Content Image (Properly Scaled) */}
                    <View style={{
                        flex: 1,
                        justifyContent: 'start',
                        alignItems: 'center',
                        paddingHorizontal: 20,
                        paddingVertical: 20, // Reduced from 40 to move image up
                        paddingTop: 0, // Move image up more
                        zIndex: 2
                    }}>
                        <View style={{
                            shadowColor: "#000",
                            shadowOffset: {
                                width: 0,
                                height: 8,
                            },
                            shadowOpacity: 0.44,
                            shadowRadius: 10.32,
                            elevation: 16,
                            alignItems: 'center',
                            width: width - 40
                        }}>
                            <Image
                                source={getImageSource()}
                                style={{
                                    width: '100%',
                                    aspectRatio: item.type === CONTENT_TYPES.STUDIO ? 1.7 : 4 / 3, // Different aspect ratios
                                    borderRadius: 12,
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    marginTop: topInset + 50,
                                    objectFit: "cover"
                                }}
                                onLoad={onImageLoad}
                                transition={200}
                            />

                            {/* Description moved under image */}
                            {(item.type === CONTENT_TYPES.PROJECT || (item.type === CONTENT_TYPES.FEED_ITEM && item.target?.type === CONTENT_TYPES.PROJECT)) && (

                                <ItchyText style={{
                                    width: "100%",
                                    color: 'rgba(255,255,255)',
                                    fontSize: 14,
                                    lineHeight: 18,
                                    textShadowColor: 'rgba(0,0,0,0.8)',
                                    textShadowOffset: { width: 0, height: 1 },
                                    textShadowRadius: 3,
                                    marginTop: 20
                                }} numberOfLines={10}>
                                    {projectDescription || ''}
                                </ItchyText>
                            )}
                        </View>
                    </View>

                    {/* Gradient overlays */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1
                        }}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.1)', 'transparent']}
                        style={{
                            position: 'absolute',
                            top: '15%',
                            left: 0,
                            right: 0,
                            bottom: '15%',
                            zIndex: 1,
                            borderRadius: 12
                        }}
                    />

                    <View style={{
                        position: 'absolute',
                        bottom: 25,
                        right: 15,
                        zIndex: 10,
                    }}>
                        <Pressable
                            onPress={handleWhyModal}
                            style={({ pressed }) => ({
                                opacity: pressed ? 0.7 : 1,
                                transform: [{ scale: pressed ? 0.9 : 1 }],
                            })}
                        >
                            <View style={{
                                width: 32,
                                height: 32,
                                borderRadius: 20,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.5
                            }}>
                                <Ionicons
                                    name="help-outline"
                                    size={18}
                                    color="white"
                                />
                            </View>
                        </Pressable>
                    </View>

                    <View style={{
                        position: 'absolute',
                        bottom: 30,
                        left: 20,
                        right: 20,
                        zIndex: 3,
                    }}>
                        {getCreatorAvatar() && (
                            <View style={{ marginBottom: 15 }}>
                                <Chip.Image
                                    imageURL={getCreatorAvatar()}
                                    text={getCreatorName()}
                                    onPress={handleUserPress}
                                    mode="filled"
                                    textStyle={{
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: 14,
                                    }}
                                    style={{
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        borderColor: 'transparent',
                                    }}
                                />
                            </View>
                        )}

                        <ItchyText style={{
                            color: 'white',
                            fontSize: 22, // Increased from 18
                            fontWeight: 'bold',
                            marginBottom: 10,
                            textShadowColor: 'rgba(0,0,0,0.8)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 3,
                        }} numberOfLines={2}>
                            {getTitle()}
                        </ItchyText>

                        {getSubtitle() && (
                            <ItchyText style={{
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: 16, // Increased from 14
                                marginBottom: 10,
                                textShadowColor: 'rgba(0,0,0,0.8)',
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 3,
                            }} numberOfLines={1}>
                                {getSubtitle()}
                            </ItchyText>
                        )}

                        {(item.type === CONTENT_TYPES.PROJECT || (item.type === CONTENT_TYPES.FEED_ITEM && item.target?.type === CONTENT_TYPES.PROJECT)) && (
                            <View style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 8,
                                marginBottom: 10,
                            }}>
                                <Chip.Icon
                                    icon={isLiked ? "heart" : "heart-outline"}
                                    text={stats.loves > 0 ? approximateNumber(stats.loves) : "Love"}
                                    color="#ff4757"
                                    mode={isLiked ? "filled" : "outlined"}
                                    onPress={handleLike}
                                />

                                <Chip.Icon
                                    icon={isFavorited ? "star" : "star-outline"}
                                    text={stats.favorites > 0 ? approximateNumber(stats.favorites) : "Favorite"}
                                    color="#ffa502"
                                    mode={isFavorited ? "filled" : "outlined"}
                                    onPress={handleFavorite}
                                />

                                <Chip.Icon
                                    icon="chatbubble-outline"
                                    text={stats.remixes > 0 ? approximateNumber(stats.remixes) : "Comment"}
                                    color="#47b5ff"
                                    mode="outlined"
                                    onPress={handleComment}
                                />
                            </View>
                        )}

                        {(item.type === CONTENT_TYPES.PROJECT || (item.type === CONTENT_TYPES.FEED_ITEM && item.target?.type === CONTENT_TYPES.PROJECT)) && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 15,
                            }}>
                                {stats.views > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.8)" />
                                        <ItchyText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                            {approximateNumber(stats.views)} views
                                        </ItchyText>
                                    </View>
                                )}
                                {stats.remixes > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <Ionicons name="sync-outline" size={16} color="rgba(255,255,255,0.8)" />
                                        <ItchyText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                            {approximateNumber(stats.remixes)} remixes
                                        </ItchyText>
                                    </View>
                                )}
                            </View>
                        )}

                        {item.type === CONTENT_TYPES.STUDIO && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 15,
                                marginTop: 10,
                            }}>
                                {item.projectCount > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <Ionicons name="folder-outline" size={16} color="rgba(255,255,255,0.8)" />
                                        <ItchyText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                            {item.projectCount} projects
                                        </ItchyText>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>

            <Modal
                visible={showWhyModal}
                transparent={true}
                animationType="fade"
                onRequestClose={closeWhyModal}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 40,
                }}>
                    <FastSquircleView
                        cornerSmoothing={0.6}
                        style={{
                            backgroundColor: colors.background,
                            borderRadius: 20,
                            padding: 30,
                            width: '100%',
                            maxWidth: 350,
                            borderColor: colors.outline,
                            borderWidth: 1,
                        }}
                    >
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}>
                            <ItchyText style={{
                                color: colors.text,
                                fontSize: 18,
                                fontWeight: 'bold',
                            }}>
                                Why am I seeing this?
                            </ItchyText>
                            <Pressable onPress={closeWhyModal}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </Pressable>
                        </View>

                        <ItchyText style={{
                            color: colors.textSecondary,
                            fontSize: 14,
                            lineHeight: 20,
                            marginBottom: 25,
                        }}>
                            {getWhyText()}
                        </ItchyText>

                        <View style={{ borderRadius: 25, overflow: "hidden", marginLeft: "auto" }}>
                            <Pressable
                                onPress={closeWhyModal}
                                android_ripple={{ color: colors.ripple, foreground: true }}
                                style={{
                                    backgroundColor: colors.accent,
                                    paddingVertical: 12,
                                    paddingHorizontal: 25,
                                    alignSelf: 'flex-end',
                                }}
                            >
                                <ItchyText style={{
                                    color: 'white',
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                }}>
                                    Okay
                                </ItchyText>
                            </Pressable>
                        </View>
                    </FastSquircleView>
                </View>
            </Modal>
        </Animated.View>
    );
}