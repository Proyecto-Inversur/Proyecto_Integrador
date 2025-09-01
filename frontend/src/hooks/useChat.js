import { useEffect, useRef } from 'react';
import { subscribeToChat } from '../services/chatWs';

const useChat = (chatId, setMensajes) => {
  const chatBoxRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    let socket;
    let reconnectTimeout;

    const connect = () => {
      if (!chatId) return;

      socket = subscribeToChat(chatId, (data) => {
        setMensajes((prev) => (Array.isArray(data) ? data : [...prev, data]));
        scrollToBottom();
      });

      if (socket) {
        socket.onclose = () => {
          reconnectTimeout = setTimeout(connect, 5000);
        };

        socket.onerror = () => {
          socket.close();
        };
      }
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [chatId, setMensajes]);

  return { chatBoxRef, scrollToBottom };
};

export default useChat;