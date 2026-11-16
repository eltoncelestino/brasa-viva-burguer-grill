import type { Server as SocketIOServer } from "socket.io";

declare global {
  var __io: SocketIOServer | undefined;
}

export function getSocketServer(): SocketIOServer | undefined {
  return globalThis.__io;
}

export function emitOrderCreated(restaurantId: string, order: unknown): void {
  const io = getSocketServer();
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit("order:created", order);
}

export function emitOrderUpdated(restaurantId: string, orderId: string, order: unknown): void {
  const io = getSocketServer();
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit("order:updated", order);
  io.to(`order:${orderId}`).emit("order:updated", order);
}

export function emitPaymentConfirmed(
  restaurantId: string,
  orderId: string,
  payload: { orderId: string; status: string; paidAt: string }
): void {
  const io = getSocketServer();
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit("payment:confirmed", payload);
  io.to(`order:${orderId}`).emit("payment:confirmed", payload);
}
