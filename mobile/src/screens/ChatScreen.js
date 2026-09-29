import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchMessages, sendMessage } from '../services/api';
import { socket } from '../services/socket';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';

function formatTyping(users) {
  if (users.length === 0) return '';
  if (users.length === 1) return `${users[0]} is typing...`;
  if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
  return 'Several people are typing...';
}

export default function ChatScreen({ username, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(socket.connected);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const listRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingEmit = useRef(0);

  // Add a message unless we already have it (it can arrive via REST and socket)
  const addMessage = useCallback((msg) => {
    setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      setMessages(await fetchMessages());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let firstConnect = true;

    const onConnect = () => {
      setConnected(true);
      // After a reconnect, reload history to catch anything we missed
      if (!firstConnect) loadHistory();
      firstConnect = false;
    };
    const onDisconnect = () => {
      setConnected(false);
      setOnlineUsers([]);
      setTypingUsers([]);
    };
    const onNewMessage = (msg) => {
      addMessage(msg);
      setTypingUsers((prev) => prev.filter((u) => u !== msg.username));
    };
    const onTyping = ({ username: u }) =>
      setTypingUsers((prev) => (prev.includes(u) ? prev : [...prev, u]));
    const onStopTyping = ({ username: u }) =>
      setTypingUsers((prev) => prev.filter((x) => x !== u));
    const onOnlineUsers = (list) => {
      setOnlineUsers(list);
      // Drop typing indicators for anyone who went offline
      setTypingUsers((prev) => prev.filter((u) => list.includes(u)));
    };

    loadHistory();
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onDisconnect);
    socket.on('new_message', onNewMessage);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    socket.on('online_users', onOnlineUsers);

    socket.auth = { username }; // tells the server who we are
    socket.connect();

    return () => {
      clearTimeout(typingTimer.current);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onDisconnect);
      socket.off('new_message', onNewMessage);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.off('online_users', onOnlineUsers);
      socket.disconnect();
    };
  }, [username, addMessage, loadHistory]);

  // Tell others we're typing (at most every 2s), and that we stopped after a pause
  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypingEmit.current > 2000) {
      socket.emit('typing');
      lastTypingEmit.current = now;
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('stop_typing');
      lastTypingEmit.current = 0;
    }, 2500);
  };

  const handleSend = async (text) => {
    try {
      setError(null);
      const saved = await sendMessage(username, text);
      addMessage(saved);
      clearTimeout(typingTimer.current);
      socket.emit('stop_typing');
      lastTypingEmit.current = 0;
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Chat</Text>
          <Text style={styles.subtitle}>Signed in as {username}</Text>
        </View>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.leave}>Leave</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.onlineBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {onlineUsers.length === 0 && <Text style={styles.muted}>Connecting...</Text>}
          {onlineUsers.map((u) => (
            <View key={u} style={styles.chip}>
              <View style={styles.dot} />
              <Text style={styles.chipText}>{u === username ? `${u} (you)` : u}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {!connected && <Text style={styles.warning}>Connection lost. Reconnecting...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#4f46e5" />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m._id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.username === username} />
          )}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hi!</Text>}
        />
      )}

      <View style={styles.typingRow}>
        <Text style={styles.typing}>{formatTyping(typingUsers)}</Text>
      </View>
      <MessageInput onSend={handleSend} onTyping={handleTyping} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#4f46e5' },
  subtitle: { fontSize: 12, color: '#777' },
  leave: { color: '#d33', fontWeight: '600', fontSize: 16 },
  onlineBar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f3',
  },
  chip: { flexDirection: 'row', alignItems: 'center', marginRight: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 5 },
  chipText: { fontSize: 13, color: '#333' },
  muted: { fontSize: 13, color: '#999' },
  warning: { backgroundColor: '#fff4d6', color: '#8a6100', textAlign: 'center', padding: 6 },
  error: { backgroundColor: '#fde2e2', color: '#a11', textAlign: 'center', padding: 6 },
  loader: { flex: 1 },
  list: { paddingVertical: 8, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  typingRow: { minHeight: 22, paddingHorizontal: 14, justifyContent: 'center' },
  typing: { fontSize: 13, color: '#777', fontStyle: 'italic' },
});
