import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';

export default function App() {
  const [username, setUsername] = useState(null);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar style="dark" />
        {username ? (
          <ChatScreen username={username} onLogout={() => setUsername(null)} />
        ) : (
          <LoginScreen onLogin={setUsername} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
