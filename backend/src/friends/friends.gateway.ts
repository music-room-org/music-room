import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway()
export class FriendsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  activeUsers = new Map<string, string>();

  handleConnection(client: Socket) {

	const authorization = client.handshake.headers.authorization;

	if (!authorization) {
		return;
	}

	const token = authorization.split(' ')[1];

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
		const userId = decoded.id;
	
		if (userId) {
			this.activeUsers.set(userId, client.id);
		}
	} catch {
		client.disconnect();
	}
  }

  handleDisconnect(client: Socket) {
	for (const [userId, socketId] of this.activeUsers.entries()) {
		if (socketId === client.id) {
			this.activeUsers.delete(userId);
			break;
		}
	}
  }
  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
	  return 'Hello world!';
  }
}

