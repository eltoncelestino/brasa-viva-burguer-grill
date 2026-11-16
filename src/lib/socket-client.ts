"use client";

import { io, type Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function getClientSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      path: "/api/socketio",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socketInstance;
}
