import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";

const PORT = process.env.PORT || 7100;
const app = express();
app.use(express.static("public"));
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const ySocketIO = new YSocketIO(io);
ySocketIO.initialize();

// Handling another socket namespace
io.on("connection", (socket) => {
  console.log(`[connection] Connected with user: ${socket.id}`);

  // You can add another socket logic here...
  socket.on("disconnect", () => {
    console.log(`[disconnect] Disconnected with user: ${socket.id}`);
  });
});

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running." });
});

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Ok." });
});

httpServer.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
