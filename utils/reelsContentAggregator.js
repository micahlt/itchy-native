import APIExplore from "./api-wrapper/explore";
import APIStudio from "./api-wrapper/studio";

const CONTENT_TYPES = {
    PROJECT: 'project',
    STUDIO: 'studio',
    FEED_ITEM: 'feed_item'
};

const CONTENT_SOURCES = {
    FEATURED: 'featured',
    TOP_LOVED: 'top_loved',
    FRIENDS_LOVED: 'friends_loved',
    FRIENDS_PROJECTS: 'friends_projects',
    NEWEST: 'newest',
    FEED: 'feed',
    FEATURED_STUDIOS: 'featured_studios'
};

/**
 * Content aggregator for the Reels-style infinite scroll
 * Combines content from multiple sources while preventing duplicates
 */
class ReelsContentAggregator {
    constructor(username = null, token = null) {
        this.username = username;
        this.token = token;
        this.seenProjectIds = new Set();
        this.seenStudioIds = new Set();
        this.seenFeedIds = new Set();
        this.currentOffsets = {
            [CONTENT_SOURCES.FEED]: 0,
            [CONTENT_SOURCES.NEWEST]: 0,
            [CONTENT_SOURCES.FRIENDS_LOVED]: 0,
            [CONTENT_SOURCES.FRIENDS_PROJECTS]: 0
        };
        this.isLoading = false;
        this.hasMoreContent = true;
        this.contentBuffer = [];
        this.batchSize = 20;
    }

    /**
     * Initialize with user credentials
     */
    setUser(username, token) {
        this.username = username;
        this.token = token;
    }

    /**
     * Reset aggregator state for fresh content
     */
    reset() {
        this.seenProjectIds.clear();
        this.seenStudioIds.clear();
        this.seenFeedIds.clear();
        this.currentOffsets = {
            [CONTENT_SOURCES.FEED]: 0,
            [CONTENT_SOURCES.NEWEST]: 0,
            [CONTENT_SOURCES.FRIENDS_LOVED]: 0,
            [CONTENT_SOURCES.FRIENDS_PROJECTS]: 0
        };
        this.contentBuffer = [];
        this.hasMoreContent = true;
    }

    /**
     * Normalize content items to have consistent structure
     */
    normalizeContentItem(item, type, source) {
        const baseItem = {
            id: this.generateUniqueId(item, type),
            type,
            source,
            originalData: item,
            timestamp: new Date()
        };

        switch (type) {
            case CONTENT_TYPES.PROJECT:
                return {
                    ...baseItem,
                    projectId: item.id,
                    title: item.title,
                    thumbnail: item.thumbnail_url ? `https:${item.thumbnail_url}` : item.image,
                    creator: item.creator || item.author?.username,
                    creatorId: item.author?.id,
                    stats: {
                        loves: item.love_count || item.stats?.loves || 0,
                        favorites: item.favorite_count || item.stats?.favorites || 0,
                        views: item.view_count || item.stats?.views || 0,
                        remixes: item.remix_count || item.stats?.remixes || 0
                    },
                    description: item.instructions || item.description || ''
                };

            case CONTENT_TYPES.STUDIO:
                return {
                    ...baseItem,
                    studioId: item.id,
                    title: item.title,
                    // Use the proper thumbnail URL format for studios
                    thumbnail: `https://uploads.scratch.mit.edu/galleries/thumbnails/${item.id}.png`,
                    host: item.host,
                    description: item.description || '',
                    stats: {
                        comments: item.stats?.comments || 0,
                        followers: item.stats?.followers || 0,
                        managers: item.stats?.managers || 0,
                        projects: item.stats?.projects || item.project_count || 0
                    },
                    history: {
                        created: item.history?.created || null,
                        modified: item.history?.modified || null
                    },
                    visibility: item.visibility || null,
                    openToAll: item.open_to_all || false,
                    commentsAllowed: item.comments_allowed || true,
                    // We'll fetch missing info if needed
                    needsFetch: !item.stats || !item.history || !item.host
                };

            case CONTENT_TYPES.FEED_ITEM:
                const targetItem = this.extractTargetFromFeedItem(item);
                return {
                    ...baseItem,
                    feedId: item.id || `${item.actor_id}-${item.datetime_created}`,
                    actorUsername: item.actor_username,
                    actorId: item.actor_id,
                    activityType: item.type,
                    timestamp: new Date(item.datetime_created),
                    target: targetItem
                };

            default:
                return baseItem;
        }
    }

