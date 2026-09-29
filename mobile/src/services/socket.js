import { io } from 'socket.io-client';
import { API_URL } from '../config';

// One shared socket for the whole app. ChatScreen connects and disconnects it.
export const socket = io(API_URL, {
  autoConnect: false,
  transports: ['websocket'],
});
