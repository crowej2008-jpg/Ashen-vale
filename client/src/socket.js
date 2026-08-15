import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

// autoConnect: false so we only open the socket once the player actually
// visits the Multiplayer screen, instead of connecting on app load.
export const socket = io(SERVER_URL, { autoConnect: false });
