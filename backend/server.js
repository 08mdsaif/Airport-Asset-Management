require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Attach Socket.IO to the HTTP server (real-time notifications, complaint updates, etc.)
const io = initSocket(server);
app.set('io', io); // make io accessible inside controllers via req.app.get('io')

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Airport Asset Management API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
