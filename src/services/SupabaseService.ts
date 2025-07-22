// Supabase Database Service
// Handles user profile, matching, and other data operations
// Works with Firebase Auth for authentication

import { User } from '@/types';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  // Additional profile fields for matching
  bio?: string;
  age?: number;
  location?: string;
  interests?: string[];
  preferences?: {
    age_range?: [number, number];
    distance_range?: number;
    interests?: string[];
  };
}

export interface MatchData {
  id: string;
  user_id: string;
  matched_user_id: string;
  compatibility_score: number;
  match_reason: string;
  created_at: string;
  is_mutual: boolean;
  status: 'pending' | 'accepted' | 'rejected';
}

class SupabaseService {
  private static instance: SupabaseService;
  private supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  private supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // User Profile Operations
  async createUserProfile(firebaseUser: User, firebaseToken: string): Promise<UserProfile | null> {
    console.log('[SupabaseService] Creating user profile for:', firebaseUser.email);
    
    try {
      // In a real implementation, you would:
      // 1. Use the Firebase token to verify the user
      // 2. Create/upsert the user profile in Supabase
      // 3. Set up row level security policies
      
      const userProfile: UserProfile = {
        id: firebaseUser.id,
        email: firebaseUser.email,
        name: firebaseUser.name,
        phone: firebaseUser.phone,
        avatar: firebaseUser.avatar,
        created_at: firebaseUser.createdAt,
        updated_at: firebaseUser.updatedAt,
        is_verified: firebaseUser.isVerified,
      };

      // Mock API call - replace with actual Supabase client calls
      console.log('[SupabaseService] User profile created (mock):', userProfile);
      return userProfile;
    } catch (error) {
      console.error('[SupabaseService] Error creating user profile:', error);
      return null;
    }
  }

  async getUserProfile(userId: string, firebaseToken: string): Promise<UserProfile | null> {
    console.log('[SupabaseService] Fetching user profile for:', userId);
    
    try {
      // Mock implementation - replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('user_profiles')
      //   .select('*')
      //   .eq('id', userId)
      //   .single();
      
      console.log('[SupabaseService] User profile fetched (mock)');
      return null; // Return actual data from Supabase
    } catch (error) {
      console.error('[SupabaseService] Error fetching user profile:', error);
      return null;
    }
  }

  async updateUserProfile(
    userId: string, 
    updates: Partial<UserProfile>, 
    firebaseToken: string
  ): Promise<boolean> {
    console.log('[SupabaseService] Updating user profile for:', userId);
    
    try {
      // Mock implementation - replace with actual Supabase update
      // const { error } = await supabase
      //   .from('user_profiles')
      //   .update({
      //     ...updates,
      //     updated_at: new Date().toISOString(),
      //   })
      //   .eq('id', userId);
      
      console.log('[SupabaseService] User profile updated (mock)');
      return true;
    } catch (error) {
      console.error('[SupabaseService] Error updating user profile:', error);
      return false;
    }
  }

  // Matching Operations
  async getMatches(userId: string, firebaseToken: string): Promise<MatchData[]> {
    console.log('[SupabaseService] Fetching matches for user:', userId);
    
    try {
      // Mock implementation - replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('matches')
      //   .select(`
      //     *,
      //     matched_user:user_profiles(*)
      //   `)
      //   .eq('user_id', userId)
      //   .order('created_at', { ascending: false });
      
      console.log('[SupabaseService] Matches fetched (mock)');
      return []; // Return actual matches from Supabase
    } catch (error) {
      console.error('[SupabaseService] Error fetching matches:', error);
      return [];
    }
  }

  async createMatch(
    userId: string,
    matchedUserId: string,
    compatibilityScore: number,
    matchReason: string,
    firebaseToken: string
  ): Promise<MatchData | null> {
    console.log('[SupabaseService] Creating match between:', userId, 'and', matchedUserId);
    
    try {
      // Mock implementation - replace with actual Supabase insert
      const matchData: MatchData = {
        id: `match_${Date.now()}`,
        user_id: userId,
        matched_user_id: matchedUserId,
        compatibility_score: compatibilityScore,
        match_reason: matchReason,
        created_at: new Date().toISOString(),
        is_mutual: false,
        status: 'pending',
      };
      
      console.log('[SupabaseService] Match created (mock):', matchData);
      return matchData;
    } catch (error) {
      console.error('[SupabaseService] Error creating match:', error);
      return null;
    }
  }

  async updateMatchStatus(
    matchId: string,
    status: 'accepted' | 'rejected',
    firebaseToken: string
  ): Promise<boolean> {
    console.log('[SupabaseService] Updating match status:', matchId, status);
    
    try {
      // Mock implementation - replace with actual Supabase update
      console.log('[SupabaseService] Match status updated (mock)');
      return true;
    } catch (error) {
      console.error('[SupabaseService] Error updating match status:', error);
      return false;
    }
  }

  // Utility methods
  async syncFirebaseUserWithSupabase(firebaseUser: User, firebaseToken: string): Promise<boolean> {
    console.log('[SupabaseService] Syncing Firebase user with Supabase:', firebaseUser.email);
    
    try {
      // Check if user profile exists
      let profile = await this.getUserProfile(firebaseUser.id, firebaseToken);
      
      if (!profile) {
        // Create new profile
        profile = await this.createUserProfile(firebaseUser, firebaseToken);
        return !!profile;
      } else {
        // Update existing profile with latest Firebase data
        const updates: Partial<UserProfile> = {
          email: firebaseUser.email,
          name: firebaseUser.name,
          phone: firebaseUser.phone,
          avatar: firebaseUser.avatar,
          is_verified: firebaseUser.isVerified,
        };
        
        return await this.updateUserProfile(firebaseUser.id, updates, firebaseToken);
      }
    } catch (error) {
      console.error('[SupabaseService] Error syncing user with Supabase:', error);
      return false;
    }
  }

  // Health check
  async checkConnection(): Promise<boolean> {
    try {
      console.log('[SupabaseService] Checking Supabase connection');
      // Mock implementation - replace with actual health check
      return true;
    } catch (error) {
      console.error('[SupabaseService] Supabase connection failed:', error);
      return false;
    }
  }
}

export const supabaseService = SupabaseService.getInstance();