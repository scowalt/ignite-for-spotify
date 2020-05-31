import dotenv from 'dotenv';
import dotenvexpand from 'dotenv-expand';
const environment: dotenv.DotenvConfigOutput = dotenv.config();
dotenvexpand(environment);

import WebSocket from 'ws';

// Setup WS server
const wsServer: WebSocket.Server = new WebSocket.Server({ port: parseInt(process.env.WEBSOCKET_SERVER_PORT!, 10) });
wsServer.on('connection', (socket: WebSocket) => {
	socket.on("message", (data: WebSocket.Data) => {
		// eslint-disable-next-line no-console
		console.log(data);
	});
});
