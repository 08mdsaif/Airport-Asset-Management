const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let ioInstance;

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    },
  });

  // Authenticate socket connections using the same JWT used for the REST API
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins a private room keyed by their own ID -> targeted notifications
    socket.join(`user:${socket.userId}`);
    // Admins/supervisors join a broadcast room for dashboard-wide updates
    if (socket.role === 'admin' || socket.role === 'supervisor') {
      socket.join('admins');
    }

    console.log(`🔌 Socket connected: user ${socket.userId} (${socket.role})`);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: user ${socket.userId}`);
    });
  });

  ioInstance = io;
  return io;
};

const getIO = () => {
  if (!ioInstance) throw new Error('Socket.IO not initialized yet');
  return ioInstance;
};

module.exports = { initSocket, getIO };