    /**
     * Extract the target project/studio from a feed item
     */
    extractTargetFromFeedItem(feedItem) {
        if (feedItem.project_id) {
            return {
                type: CONTENT_TYPES.PROJECT,
                id: feedItem.project_id,
                title: feedItem.project_title || feedItem.title,
                thumbnail: feedItem.project_thumbnail,
                creator: feedItem.project_creator
            };
        }

        if (feedItem.gallery_id) {
            return {
                type: CONTENT_TYPES.STUDIO,
                id: feedItem.gallery_id,
                title: feedItem.gallery_title || feedItem.title,
                thumbnail: `https://uploads.scratch.mit.edu/galleries/thumbnails/${feedItem.gallery_id}.png`,
                host: feedItem.gallery_owner || feedItem.actor_id,
                needsFetch: true // We'll need to fetch additional studio info
            };
        }

        return null;
    }

    /**
     * Generate a unique ID for deduplication
     */
    generateUniqueId(item, type) {
        switch (type) {
            case CONTENT_TYPES.PROJECT:
                return `project-${item.id}`;
            case CONTENT_TYPES.STUDIO:
                return `studio-${item.id}`;
            case CONTENT_TYPES.FEED_ITEM:
                return `feed-${item.id || `${item.actor_id}-${item.datetime_created}`}`;
            default:
                return `unknown-${Date.now()}-${Math.random()}`;
        }
    }

    /**
     * Check if content has already been seen
     */
    isContentSeen(normalizedItem) {
        switch (normalizedItem.type) {
            case CONTENT_TYPES.PROJECT:
                return this.seenProjectIds.has(normalizedItem.projectId);
            case CONTENT_TYPES.STUDIO:
                return this.seenStudioIds.has(normalizedItem.studioId);
            case CONTENT_TYPES.FEED_ITEM:
                return this.seenFeedIds.has(normalizedItem.feedId);
            default:
                return false;
        }
    }

    /**
     * Mark content as seen
     */
    markContentAsSeen(normalizedItem) {
        switch (normalizedItem.type) {
            case CONTENT_TYPES.PROJECT:
                this.seenProjectIds.add(normalizedItem.projectId);
                break;
            case CONTENT_TYPES.STUDIO:
                this.seenStudioIds.add(normalizedItem.studioId);
                break;
            case CONTENT_TYPES.FEED_ITEM:
                this.seenFeedIds.add(normalizedItem.feedId);
                break;
        }
    }

    /**
     * Fetch content from all sources
     */
    async fetchFromAllSources() {
        const promises = [];

        try {
            // Fetch explore data (featured, top loved, newest)
            promises.push(
                APIExplore.getExplore().catch(err => {
                    console.warn('Failed to fetch explore data:', err);
                    return null;
                })
            );

            // Fetch user-specific content if authenticated
            if (this.username && this.token) {
                promises.push(
                    APIExplore.getFriendsLoves(this.username, this.token).catch(err => {
                        console.warn('Failed to fetch friends loves:', err);
                        return [];
                    })
                );

                promises.push(
                    APIExplore.getFriendsProjects(this.username, this.token).catch(err => {
                        console.warn('Failed to fetch friends projects:', err);
                        return [];
                    })
                );

                promises.push(
                    APIExplore.getFeed(
                        this.username,
                        this.token,
                        this.currentOffsets[CONTENT_SOURCES.FEED],
                        10
                    ).catch(err => {
                        console.warn('Failed to fetch feed:', err);
                        return [];
                    })
                );
            } else {
                // Push empty arrays for unauthenticated users
                promises.push(Promise.resolve([]));
                promises.push(Promise.resolve([]));
                promises.push(Promise.resolve([]));
            }

            const [exploreData, friendsLoves, friendsProjects, feedData] = await Promise.all(promises);

            return {
                exploreData,
                friendsLoves,
                friendsProjects,
                feedData
            };
        } catch (error) {
            console.error('Error fetching content from sources:', error);
            return {
                exploreData: null,
                friendsLoves: [],
                friendsProjects: [],
                feedData: []
            };
        }
    }

