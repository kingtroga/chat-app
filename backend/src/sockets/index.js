const { Server } = require('socket.io');

function cleanUsername(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().slice(0, 30);
  return name || null;
}

function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || '*' },
  });

  // username -> number of open connections (same user can be on two devices)
  const onlineCounts = new Map();
  const onlineList = () => [...onlineCounts.keys()];
  const broadcastOnline = () => io.emit('online_users', onlineList());

  io.on('connection', (socket) => {
    // Clients pass their username when connecting: io(url, { auth: { username } })
    const username = cleanUsername(socket.handshake.auth?.username);
    console.log(`Client connected: ${socket.id} (${username || 'no username'})`);

    if (username) {
      onlineCounts.set(username, (onlineCounts.get(username) || 0) + 1);
      broadcastOnline();
    } else {
      // Anonymous clients aren't listed as online, but can see who is
      socket.emit('online_users', onlineList());
    }

    // Typing indicator: tell everyone else
    socket.on('typing', () => {
      if (username) socket.broadcast.emit('typing', { username });
    });
    socket.on('stop_typing', () => {
      if (username) socket.broadcast.emit('stop_typing', { username });
    });

    socket.on('error', (err) => {
      console.error(`Socket error (${socket.id}):`, err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id} (${reason})`);
      if (!username) return;

      const remaining = (onlineCounts.get(username) || 1) - 1;
      if (remaining <= 0) {
        onlineCounts.delete(username);
        socket.broadcast.emit('stop_typing', { username });
      } else {
        onlineCounts.set(username, remaining);
      }
      broadcastOnline();
    });
  });

  return io;
}

module.exports = initSockets;
