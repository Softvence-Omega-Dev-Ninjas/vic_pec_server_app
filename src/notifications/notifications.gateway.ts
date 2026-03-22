import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || '*' },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server; // '!' (non-null assertion) use korle TS bujhbe eta runtime-e thakbe

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId && userId !== 'undefined') {
      void client.join(userId);
      console.log(`User ${userId} connected and joined room.`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Specific user-ke notification pathanor function
  sendToUser(userId: string, data: any) {
    if (this.server) {
      this.server.to(userId).emit('notification', data);
    }
  }

  // Sobai-ke notification pathanor function
  sendToAll(data: any) {
    if (this.server) {
      this.server.emit('admin-notification', data);
    }
  }
}