    /**
     * Process and normalize all fetched content
     */
    processAndNormalizeContent(rawData) {
        const { exploreData, friendsLoves, friendsProjects, feedData } = rawData;
        const allContent = [];

        // Process explore data
        if (exploreData) {
            // Featured projects
            if (exploreData.featured) {
                exploreData.featured.forEach(project => {
                    const normalized = this.normalizeContentItem(project, CONTENT_TYPES.PROJECT, CONTENT_SOURCES.FEATURED);
                    if (!this.isContentSeen(normalized)) {
                        allContent.push(normalized);
                        this.markContentAsSeen(normalized);
                    }
                });
            }

            // Top loved projects
            if (exploreData.topLoved) {
                exploreData.topLoved.forEach(project => {
                    const normalized = this.normalizeContentItem(project, CONTENT_TYPES.PROJECT, CONTENT_SOURCES.TOP_LOVED);
                    if (!this.isContentSeen(normalized)) {
                        allContent.push(normalized);
                        this.markContentAsSeen(normalized);
                    }
                });
            }

            // Newest projects
            if (exploreData.newest) {
                exploreData.newest.forEach(project => {
                    const normalized = this.normalizeContentItem(project, CONTENT_TYPES.PROJECT, CONTENT_SOURCES.NEWEST);
                    if (!this.isContentSeen(normalized)) {
                        allContent.push(normalized);
                        this.markContentAsSeen(normalized);
                    }
                });
            }

            // Featured studios
            if (exploreData.featuredStudios) {
                exploreData.featuredStudios.forEach(studio => {
                    const normalized = this.normalizeContentItem(studio, CONTENT_TYPES.STUDIO, CONTENT_SOURCES.FEATURED_STUDIOS);
                    if (!this.isContentSeen(normalized)) {
                        allContent.push(normalized);
                        this.markContentAsSeen(normalized);
                    }
                });
            }
        }

        // Process friends content
        if (friendsLoves && friendsLoves.length > 0) {
            friendsLoves.forEach(project => {
                const normalized = this.normalizeContentItem(project, CONTENT_TYPES.PROJECT, CONTENT_SOURCES.FRIENDS_LOVED);
                if (!this.isContentSeen(normalized)) {
                    allContent.push(normalized);
                    this.markContentAsSeen(normalized);
                }
            });
        }

        if (friendsProjects && friendsProjects.length > 0) {
            friendsProjects.forEach(project => {
                const normalized = this.normalizeContentItem(project, CONTENT_TYPES.PROJECT, CONTENT_SOURCES.FRIENDS_PROJECTS);
                if (!this.isContentSeen(normalized)) {
                    allContent.push(normalized);
                    this.markContentAsSeen(normalized);
                }
            });
        }

        // Process feed data
        if (feedData && feedData.length > 0) {
            feedData.forEach(feedItem => {
                // Only include feed items directly tied to projects or studios
                if (feedItem.project_id || feedItem.gallery_id) {
                    const normalized = this.normalizeContentItem(feedItem, CONTENT_TYPES.FEED_ITEM, CONTENT_SOURCES.FEED);
                    if (!this.isContentSeen(normalized)) {
                        allContent.push(normalized);
                        this.markContentAsSeen(normalized);
                    }
                }
            });
            this.currentOffsets[CONTENT_SOURCES.FEED] += feedData.length;
        }

        return allContent;
    }

