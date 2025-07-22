import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './ApiService';
import { 
    SearchQuery, 
    MatchResult, 
    SearchFilter,
    SavedMatch,
    MatchInteraction,
    IntentSearchResult 
} from '@/types/matching.types';

const STORAGE_KEYS = {
    SEARCH_HISTORY: 'matching_search_history',
    SAVED_MATCHES: 'matching_saved_matches',
    USER_PREFERENCES: 'matching_preferences',
    OFFLINE_CACHE: 'matching_offline_cache',
};

export class MatchingService {
    private static instance: MatchingService;

    public static getInstance(): MatchingService {
        if (!MatchingService.instance) {
            MatchingService.instance = new MatchingService();
        }
        return MatchingService.instance;
    }

    // Search Operations
    async performSearch(query: string, location?: string, authToken?: string): Promise<{
        intent: IntentSearchResult | null;
        matches: MatchResult[];
        error?: string;
    }> {
        console.log('[MatchingService] Performing search:', query);

        // Check if user is authenticated
        if (!authToken) {
            return { 
                intent: null, 
                matches: [], 
                error: 'Authentication required to perform searches' 
            };
        }

        try {
            // Step 1: Create intent with auth token
            const intentResponse = await apiService.createIntent({
                raw_query: query,
                location_name: location,
            }, authToken);

            if (!intentResponse) {
                return { intent: null, matches: [], error: 'Failed to create intent' };
            }

            // Convert to our format
            const intent: IntentSearchResult = {
                intent_id: intentResponse.intent_id,
                user_id: intentResponse.user_id,
                post_type: intentResponse.post_type,
                category: intentResponse.category,
                raw_query: intentResponse.raw_query,
                parsed_data: intentResponse.parsed_data || {
                    intent: intentResponse.post_type,
                    category: intentResponse.category,
                    keywords: [],
                    locations: [],
                    prices: [],
                    confidence: 0.8,
                    entities: {}
                },
                location_name: intentResponse.location_name,
                is_active: intentResponse.is_active,
                created_at: intentResponse.created_at,
                valid_until: intentResponse.valid_until,
            };

            // Step 2: Get matches
            const apiMatches = await apiService.getMatches(intentResponse.intent_id);
            const matches: MatchResult[] = apiMatches.map(match => ({
                intent_id: match.intent_id,
                user_name: match.user_name,
                location_name: match.location_name,
                raw_query: match.raw_query,
                category: match.category,
                post_type: match.post_type as 'demand' | 'supply',
                match_quality: this.calculateMatchQuality(match.combined_score),
                created_at: match.created_at,
                scores: {
                    text_similarity: match.text_similarity || 0,
                    feature_similarity: match.feature_similarity || 0,
                    location_score: match.location_score || 0,
                    intent_compatibility: match.intent_compatibility || 0,
                    temporal_compatibility: match.temporal_compatibility || 0,
                    combined_score: match.combined_score,
                    confidence_score: match.confidence_score || 0,
                },
                distance_km: match.distance_km,
            }));

            // Cache results for offline access
            await this.cacheSearchResults(query, { intent, matches });

            // Save to search history
            await this.saveToSearchHistory({ query, location, timestamp: new Date().toISOString() });

            return { intent, matches };

        } catch (error) {
            console.error('[MatchingService] Search error:', error);
            
            // Try to get cached results
            const cachedResults = await this.getCachedResults(query);
            if (cachedResults) {
                return { ...cachedResults, error: 'Using cached results (offline)' };
            }

            return { 
                intent: null, 
                matches: [], 
                error: error instanceof Error ? error.message : 'Search failed' 
            };
        }
    }

