import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../themes/glassmorphismTheme';
import GlassCard from './GlassCard';

interface MatchScores {
  semantic: number;
  location: number;
  parameters: number;
  price: number;
}

interface AdvancedMatchProps {
  match: {
    intent_id: string;
    user_name: string;
    location_name: string;
    raw_query: string;
    category: string;
    post_type: string;
    composite_score: number;
    distance_km?: number;
    scores?: MatchScores;
    parsed_data?: any;
    created_at: string;
  };
  onPress: () => void;
}

const AdvancedMatchCard: React.FC<AdvancedMatchProps> = ({ match, onPress }) => {
  const getMatchPercentage = () => Math.round(match.composite_score * 100);
  
  const getMatchColor = () => {
    const percentage = getMatchPercentage();
    if (percentage >= 90) return theme.colors.success;
    if (percentage >= 75) return theme.colors.accent;
    return theme.colors.secondary;
  };

  const getIntentIcon = () => {
    const intent = match.parsed_data?.intent || match.post_type;
    switch (intent) {
      case 'sell':
      case 'supply':
        return 'sell';
      case 'buy':
      case 'demand':
        return 'shopping-cart';
      case 'rent':
      case 'rent_out':
        return 'home';
      case 'meet':
      case 'date':
        return 'people';
      case 'learn':
        return 'school';
      default:
        return 'search';
    }
  };

  const formatDistance = () => {
    if (!match.distance_km) return null;
    if (match.distance_km < 1) return `${Math.round(match.distance_km * 1000)}m away`;
    return `${match.distance_km.toFixed(1)}km away`;
  };

  const formatDate = () => {
    const date = new Date(match.created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard style={styles.container}>
        {/* Match Score Badge */}
        <View style={[styles.scoreBadge, { backgroundColor: getMatchColor() }]}>
          <Text style={styles.scoreText}>{getMatchPercentage()}%</Text>
          <Text style={styles.matchText}>MATCH</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <MaterialIcons name={getIntentIcon()} size={24} color={theme.colors.primary} />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{match.user_name}</Text>
                <View style={styles.metaInfo}>
                  <MaterialIcons name="location-on" size={14} color={theme.colors.secondary} />
                  <Text style={styles.location}>{match.location_name}</Text>
                  {formatDistance() && (
                    <>
                      <Text style={styles.separator}>•</Text>
                      <Text style={styles.distance}>{formatDistance()}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
            <Text style={styles.timeAgo}>{formatDate()}</Text>
          </View>

          {/* Query */}
          <Text style={styles.query} numberOfLines={2}>
            {match.raw_query}
          </Text>

          {/* Score Breakdown */}
          {match.scores && (
            <View style={styles.scoreBreakdown}>
              <ScoreItem 
                icon="brain" 
                label="Semantic" 
                score={match.scores.semantic} 
              />
              <ScoreItem 
                icon="map-marker-alt" 
                label="Location" 
                score={match.scores.location} 
              />
              <ScoreItem 
                icon="tags" 
                label="Parameters" 
                score={match.scores.parameters} 
              />
              <ScoreItem 
                icon="dollar-sign" 
                label="Price" 
                score={match.scores.price} 
              />
            </View>
          )}

          {/* Parsed Data Tags */}
          {match.parsed_data && (
            <View style={styles.tags}>
              {match.parsed_data.brand && (
                <Tag label={match.parsed_data.brand} />
              )}
              {match.parsed_data.model && (
                <Tag label={match.parsed_data.model} />
              )}
              {match.parsed_data.year && (
                <Tag label={match.parsed_data.year} />
              )}
              {match.parsed_data.budget && (
                <Tag label={`₹${match.parsed_data.budget}`} />
              )}
            </View>
          )}

          {/* Action */}
          <TouchableOpacity style={styles.chatButton} onPress={onPress}>
            <MaterialIcons name="chat" size={20} color={theme.colors.background} />
            <Text style={styles.chatButtonText}>Start Chat</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const ScoreItem: React.FC<{ icon: string; label: string; score: number }> = ({ 
  icon, 
  label, 
  score 
}) => {
  const percentage = Math.round(score * 100);
  const color = percentage >= 70 ? theme.colors.success : 
                percentage >= 50 ? theme.colors.accent : 
                theme.colors.secondary;
  
  return (
    <View style={styles.scoreItem}>
      <FontAwesome5 name={icon} size={12} color={color} />
      <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
      <Text style={[styles.scoreValue, { color }]}>{percentage}%</Text>
    </View>
  );
};

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  scoreBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    zIndex: 1,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.background,
  },
  matchText: {
    fontSize: 10,
    color: theme.colors.background,
    letterSpacing: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginLeft: 4,
  },
  separator: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginHorizontal: 6,
  },
  distance: {
    fontSize: 12,
    color: theme.colors.accent,
  },
  timeAgo: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  query: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border + '20',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  chatButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});