    /**
     * Intelligent shuffle that maintains content diversity
     */
    shuffleContentIntelligently(content) {
        if (content.length === 0) return content;

        // Group content by source for intelligent distribution
        const sourceGroups = {};
        content.forEach(item => {
            if (!sourceGroups[item.source]) {
                sourceGroups[item.source] = [];
            }
            sourceGroups[item.source].push(item);
        });

        const shuffled = [];
        const sources = Object.keys(sourceGroups);
        let sourceIndex = 0;

        // Distribute content evenly from different sources
        while (shuffled.length < content.length) {
            const currentSource = sources[sourceIndex % sources.length];
            const sourceGroup = sourceGroups[currentSource];

            if (sourceGroup && sourceGroup.length > 0) {
                const randomIndex = Math.floor(Math.random() * sourceGroup.length);
                shuffled.push(sourceGroup.splice(randomIndex, 1)[0]);
            }

            sourceIndex++;

            // Clean up empty source groups
            if (sourceGroup && sourceGroup.length === 0) {
                delete sourceGroups[currentSource];
                sources.splice(sources.indexOf(currentSource), 1);
            }

            if (sources.length === 0) break;
        }

        return shuffled;
    }

    /**
     * Get the next batch of content for the reels
     */
    async getNextBatch(count = this.batchSize) {
        if (this.isLoading) {
            return [];
        }

        this.isLoading = true;

        try {
            // If buffer is sufficient, return from buffer
            if (this.contentBuffer.length >= count) {
                const batch = this.contentBuffer.splice(0, count);
                this.isLoading = false;
                return batch;
            }

            // Fetch fresh content
            const rawData = await this.fetchFromAllSources();
            const newContent = this.processAndNormalizeContent(rawData);

            if (newContent.length === 0) {
                // Check if we can still get more paginated content
                if (this.username && this.token && this.currentOffsets[CONTENT_SOURCES.FEED] > 0) {
                    // Try to get more feed content
                    try {
                        const moreFeed = await APIExplore.getFeed(
                            this.username,
                            this.token,
                            this.currentOffsets[CONTENT_SOURCES.FEED],
                            10
                        );
                        if (moreFeed && moreFeed.length > 0) {
                            // Filter out feed items that aren't directly tied to projects or studios
                            const filteredFeed = moreFeed.filter(item => item.project_id || item.gallery_id);

                            const normalizedFeed = filteredFeed.map(feedItem =>
                                this.normalizeContentItem(feedItem, CONTENT_TYPES.FEED_ITEM, CONTENT_SOURCES.FEED)
                            ).filter(item => !this.isContentSeen(item));

                            normalizedFeed.forEach(item => this.markContentAsSeen(item));
                            this.currentOffsets[CONTENT_SOURCES.FEED] += moreFeed.length;

                            const shuffledFeed = this.shuffleContentIntelligently(normalizedFeed);
                            this.contentBuffer.push(...shuffledFeed);

                            const batch = this.contentBuffer.splice(0, Math.min(count, this.contentBuffer.length));
                            this.isLoading = false;
                            return batch;
                        }
                    } catch (error) {
                        console.warn('Failed to fetch more feed content:', error);
                    }
                }

                this.hasMoreContent = false;
                this.isLoading = false;
                return this.contentBuffer.splice(0, Math.min(count, this.contentBuffer.length));
            }

            // Shuffle and add to buffer
            const shuffledContent = this.shuffleContentIntelligently(newContent);
            this.contentBuffer.push(...shuffledContent);

            // Return requested amount
            const batch = this.contentBuffer.splice(0, Math.min(count, this.contentBuffer.length));
            this.isLoading = false;
            return batch;

        } catch (error) {
            console.error('Error getting next batch:', error);
            this.isLoading = false;
            return [];
        }
    }

    /**
     * Refresh all content (for pull-to-refresh)
     */
    async refresh() {
        this.reset();
        return await this.getNextBatch();
    }

    /**
     * Check if more content is available
     */
    hasMore() {
        return this.hasMoreContent || this.contentBuffer.length > 0;
    }

    /**
     * Get loading state
     */
    getLoadingState() {
        return this.isLoading;
    }
}

// Export singleton instance
const reelsContentAggregator = new ReelsContentAggregator();

export default reelsContentAggregator;
export { CONTENT_TYPES, CONTENT_SOURCES, ReelsContentAggregator };