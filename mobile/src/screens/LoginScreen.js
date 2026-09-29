import { useState } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

export default function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const trimmed = name.trim();

  const submit = () => {
    if (trimmed) onLogin(trimmed);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.title}>Chat</Text>
      <Text style={styles.subtitle}>Pick a username to join</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={name}
        onChangeText={setName}
        maxLength={30}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <TouchableOpacity
        style={[styles.button, !trimmed && styles.disabled]}
        onPress={submit}
        disabled={!trimmed}
      >
        <Text style={styles.buttonText}>Join chat</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 36, fontWeight: '800', color: '#4f46e5', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  input: {
    backgroundColor: '#f1f1f4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    marginBottom: 12,
  },
  button: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
});
