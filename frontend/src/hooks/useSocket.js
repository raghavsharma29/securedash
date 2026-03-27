import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let socketInstance = null;

export const useSocket = (eventHandlers = {}) => {
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(window.location.origin, { transports: ["websocket"] });
    }

    const socket = socketInstance;
    const entries = Object.entries(handlersRef.current);
    entries.forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      entries.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, []);

  return socketInstance;
};
