import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' },
});

io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.on('disconnect', () => console.log('client disconnected', socket.id));
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => console.log(`Server listening on :${PORT}`));
