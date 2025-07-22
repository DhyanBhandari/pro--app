// Matching system type definitions
// Defines types for ML matching, search results, and match data

/**
 * Matching Types - Phase 2
 * 
 * TypeScript interfaces for the ML matching system integration.
 * Covers search queries, match results, scoring, and user interactions.
 */

export interface SearchQuery {
  id: string;
  query: string;
  timestamp: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ParsedIntent {
  intent: 'demand' | 'supply';
  category: 'product' | 'service' | 'social' | 'travel' | 'general';
  keywords: string[];
  locations: string[];
  prices: string[];
  confidence: number;
  entities: {
    [key: string]: string[];
  };
}

export interface IntentSearchResult {
  intent_id: string;
  user_id: string;
  post_type: 'demand' | 'supply';
  category: string;
  raw_query: string;
  parsed_data: ParsedIntent;
  location_name?: string;
  is_active: boolean;
  created_at: string;
  valid_until: string;
  processing_time_ms?: number;
}

export interface MatchScore {
  text_similarity: number;
  feature_similarity: number;
  location_score: number;
  intent_compatibility: number;
  temporal_compatibility: number;
  combined_score: number;
  confidence_score: number;
}

export interface MatchResult {
  intent_id: string;
  user_name: string;
  location_name: string;
  raw_query: string;
  category: string;
  post_type: 'demand' | 'supply';
  match_quality: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  created_at: string;
  scores: MatchScore;
  distance_km?: number;
  user_avatar?: string;
  user_rating?: number;
}

export interface MatchingProcess {
  query: SearchQuery;
  intent_result: IntentSearchResult | null;
  matches: MatchResult[];
  status: 'idle' | 'parsing' | 'searching' | 'matching' | 'completed' | 'error';
  error?: string;
  processing_stats?: {
    parsing_time_ms: number;
    matching_time_ms: number;
    total_candidates: number;
    filtered_results: number;
  };
}

export interface SearchFilter {
  category?: string[];
  post_type?: 'demand' | 'supply';
  location_radius_km?: number;
  min_score?: number;
  max_results?: number;
  sort_by?: 'relevance' | 'distance' | 'recency' | 'score';
  match_quality?: ('excellent' | 'good' | 'fair')[];
}

export interface UserMatchProfile {
  user_id: string;
  name: string;
  avatar?: string;
  location: string;
  bio?: string;
  rating?: number;
  total_matches: number;
  success_rate: number;
  last_active: string;
  verified: boolean;
}

export interface MatchInteraction {
  match_id: string;
  action: 'viewed' | 'liked' | 'contacted' | 'dismissed' | 'reported';
  timestamp: string;
  notes?: string;
}

export interface SavedMatch {
  id: string;
  match: MatchResult;
  saved_at: string;
  notes?: string;
  tags: string[];
}

export interface MatchingState {
  current_search?: SearchQuery;
  current_process?: MatchingProcess;
  recent_searches: SearchQuery[];
  match_history: MatchResult[];
  saved_matches: SavedMatch[];
  active_filters: SearchFilter;
  user_interactions: MatchInteraction[];
}

export interface MatchingContextValue {
  state: MatchingState;
  actions: {
    startSearch: (query: string, location?: string) => Promise<void>;
    applyFilters: (filters: Partial<SearchFilter>) => void;
    saveMatch: (match: MatchResult, notes?: string) => void;
    removeMatch: (matchId: string) => void;
    recordInteraction: (interaction: MatchInteraction) => void;
    clearHistory: () => void;
    retrySearch: () => Promise<void>;
  };
}

// API Response types that match backend
export interface ApiIntentResponse {
  intent_id: string;
  user_id: string;
  post_type: 'demand' | 'supply';
  category: string;
  raw_query: string;
  parsed_data?: any;
  location_name?: string;
  is_active: boolean;
  created_at: string;
  valid_until: string;
}

export interface ApiMatchResponse {
  intent_id: string;
  user_name: string;
  location_name: string;
  raw_query: string;
  category: string;
  post_type: string;
  text_similarity?: number;
  feature_similarity?: number;
  location_score?: number;
  intent_compatibility?: number;
  temporal_compatibility?: number;
  combined_score: number;
  confidence_score?: number;
  match_quality?: string;
  created_at: string;
}

export type MatchingScreenName = 'Search' | 'Matching' | 'Results' | 'MatchDetails';

export interface MatchingNavigation {
  navigate: (screen: MatchingScreenName, params?: any) => void;
  goBack: () => void;
  reset: () => void;
}