    private calculateMatchQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor' {
        if (score >= 0.8) return 'excellent';
        if (score >= 0.6) return 'good';
        if (score >= 0.4) return 'fair';
        if (score >= 0.2) return 'poor';
        return 'very_poor';
    }

    // Filter Operations
    applyFilters(matches: MatchResult[], filters: SearchFilter): MatchResult[] {
        let filtered = [...matches];

        // Category filter
        if (filters.category && filters.category.length > 0) {
            filtered = filtered.filter(match => filters.category!.includes(match.category));
        }

        // Post type filter
        if (filters.post_type) {
            filtered = filtered.filter(match => match.post_type === filters.post_type);
        }

        // Minimum score filter
        if (filters.min_score !== undefined) {
            filtered = filtered.filter(match => match.scores.combined_score >= filters.min_score!);
        }

        // Quality filter
        if (filters.match_quality && filters.match_quality.length > 0) {
            filtered = filtered.filter(match => filters.match_quality!.includes(match.match_quality));
        }

        // Sort results
        if (filters.sort_by) {
            filtered = this.sortMatches(filtered, filters.sort_by);
        }

        // Limit results
        if (filters.max_results) {
            filtered = filtered.slice(0, filters.max_results);
        }

        return filtered;
    }

    private sortMatches(matches: MatchResult[], sortBy: string): MatchResult[] {
        return matches.sort((a, b) => {
            switch (sortBy) {
                case 'relevance':
                case 'score':
                    return b.scores.combined_score - a.scores.combined_score;
                case 'distance':
                    return (a.distance_km || 999) - (b.distance_km || 999);
                case 'recency':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                default:
                    return 0;
            }
        });
    }

    // Search History Management
    async getSearchHistory(): Promise<SearchQuery[]> {
        try {
            const history = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('[MatchingService] Error getting search history:', error);
            return [];
        }
    }

    async saveToSearchHistory(search: { query: string; location?: string; timestamp: string }): Promise<void> {
        try {
            const history = await this.getSearchHistory();
            const searchQuery: SearchQuery = {
                id: Date.now().toString(),
                query: search.query,
                timestamp: search.timestamp,
                location: search.location,
            };

            // Remove duplicates and limit to 50 entries
            const updatedHistory = [
                searchQuery,
                ...history.filter(h => h.query !== search.query)
            ].slice(0, 50);

            await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('[MatchingService] Error saving search history:', error);
        }
    }

    async clearSearchHistory(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
        } catch (error) {
            console.error('[MatchingService] Error clearing search history:', error);
        }
    }

    // Saved Matches Management
    async getSavedMatches(): Promise<SavedMatch[]> {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_MATCHES);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('[MatchingService] Error getting saved matches:', error);
            return [];
        }
    }

    async saveMatch(match: MatchResult, notes?: string, tags: string[] = []): Promise<void> {
        try {
            const savedMatches = await this.getSavedMatches();
            const savedMatch: SavedMatch = {
                id: `saved_${match.intent_id}_${Date.now()}`,
                match,
                saved_at: new Date().toISOString(),
                notes,
                tags,
            };

            const updatedSaved = [savedMatch, ...savedMatches.filter(s => s.match.intent_id !== match.intent_id)];
            await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MATCHES, JSON.stringify(updatedSaved));
        } catch (error) {
            console.error('[MatchingService] Error saving match:', error);
        }
    }

    async removeSavedMatch(matchId: string): Promise<void> {
        try {
            const savedMatches = await this.getSavedMatches();
            const updatedSaved = savedMatches.filter(s => s.id !== matchId);
            await AsyncStorage.setItem(STORAGE_KEYS.SAVED_MATCHES, JSON.stringify(updatedSaved));
        } catch (error) {
            console.error('[MatchingService] Error removing saved match:', error);
        }
    }

    // User Preferences
    async getUserPreferences(): Promise<SearchFilter> {
        try {
            const prefs = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
            return prefs ? JSON.parse(prefs) : {
                max_results: 20,
                sort_by: 'relevance',
                min_score: 0.3,
            };
        } catch (error) {
            console.error('[MatchingService] Error getting preferences:', error);
            return {
                max_results: 20,
                sort_by: 'relevance',
                min_score: 0.3,
            };
        }
    }

    async saveUserPreferences(preferences: SearchFilter): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
        } catch (error) {
            console.error('[MatchingService] Error saving preferences:', error);
        }
    }

    // Analytics & Interactions
    async recordInteraction(interaction: MatchInteraction): Promise<void> {
        console.log('[MatchingService] Recording interaction:', interaction);
        
        // In a real app, this would send to analytics service
        try {
            const key = `interaction_${Date.now()}`;
            await AsyncStorage.setItem(key, JSON.stringify(interaction));
        } catch (error) {
            console.error('[MatchingService] Error recording interaction:', error);
        }
    }

    async getMatchingStats(): Promise<{
        totalSearches: number;
        savedMatches: number;
        averageMatchScore: number;
        topCategories: string[];
    }> {
        try {
            const [history, saved] = await Promise.all([
                this.getSearchHistory(),
                this.getSavedMatches()
            ]);

            // Calculate average score from saved matches
            const scores = saved.map(s => s.match.scores.combined_score);
            const averageMatchScore = scores.length > 0 
                ? scores.reduce((a, b) => a + b, 0) / scores.length 
                : 0;

            // Get top categories
            const categoryCount: { [key: string]: number } = {};
            saved.forEach(s => {
                categoryCount[s.match.category] = (categoryCount[s.match.category] || 0) + 1;
            });
            const topCategories = Object.entries(categoryCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([category]) => category);

            return {
                totalSearches: history.length,
                savedMatches: saved.length,
                averageMatchScore,
                topCategories,
            };
        } catch (error) {
            console.error('[MatchingService] Error getting stats:', error);
            return {
                totalSearches: 0,
                savedMatches: 0,
                averageMatchScore: 0,
                topCategories: [],
            };
        }
    }

    // Offline Support
    private async cacheSearchResults(query: string, results: { intent: IntentSearchResult; matches: MatchResult[] }): Promise<void> {
        try {
            const cacheKey = `cache_${query.toLowerCase().replace(/\s+/g, '_')}`;
            const cacheData = {
                query,
                results,
                cached_at: new Date().toISOString(),
            };
            await AsyncStorage.setItem(`${STORAGE_KEYS.OFFLINE_CACHE}_${cacheKey}`, JSON.stringify(cacheData));
        } catch (error) {
            console.error('[MatchingService] Error caching results:', error);
        }
    }

    private async getCachedResults(query: string): Promise<{ intent: IntentSearchResult; matches: MatchResult[] } | null> {
        try {
            const cacheKey = `cache_${query.toLowerCase().replace(/\s+/g, '_')}`;
            const cached = await AsyncStorage.getItem(`${STORAGE_KEYS.OFFLINE_CACHE}_${cacheKey}`);
            
            if (cached) {
                const cacheData = JSON.parse(cached);
                // Check if cache is less than 1 hour old
                const cacheAge = Date.now() - new Date(cacheData.cached_at).getTime();
                if (cacheAge < 3600000) { // 1 hour
                    return cacheData.results;
                }
            }
            return null;
        } catch (error) {
            console.error('[MatchingService] Error getting cached results:', error);
            return null;
        }
    }

    // Network Status
    async checkConnection(): Promise<boolean> {
        try {
            return await apiService.checkConnection();
        } catch {
            return false;
        }
    }

    // Cleanup
    async clearAllData(): Promise<void> {
        try {
            await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY),
                AsyncStorage.removeItem(STORAGE_KEYS.SAVED_MATCHES),
                AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES),
                this.clearCache(),
            ]);
        } catch (error) {
            console.error('[MatchingService] Error clearing data:', error);
        }
    }

    private async clearCache(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.OFFLINE_CACHE));
            await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
        } catch (error) {
            console.error('[MatchingService] Error clearing cache:', error);
        }
    }
}

export const matchingService = MatchingService.getInstance();