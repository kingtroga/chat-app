require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const initSockets = require('./sockets');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB(process.env.MONGODB_URI);

  const server = http.createServer(app);
  const io = initSockets(server);
  app.set('io', io); // lets controllers broadcast

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
