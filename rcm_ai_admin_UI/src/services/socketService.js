import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:10000');

export const socketService = {
    onSyncProgress: (callback) => {
        socket.on('syncProgress', (data) => {
            callback(data);
        });
    },
    disconnect: () => {
        socket.disconnect();
    }
};

export default socketService;