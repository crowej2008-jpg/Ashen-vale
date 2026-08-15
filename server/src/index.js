import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { sanitizeFormation, runLiveBattle } from "./match.js";

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get("/", (_req, res) => res.json({ ok: true, service: "ashenvale-server" }));
app.get("/health", (_req, res) => res.json({ ok: true, queue: queue.length, rooms: rooms.size }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_ORIGIN } });

// In-memory matchmaking queue and active rooms. Fine for a single server
// instance / dev deployment; swap for Redis if you need to scale out.
const queue = [];
const rooms = new Map(); // roomId -> { timer, playerA, playerB }
const socketMeta = new Map(); // socketId -> { name, formation }

function removeFromQueue(socketId) {
  const idx = queue.findIndex((p) => p.socketId === socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

function tryMatch() {
  while (queue.length >= 2) {
    const playerA = queue.shift();
    const playerB = queue.shift();
    const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    io.sockets.sockets.get(playerA.socketId)?.join(roomId);
    io.sockets.sockets.get(playerB.socketId)?.join(roomId);
    const { timer } = runLiveBattle(io, roomId, playerA, playerB);
    rooms.set(roomId, { timer, playerA, playerB });

    // Clean the room up once the battle finishes (steps length known ahead
    // of time via battle:end, but we just poll timer completion lazily).
    const cleanupCheck = setInterval(() => {
      if (!rooms.has(roomId)) return clearInterval(cleanupCheck);
      // runLiveBattle's own interval clears itself; we just remove bookkeeping
      // a bit after battle:end would have fired.
    }, 5000);
  }
}

io.on("connection", (socket) => {
  socket.emit("connected", { id: socket.id });

  socket.on("queue:join", (payload = {}) => {
    const name = String(payload.name || "Commander").slice(0, 24);
    const formation = sanitizeFormation(payload.formation);
    if (formation.length === 0) {
      socket.emit("queue:error", { message: "Your formation is empty. Add heroes before queueing." });
      return;
    }
    removeFromQueue(socket.id);
    const entry = { socketId: socket.id, name, formation };
    socketMeta.set(socket.id, entry);
    queue.push(entry);
    socket.emit("queue:joined", { position: queue.length });
    io.emit("queue:size", { size: queue.length });
    tryMatch();
  });

  socket.on("queue:leave", () => {
    removeFromQueue(socket.id);
    io.emit("queue:size", { size: queue.length });
  });

  socket.on("disconnect", () => {
    removeFromQueue(socket.id);
    socketMeta.delete(socket.id);
    for (const [roomId, room] of rooms) {
      if (room.playerA.socketId === socket.id || room.playerB.socketId === socket.id) {
        const survivor = room.playerA.socketId === socket.id ? room.playerB : room.playerA;
        io.to(survivor.socketId).emit("battle:end", { winner: "you", reason: "opponent_disconnected" });
        clearInterval(room.timer);
        rooms.delete(roomId);
      }
    }
    io.emit("queue:size", { size: queue.length });
  });
});

server.listen(PORT, () => {
  console.log(`AshenVale PvP server listening on :${PORT} (allowing client origin ${CLIENT_ORIGIN})`);
});
