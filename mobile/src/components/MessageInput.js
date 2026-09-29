import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// onSend(text) must return true on success, so failed messages stay in the box for a retry.
// onTyping() is called whenever the text changes (the parent throttles it).
export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleChange = (value) => {
    setText(value);
    if (value.trim() && onTyping) onTyping();
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const ok = await onSend(trimmed);
    if (ok) setText('');
    setSending(false);
  };

  const disabled = !text.trim() || sending;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Type a message"
        value={text}
        onChangeText={handleChange}
        multiline
        maxLength={1000}
      />
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabled]}
        onPress={submit}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#f1f1f4',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    marginLeft: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
