import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
    SafeAreaView,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/themes';

const { width } = Dimensions.get('window');

const initialMessages = [
    { id: '1', sender: 'bot', text: '👋 Welcome to Connect App!' },
    { id: '2', sender: 'user', text: 'What can you do?' },
    { id: '3', sender: 'bot', text: 'I can assist you with tasks and answer questions.' },
];

export const HomeScreen: React.FC = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState(initialMessages);
    const scrollRef = useRef<FlatList>(null);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: input.trim(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInput('');

        // Ensure scroll to latest message
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const renderItem = ({ item }: { item: typeof messages[0] }) => (
        <View style={item.sender === 'user' ? styles.userBubble : styles.botBubble}>
            <Text style={styles.messageText}>{item.text}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Background */}
            <LinearGradient
                colors={theme.colors.gradients.background}
                style={StyleSheet.absoluteFill}
            />

            {/* Static Navbar */}
            <View style={styles.navbar}>
                <Text style={styles.logo}>🌐 Connect</Text>
                <TouchableOpacity style={styles.menuButton}>
                    <Text style={styles.menuText}>☰</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.contentContainer}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                {/* Chat List */}
                <FlatList
                    ref={scrollRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.chatList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() =>
                        scrollRef.current?.scrollToEnd({ animated: true })
                    }
                />

                {/* Chat Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        textAlignVertical="top"
                    />
                    <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                        <Text style={styles.sendText}>➤</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    navbar: {
        height: 80,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.glass.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    logo: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
    },
    menuButton: {
        padding: 8,
    },
    menuText: {
        fontSize: 24,
        color: theme.colors.text.secondary,
    },
    contentContainer: {
        flex: 1,
        paddingTop: 0, // no overlap with navbar
    },
    chatList: {
        paddingTop: 12,
        paddingBottom: 100,
        paddingHorizontal: 20,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.glass.secondary,
        borderRadius: 16,
        marginBottom: 12,
        padding: 12,
        maxWidth: '75%',
    },
    botBubble: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.glass.primary,
        borderRadius: 16,
        marginBottom: 12,
        padding: 12,
        maxWidth: '75%',
    },
    messageText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.glass.border,
        backgroundColor: theme.colors.background.primary,
    },
    input: {
        flex: 1,
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.glass.secondary,
        padding: 12,
        borderRadius: 12,
        marginRight: 8,
        maxHeight: 120,
    },
    sendButton: {
        padding: 10,
    },
    sendText: {
        fontSize: 20,
        color: theme.colors.neon.blue,
    },
});
