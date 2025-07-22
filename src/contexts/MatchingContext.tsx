import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, matchingService, authServiceV2 } from '@/services';
import {
  MatchingState,
  MatchingContextValue,
  SearchQuery,
  MatchingProcess,
  MatchResult,
  SearchFilter,
  MatchInteraction,
  SavedMatch,
  ApiIntentResponse,
  ApiMatchResponse,
  MatchScore
} from '@/types/matching.types';

const STORAGE_KEYS = {
  RECENT_SEARCHES: 'matching_recent_searches',
  SAVED_MATCHES: 'matching_saved_matches',
  USER_INTERACTIONS: 'matching_interactions',
  FILTERS: 'matching_filters'
};

const initialState: MatchingState = {
  recent_searches: [],
  match_history: [],
  saved_matches: [],
  active_filters: {
    max_results: 20,
    sort_by: 'relevance',
    min_score: 0.3,
  },
  user_interactions: [],
};

type MatchingAction = 
  | { type: 'SET_CURRENT_SEARCH'; payload: SearchQuery }
  | { type: 'SET_CURRENT_PROCESS'; payload: MatchingProcess }
  | { type: 'UPDATE_PROCESS_STATUS'; payload: MatchingProcess['status'] }
  | { type: 'SET_MATCHES'; payload: MatchResult[] }
  | { type: 'ADD_RECENT_SEARCH'; payload: SearchQuery }
  | { type: 'SET_FILTERS'; payload: SearchFilter }
  | { type: 'ADD_SAVED_MATCH'; payload: SavedMatch }
  | { type: 'REMOVE_SAVED_MATCH'; payload: string }
  | { type: 'ADD_INTERACTION'; payload: MatchInteraction }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'LOAD_PERSISTED_DATA'; payload: Partial<MatchingState> }
  | { type: 'SET_ERROR'; payload: string };

function matchingReducer(state: MatchingState, action: MatchingAction): MatchingState {
  switch (action.type) {
    case 'SET_CURRENT_SEARCH':
      return { ...state, current_search: action.payload };
    
    case 'SET_CURRENT_PROCESS':
      return { ...state, current_process: action.payload };
    
    case 'UPDATE_PROCESS_STATUS':
      return {
        ...state,
        current_process: state.current_process
          ? { ...state.current_process, status: action.payload }
          : undefined
      };
    
    case 'SET_MATCHES':
      return {
        ...state,
        current_process: state.current_process
          ? { ...state.current_process, matches: action.payload, status: 'completed' }
          : undefined,
        match_history: [...action.payload, ...state.match_history].slice(0, 100) // Keep last 100
      };
    
    case 'ADD_RECENT_SEARCH':
      return {
        ...state,
        recent_searches: [action.payload, ...state.recent_searches.filter(s => s.id !== action.payload.id)].slice(0, 10)
      };
    
    case 'SET_FILTERS':
      return { ...state, active_filters: { ...state.active_filters, ...action.payload } };
    
    case 'ADD_SAVED_MATCH':
      return {
        ...state,
        saved_matches: [action.payload, ...state.saved_matches.filter(m => m.id !== action.payload.id)]
      };
    
    case 'REMOVE_SAVED_MATCH':
      return {
        ...state,
        saved_matches: state.saved_matches.filter(m => m.id !== action.payload)
      };
    
    case 'ADD_INTERACTION':
      return {
        ...state,
        user_interactions: [action.payload, ...state.user_interactions].slice(0, 1000) // Keep last 1000
      };
    
    case 'CLEAR_HISTORY':
      return {
        ...state,
        recent_searches: [],
        match_history: [],
        user_interactions: []
      };
    
    case 'LOAD_PERSISTED_DATA':
      return { ...state, ...action.payload };
    
    case 'SET_ERROR':
      return {
        ...state,
        current_process: state.current_process
          ? { ...state.current_process, status: 'error', error: action.payload }
          : undefined
      };
    
    default:
      return state;
  }
}

const MatchingContext = createContext<MatchingContextValue | undefined>(undefined);

