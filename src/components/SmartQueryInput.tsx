import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../themes/glassmorphismTheme';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';

interface QueryParseResult {
  structured_query: any;
  follow_up_questions: string[];
  is_complete: boolean;
  query_type: 'transactional' | 'knowledge';
}

interface SmartQueryInputProps {
  onSubmit: (query: string, structuredData?: any) => void;
  onQueryParsed?: (result: QueryParseResult) => void;
  placeholder?: string;
  initialQuery?: string;
  location?: string;
}

const SmartQueryInput: React.FC<SmartQueryInputProps> = ({
  onSubmit,
  onQueryParsed,
  placeholder = "What are you looking for? (Buy, sell, rent, meet, learn...)",
  initialQuery = "",
  location,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<QueryParseResult | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<{ [key: number]: string }>({});
  const [isTyping, setIsTyping] = useState(false);

  // Example intents for quick selection
  const exampleQueries = [
    { icon: 'laptop', text: 'Looking for laptop', category: 'buy' },
    { icon: 'directions-car', text: 'Selling my car', category: 'sell' },
    { icon: 'home', text: 'Room for rent', category: 'rent' },
    { icon: 'people', text: 'Find activity partner', category: 'meet' },
    { icon: 'school', text: 'Need a tutor', category: 'learn' },
  ];

  const handleQuerySubmit = async () => {
    if (!query.trim()) return;

    setIsParsing(true);
    
    // Simulate API call to parse query
    // In real app, this would call your backend
    setTimeout(() => {
      const mockResult: QueryParseResult = {
        structured_query: {
          intent: 'buy',
          category: 'laptop',
          raw_query: query,
        },
        follow_up_questions: [
          `Are you looking in ${location || 'your current location'}?`,
          "Do you have a preferred brand like HP, Dell, or Lenovo?",
          "Any specific features you need? (RAM, storage, processor)",
          "What's your budget range?",
        ].slice(0, Math.floor(Math.random() * 3) + 1), // Random 1-3 questions
        is_complete: false,
        query_type: 'transactional',
      };
      
      setParseResult(mockResult);
      setIsParsing(false);
      
      if (onQueryParsed) {
        onQueryParsed(mockResult);
      }
    }, 1000);
  };

  const handleFollowUpAnswer = (questionIndex: number, answer: string) => {
    setFollowUpAnswers(prev => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleFinalSubmit = () => {
    if (!parseResult) return;

    // Combine original query with follow-up answers
    const enhancedQuery = {
      ...parseResult.structured_query,
      follow_up_responses: followUpAnswers,
      location,
    };

    onSubmit(query, enhancedQuery);
  };

  const allQuestionsAnswered = parseResult?.follow_up_questions.every(
    (_, index) => followUpAnswers[index]?.trim()
  );

  const renderKnowledgeResponse = () => {
    if (parseResult?.query_type !== 'knowledge') return null;

    return (
      <GlassCard style={styles.knowledgeCard}>
        <MaterialIcons name="lightbulb" size={24} color={theme.colors.accent} />
        <Text style={styles.knowledgeText}>
          {/* This would contain the knowledge response from backend */}
          Based on your query, here's what I found...
        </Text>
        <TouchableOpacity style={styles.relatedAction}>
          <Text style={styles.relatedActionText}>
            Find related products/services on the platform
          </Text>
          <MaterialIcons name="arrow-forward" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </GlassCard>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Main Query Input */}
      <GlassCard style={styles.inputCard}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="search" size={24} color={theme.colors.secondary} />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.secondary}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setIsTyping(true);
              setParseResult(null);
            }}
            onSubmitEditing={handleQuerySubmit}
            multiline
            maxLength={200}
          />
          {isParsing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <TouchableOpacity onPress={handleQuerySubmit} disabled={!query.trim()}>
              <MaterialIcons 
                name="send" 
                size={24} 
                color={query.trim() ? theme.colors.primary : theme.colors.secondary} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Example Queries */}
        {!isTyping && !parseResult && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.examplesContainer}
          >
            {exampleQueries.map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleChip}
                onPress={() => {
                  setQuery(example.text);
                  setIsTyping(false);
                }}
              >
                <MaterialIcons name={example.icon} size={16} color={theme.colors.primary} />
                <Text style={styles.exampleText}>{example.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </GlassCard>

      {/* Knowledge Response */}
      {renderKnowledgeResponse()}

      {/* Follow-up Questions */}
      {parseResult && parseResult.follow_up_questions.length > 0 && (
        <GlassCard style={styles.followUpCard}>
          <Text style={styles.followUpTitle}>
            Help me understand better:
          </Text>
          
          {parseResult.follow_up_questions.map((question, index) => (
            <View key={index} style={styles.followUpItem}>
              <Text style={styles.followUpQuestion}>{question}</Text>
              <TextInput
                style={styles.followUpInput}
                placeholder="Your answer..."
                placeholderTextColor={theme.colors.secondary}
                value={followUpAnswers[index] || ''}
                onChangeText={(text) => handleFollowUpAnswer(index, text)}
                onSubmitEditing={() => {
                  if (index < parseResult.follow_up_questions.length - 1) {
                    // Focus next input
                  }
                }}
              />
            </View>
          ))}

          <NeonButton
            title="Find Matches"
            onPress={handleFinalSubmit}
            disabled={!allQuestionsAnswered}
            style={styles.submitButton}
          />
        </GlassCard>
      )}

      {/* Parsed Structure Preview (for development) */}
      {__DEV__ && parseResult && (
        <GlassCard style={styles.debugCard}>
          <Text style={styles.debugTitle}>Parsed Structure:</Text>
          <Text style={styles.debugText}>
            {JSON.stringify(parseResult.structured_query, null, 2)}
          </Text>
        </GlassCard>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputCard: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    color: theme.colors.text,
    maxHeight: 100,
  },
  examplesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  exampleText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 6,
  },
  knowledgeCard: {
    padding: 16,
    marginBottom: 16,
  },
  knowledgeText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 12,
    lineHeight: 20,
  },
  relatedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '20',
  },
  relatedActionText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  followUpCard: {
    padding: 16,
    marginBottom: 16,
  },
  followUpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  followUpItem: {
    marginBottom: 16,
  },
  followUpQuestion: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  followUpInput: {
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.background + '40',
  },
  submitButton: {
    marginTop: 8,
  },
  debugCard: {
    padding: 16,
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    color: theme.colors.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});