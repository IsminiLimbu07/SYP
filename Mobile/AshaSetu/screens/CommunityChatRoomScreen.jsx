// frontend/src/screens/CommunityChatRoomScreen.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

// apiConfig.BASE_URL is already "https://ngrok-url/api"
// So we just use it directly — no modification needed
const BASE = apiConfig.BASE_URL;

export default function CommunityChatroomScreen({ navigation, route }) {
  const { token, user } = useContext(AuthContext);
  const roomTitle = route?.params?.title || 'Community Chat';

  const [messages, setMessages]       = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);

  const scrollViewRef = useRef(null);
  const sendingRef    = useRef(false);  // safe inside interval closure
  const pollingRef    = useRef(null);

  useEffect(() => {
    loadMessages();
    pollingRef.current = setInterval(loadMessages, 4000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // GET https://ngrok/api/chat/messages
  const loadMessages = async () => {
    if (sendingRef.current) return; // don't overwrite optimistic messages mid-send
    try {
      const url = `${BASE}/chat/messages`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 80);
      }
    } catch (error) {
      console.error('[Chat] loadMessages error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // POST https://ngrok/api/chat/send
  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text) return;

    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      message_id:          tempId,
      sender_id:           user.user_id,
      sender_name:         user.full_name,
      sender_is_volunteer: user.is_volunteer || false,
      message_text:        text,
      created_at:          new Date().toISOString(),
      is_temp:             true,
    };

    // Optimistically show message immediately
    setMessages((prev) => [...prev, tempMessage]);
    setMessageText('');
    setSending(true);
    sendingRef.current = true;
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const url = `${BASE}/chat/send`;
      console.log('[Chat] sendMessage ->', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message_text: text }),
      });

      const data = await response.json();
      console.log('[Chat] send response:', data.success, data.message);

      if (data.success) {
        // Replace only this specific temp message with the real one from server
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === tempId ? { ...data.data, is_temp: false } : msg
          )
        );
      } else {
        // Remove temp message and restore the text so user can retry
        setMessages((prev) => prev.filter((msg) => msg.message_id !== tempId));
        setMessageText(text);
        Alert.alert('Send Failed', data.message || 'Could not send message. Please try again.');
      }
    } catch (error) {
      console.error('[Chat] sendMessage error:', error.message);
      setMessages((prev) => prev.filter((msg) => msg.message_id !== tempId));
      setMessageText(text);
      Alert.alert('Network Error', 'Could not send message. Check your connection and try again.');
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  // DELETE https://ngrok/api/chat/messages/:id  (long press own message)
  const handleDeleteMessage = (messageId) => {
    Alert.alert('Delete Message', 'Delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const url = `${BASE}/chat/messages/${messageId}`;
            const response = await fetch(url, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
              setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
            }
          } catch (error) {
            console.error('[Chat] delete error:', error.message);
          }
        },
      },
    ]);
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const formatDate = (ts) => {
    const date      = new Date(ts);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString())     return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupByDate = () => {
    const g = {};
    messages.forEach((msg) => {
      const k = new Date(msg.created_at).toDateString();
      if (!g[k]) g[k] = [];
      g[k].push(msg);
    });
    return g;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading chatroom…</Text>
      </View>
    );
  }

  const grouped       = groupByDate();
  const uniqueSenders = new Set(messages.map((m) => m.sender_id)).size;

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{roomTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {messages.length} messages · {uniqueSenders} member{uniqueSenders !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <MaterialCommunityIcons name="account-group" size={22} color="rgba(255,255,255,0.8)" />
        </View>
      </View>

      {/* ── Info Banner ── */}
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="information" size={16} color="#8B0000" />
        <Text style={styles.infoBannerText}>
          Global community chat — be respectful and supportive 🩸
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ── Messages ── */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {Object.keys(grouped).length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="chat-outline" size={64} color="#DDD" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Be the first to start a conversation!</Text>
            </View>
          ) : (
            Object.keys(grouped).map((dateKey) => (
              <View key={dateKey}>
                {/* Date Divider */}
                <View style={styles.dateDivider}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateDividerText}>{formatDate(new Date(dateKey))}</Text>
                  <View style={styles.dateLine} />
                </View>

                {grouped[dateKey].map((message, index) => {
                  const isOwn      = message.sender_id === user.user_id;
                  const prevMsg    = grouped[dateKey][index - 1];
                  const showAvatar = !prevMsg || prevMsg.sender_id !== message.sender_id;

                  return (
                    <TouchableOpacity
                      key={message.message_id}
                      style={[
                        styles.messageWrapper,
                        isOwn ? styles.ownWrapper : styles.otherWrapper,
                      ]}
                      onLongPress={() => {
                        if (isOwn && !message.is_temp) handleDeleteMessage(message.message_id);
                      }}
                      activeOpacity={0.9}
                    >
                      {/* Avatar (other users only) */}
                      {!isOwn && showAvatar ? (
                        <View style={styles.avatarContainer}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {(message.sender_name || '?').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      ) : !isOwn ? (
                        <View style={styles.avatarSpacer} />
                      ) : null}

                      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
                        {/* Sender name + volunteer badge */}
                        {!isOwn && showAvatar && (
                          <View style={styles.senderHeader}>
                            <Text style={styles.senderName}>{message.sender_name}</Text>
                            {message.sender_is_volunteer && (
                              <View style={styles.volBadge}>
                                <MaterialCommunityIcons name="shield-star" size={11} color="#fff" />
                                <Text style={styles.volBadgeText}>Volunteer</Text>
                              </View>
                            )}
                          </View>
                        )}

                        <Text
                          style={[
                            styles.messageText,
                            isOwn ? styles.ownText : styles.otherText,
                            message.is_temp && styles.tempText,
                          ]}
                        >
                          {message.message_text}
                        </Text>

                        <Text style={[styles.timeText, isOwn ? styles.ownTime : styles.otherTime]}>
                          {formatTime(message.created_at)}
                          {message.is_temp ? ' · Sending…' : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>

        {/* ── Input Bar ── */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F0F0F0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' },
  loadingText:      { marginTop: 10, fontSize: 16, color: '#666' },
  header: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn:        { padding: 4 },
  headerCenter:   { flex: 1 },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerRight:    { padding: 4 },
  infoBanner: {
    backgroundColor: '#FFF9E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E0B0',
  },
  infoBannerText:    { flex: 1, fontSize: 12, color: '#8B0000', lineHeight: 16 },
  keyboardView:      { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent:   { padding: 14, paddingBottom: 10 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText:    { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#BBB', marginTop: 8 },
  dateDivider:  { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  dateLine:     { flex: 1, height: 1, backgroundColor: '#D8D8D8' },
  dateDividerText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginHorizontal: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageWrapper: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
  ownWrapper:     { justifyContent: 'flex-end' },
  otherWrapper:   { justifyContent: 'flex-start' },
  avatarContainer: { marginRight: 7, marginBottom: 2 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText:   { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  avatarSpacer: { width: 41 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#8B0000',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  senderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  senderName:   { fontSize: 13, fontWeight: '700', color: '#8B0000' },
  volBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  volBadgeText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  messageText:  { fontSize: 15, lineHeight: 21 },
  ownText:      { color: '#fff' },
  otherText:    { color: '#222' },
  tempText:     { opacity: 0.65 },
  timeText:     { fontSize: 11, marginTop: 4 },
  ownTime:      { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  otherTime:    { color: '#AAA' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 110,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendButton:         { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B0000', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#BDBDBD' },
});