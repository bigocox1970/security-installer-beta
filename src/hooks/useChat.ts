import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message } from '../types/chat';

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  hasWelcomeMessage: boolean;
}

interface ChatState {
  chats: Chat[];
  activeChat: string | null;
  createChat: () => string;
  addMessage: (message: Message) => void;
  addWelcomeMessage: (message: string) => void;
  clearChat: (chatId: string) => void;
  setActiveChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  getActiveChat: () => Chat | null;
}

export const useChat = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChat: null,

      createChat: () => {
        const newChat: Chat = {
          id: crypto.randomUUID(),
          title: 'New Chat',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          hasWelcomeMessage: false
        };

        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChat: newChat.id
        }));

        return newChat.id;
      },

      addWelcomeMessage: (message: string) => set((state) => {
        const activeChat = state.activeChat;
        if (!activeChat) return state;

        const updatedChats = state.chats.map(chat => {
          if (chat.id === activeChat && !chat.hasWelcomeMessage) {
            return {
              ...chat,
              messages: [{ role: 'assistant', content: message }],
              hasWelcomeMessage: true,
              updatedAt: new Date().toISOString()
            };
          }
          return chat;
        });

        return { chats: updatedChats };
      }),

      addMessage: (message) => set((state) => {
        const activeChat = state.activeChat;
        if (!activeChat) return state;

        const updatedChats = state.chats.map(chat => {
          if (chat.id === activeChat) {
            // Update chat title based on first user message if it's still "New Chat"
            let title = chat.title;
            if (title === 'New Chat' && message.role === 'user') {
              title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
            }
            return {
              ...chat,
              title,
              messages: [...chat.messages, message],
              updatedAt: new Date().toISOString()
            };
          }
          return chat;
        });

        return { chats: updatedChats };
      }),

      clearChat: (chatId) => set((state) => ({
        chats: state.chats.map(chat => 
          chat.id === chatId ? { ...chat, messages: [], hasWelcomeMessage: false } : chat
        )
      })),

      setActiveChat: (chatId) => set({ activeChat: chatId }),

      deleteChat: (chatId) => set((state) => {
        const newChats = state.chats.filter(chat => chat.id !== chatId);
        return {
          chats: newChats,
          activeChat: newChats.length > 0 ? newChats[0].id : null
        };
      }),

      getActiveChat: () => {
        const state = get();
        return state.chats.find(chat => chat.id === state.activeChat) || null;
      }
    }),
    {
      name: 'chat-storage',
    }
  )
);