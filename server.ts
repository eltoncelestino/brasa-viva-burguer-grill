import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  globalThis.__io = io;

  io.on("connection", (socket) => {
    socket.on("join:restaurant", (restaurantId: string) => {
      if (typeof restaurantId === "string" && restaurantId.length > 0) {
        socket.join(`restaurant:${restaurantId}`);
      }
    });

    socket.on("join:order", (orderId: string) => {
      if (typeof orderId === "string" && orderId.length > 0) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on("leave:restaurant", (restaurantId: string) => {
      if (typeof restaurantId === "string") {
        socket.leave(`restaurant:${restaurantId}`);
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error("Erro fatal no servidor HTTP:", err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Brasa Viva SaaS rodando em http://${hostname}:${port}`);
    });
});