export function MatchingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(matchingReducer, initialState);

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Persist data when state changes
  useEffect(() => {
    persistData();
  }, [state.recent_searches, state.saved_matches, state.user_interactions, state.active_filters]);

  const loadPersistedData = async () => {
    try {
      const [recentSearches, savedMatches, interactions, filters] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_MATCHES),
        AsyncStorage.getItem(STORAGE_KEYS.USER_INTERACTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.FILTERS),
      ]);

      const persistedData: Partial<MatchingState> = {};
      
      if (recentSearches) persistedData.recent_searches = JSON.parse(recentSearches);
      if (savedMatches) persistedData.saved_matches = JSON.parse(savedMatches);
      if (interactions) persistedData.user_interactions = JSON.parse(interactions);
      if (filters) persistedData.active_filters = { ...initialState.active_filters, ...JSON.parse(filters) };

      if (Object.keys(persistedData).length > 0) {
        dispatch({ type: 'LOAD_PERSISTED_DATA', payload: persistedData });
      }
    } catch (error) {
      console.error('[MatchingContext] Error loading persisted data:', error);
    }
  };

  const persistData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(state.recent_searches)),
        AsyncStorage.setItem(STORAGE_KEYS.SAVED_MATCHES, JSON.stringify(state.saved_matches)),
        AsyncStorage.setItem(STORAGE_KEYS.USER_INTERACTIONS, JSON.stringify(state.user_interactions)),
        AsyncStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(state.active_filters)),
      ]);
    } catch (error) {
      console.error('[MatchingContext] Error persisting data:', error);
    }
  };

  const convertApiResponseToMatchResult = (apiMatch: ApiMatchResponse): MatchResult => {
    const scores: MatchScore = {
      text_similarity: apiMatch.text_similarity || 0,
      feature_similarity: apiMatch.feature_similarity || 0,
      location_score: apiMatch.location_score || 0,
      intent_compatibility: apiMatch.intent_compatibility || 0,
      temporal_compatibility: apiMatch.temporal_compatibility || 0,
      combined_score: apiMatch.combined_score,
      confidence_score: apiMatch.confidence_score || 0,
    };

    return {
      intent_id: apiMatch.intent_id,
      user_name: apiMatch.user_name,
      location_name: apiMatch.location_name,
      raw_query: apiMatch.raw_query,
      category: apiMatch.category,
      post_type: apiMatch.post_type as 'demand' | 'supply',
      match_quality: (apiMatch.match_quality as any) || 'fair',
      created_at: apiMatch.created_at,
      scores,
    };
  };

  const startSearch = useCallback(async (query: string, location?: string): Promise<void> => {
    const searchQuery: SearchQuery = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date().toISOString(),
      location,
    };

    const process: MatchingProcess = {
      query: searchQuery,
      intent_result: null,
      matches: [],
      status: 'parsing',
    };

    dispatch({ type: 'SET_CURRENT_SEARCH', payload: searchQuery });
    dispatch({ type: 'SET_CURRENT_PROCESS', payload: process });
    dispatch({ type: 'ADD_RECENT_SEARCH', payload: searchQuery });

    try {
      const startTime = Date.now();

      // Check authentication first
      const authState = await authServiceV2.checkAuthState();
      if (!authState.isAuthenticated || !authState.token) {
        throw new Error('Authentication required to perform searches');
      }

      // Use MatchingService with auth token
      console.log('[MatchingContext] Creating intent for:', query);
      dispatch({ type: 'UPDATE_PROCESS_STATUS', payload: 'parsing' });

      const searchResult = await matchingService.performSearch(
        query.trim(),
        location,
        authState.token
      );

      if (searchResult.error) {
        throw new Error(searchResult.error);
      }

      const intentResponse = searchResult.intent;
      if (!intentResponse) {
        throw new Error('Failed to create intent');
      }

      const parsingTime = Date.now() - startTime;

      // Convert to our types
      const intentResult: MatchingProcess['intent_result'] = {
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
        processing_time_ms: parsingTime,
      };

      const updatedProcess: MatchingProcess = {
        ...process,
        intent_result: intentResult,
        status: 'searching',
      };

      dispatch({ type: 'SET_CURRENT_PROCESS', payload: updatedProcess });

      // Step 2: Get Matches (already included in searchResult)
      console.log('[MatchingContext] Processing matches from search result');
      dispatch({ type: 'UPDATE_PROCESS_STATUS', payload: 'matching' });

      const matchingStartTime = Date.now();
      const matches: MatchResult[] = searchResult.matches;
      const matchingTime = Date.now() - matchingStartTime;

      // Apply filters
      const filteredMatches = applyFiltersToMatches(matches, state.active_filters);

      const finalProcess: MatchingProcess = {
        ...updatedProcess,
        matches: filteredMatches,
        status: 'completed',
        processing_stats: {
          parsing_time_ms: parsingTime,
          matching_time_ms: matchingTime,
          total_candidates: matches.length,
          filtered_results: filteredMatches.length,
        },
      };

      dispatch({ type: 'SET_MATCHES', payload: filteredMatches });
      dispatch({ type: 'SET_CURRENT_PROCESS', payload: finalProcess });

      console.log(`[MatchingContext] Search completed: ${filteredMatches.length} matches found`);

    } catch (error) {
      console.error('[MatchingContext] Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.active_filters]);

  const applyFiltersToMatches = (matches: MatchResult[], filters: SearchFilter): MatchResult[] => {
    let filtered = [...matches];

    // Filter by category
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(match => filters.category!.includes(match.category));
    }

    // Filter by post type
    if (filters.post_type) {
      filtered = filtered.filter(match => match.post_type === filters.post_type);
    }

    // Filter by minimum score
    if (filters.min_score) {
      filtered = filtered.filter(match => match.scores.combined_score >= filters.min_score!);
    }

    // Filter by match quality
    if (filters.match_quality && filters.match_quality.length > 0) {
      filtered = filtered.filter(match => filters.match_quality!.includes(match.match_quality));
    }

    // Sort results
    if (filters.sort_by) {
      filtered.sort((a, b) => {
        switch (filters.sort_by) {
          case 'relevance':
            return b.scores.combined_score - a.scores.combined_score;
          case 'distance':
            return (a.distance_km || 999) - (b.distance_km || 999);
          case 'recency':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'score':
            return b.scores.combined_score - a.scores.combined_score;
          default:
            return 0;
        }
      });
    }

    // Limit results
    if (filters.max_results) {
      filtered = filtered.slice(0, filters.max_results);
    }

    return filtered;
  };

  const applyFilters = useCallback((filters: Partial<SearchFilter>) => {
    const newFilters = { ...state.active_filters, ...filters };
    dispatch({ type: 'SET_FILTERS', payload: newFilters });

    // Re-apply filters to current matches if we have any
    if (state.current_process && state.current_process.matches.length > 0) {
      const filteredMatches = applyFiltersToMatches(state.current_process.matches, newFilters);
      dispatch({ type: 'SET_MATCHES', payload: filteredMatches });
    }
  }, [state.active_filters, state.current_process]);

  const saveMatch = useCallback((match: MatchResult, notes?: string) => {
    const savedMatch: SavedMatch = {
      id: `saved_${match.intent_id}_${Date.now()}`,
      match,
      saved_at: new Date().toISOString(),
      notes,
      tags: [],
    };

    dispatch({ type: 'ADD_SAVED_MATCH', payload: savedMatch });

    // Record interaction
    const interaction: MatchInteraction = {
      match_id: match.intent_id,
      action: 'liked',
      timestamp: new Date().toISOString(),
      notes,
    };

    dispatch({ type: 'ADD_INTERACTION', payload: interaction });
  }, []);

  const removeMatch = useCallback((matchId: string) => {
    dispatch({ type: 'REMOVE_SAVED_MATCH', payload: matchId });
  }, []);

  const recordInteraction = useCallback((interaction: MatchInteraction) => {
    dispatch({ type: 'ADD_INTERACTION', payload: interaction });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const retrySearch = useCallback(async () => {
    if (state.current_search) {
      await startSearch(state.current_search.query, state.current_search.location);
    }
  }, [state.current_search, startSearch]);

  const value: MatchingContextValue = {
    state,
    actions: {
      startSearch,
      applyFilters,
      saveMatch,
      removeMatch,
      recordInteraction,
      clearHistory,
      retrySearch,
    },
  };

  return (
    <MatchingContext.Provider value={value}>
      {children}
    </MatchingContext.Provider>
  );
}

export function useMatching(): MatchingContextValue {
  const context = useContext(MatchingContext);
  if (!context) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
}