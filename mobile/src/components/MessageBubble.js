import { StyleSheet, Text, View } from 'react-native';

export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.own : styles.other]}>
        {!isOwn && <Text style={styles.name}>{message.username}</Text>}
        <Text style={[styles.text, isOwn && styles.ownText]}>{message.text}</Text>
        <Text style={[styles.time, isOwn && styles.ownTime]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 12 },
  rowOwn: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12 },
  own: { backgroundColor: '#4f46e5', borderBottomRightRadius: 4 },
  other: { backgroundColor: '#f1f1f4', borderBottomLeftRadius: 4 },
  name: { fontSize: 12, fontWeight: '700', color: '#4f46e5', marginBottom: 2 },
  text: { fontSize: 16, color: '#111' },
  ownText: { color: '#fff' },
  time: { fontSize: 11, color: '#777', marginTop: 4, alignSelf: 'flex-end' },
  ownTime: { color: '#d7d5ff' },
});
