import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareText, Send, Lock, Plus, History, X, Trash2 } from 'lucide-react';
import { useAiSettings } from '../hooks/useAiSettings';
import { useChat } from '../hooks/useChat';
import ChatMessage from './ai/ChatMessage';
import ChatInput from './ai/ChatInput';
import { sendMessageToOpenAI, sendMessageToOllama, sendMessageToFlowise } from './ai/ChatService';

interface AiAssistantProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function AiAssistant({ onAuthRequired, isAuthenticated }: AiAssistantProps) {
  const { settings } = useAiSettings();
  const { chats, activeChat, createChat, addMessage, addWelcomeMessage, setActiveChat, deleteChat, getActiveChat } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentChat = getActiveChat();

  useEffect(() => {
    if (!activeChat && isAuthenticated) {
      createChat();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (settings?.global_greeting_message && currentChat?.messages.length === 0) {
      addWelcomeMessage(settings.global_greeting_message);
    }
  }, [settings?.global_greeting_message, activeChat]);

  // Auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChat?.messages]); // Scroll when messages change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    if (!newMessage.trim() || !settings?.enabled) return;

    try {
      setIsLoading(true);
      const userMessage = { role: 'user' as const, content: newMessage };
      addMessage(userMessage);
      setNewMessage('');

      const systemMessage = `${settings.global_prompt_template || ''}\n\nPersonality: ${
        settings.personality_type === 'custom'
          ? settings.custom_personality
          : settings.personality_type === 'funny'
          ? "You are funny and talk like you're down with the kids"
          : settings.personality_type === 'friendly'
          ? "You are warm, approachable, and conversational"
          : "You are professional and precise"
      }`;

      let response;
      const messages = currentChat?.messages || [];
      switch (settings.provider) {
        case 'openai':
          response = await sendMessageToOpenAI(
            [{ role: 'system', content: systemMessage }, ...messages, userMessage],
            settings.api_key!,
            settings.model_name || 'gpt-3.5-turbo'
          );
          break;
        case 'ollama':
          response = await sendMessageToOllama(
            [{ role: 'system', content: systemMessage }, ...messages, userMessage],
            settings.api_url!
          );
          break;
        case 'flowise':
          response = await sendMessageToFlowise(
            [{ role: 'system', content: systemMessage }, ...messages, userMessage],
            settings.flowise_chatflow_id!,
            settings.flowise_api_host!
          );
          break;
        default:
          throw new Error('Invalid provider');
      }

      addMessage({ role: 'assistant', content: response });
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Lock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Authentication Required</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please sign in to use the AI assistant.</p>
          <button
            onClick={onAuthRequired}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Chat History Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      } z-50`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h3>
          <button
            onClick={() => setShowSidebar(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <button
            onClick={createChat}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mb-4"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                  chat.id === activeChat
                    ? 'bg-indigo-50 dark:bg-indigo-900/50'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => setActiveChat(chat.id)}
              >
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {chat.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this chat?')) {
                      deleteChat(chat.id);
                    }
                  }}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-[calc(100vh-12rem)]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <History className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
            <div className="w-8" /> {/* Spacer for alignment */}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {currentChat?.messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            message={newMessage}
            setMessage={setNewMessage}
            onSubmit={handleSubmit}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default AiAssistant;