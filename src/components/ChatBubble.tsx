import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, History, Plus, Trash2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAiSettings } from '../hooks/useAiSettings';
import ChatMessage from './ai/ChatMessage';
import ChatInput from './ai/ChatInput';
import { sendMessageToOpenAI, sendMessageToOllama, sendMessageToFlowise } from './ai/ChatService';
import { useLocation } from 'react-router-dom';

const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { chats, activeChat, createChat, addMessage, addWelcomeMessage, getActiveChat, setActiveChat, deleteChat } = useChat();
  const { settings } = useAiSettings();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentChat = getActiveChat();
  const location = useLocation();

  // Check if we're on the AI Assistant page
  const isAiAssistantPage = location.pathname === '/assistant';

  useEffect(() => {
    if (!activeChat && isOpen) {
      createChat();
    }
  }, [isOpen, activeChat]);

  useEffect(() => {
    if (settings?.global_greeting_message && currentChat?.messages.length === 0) {
      addWelcomeMessage(settings.global_greeting_message);
    }
  }, [settings?.global_greeting_message, currentChat?.messages.length]);

  // Auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChat?.messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings?.enabled || !newMessage.trim()) return;

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

  // If we're on the AI Assistant page or chatbot is disabled, don't render anything
  if (isAiAssistantPage || !settings?.chatbot_enabled) {
    return null;
  }

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <History className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Assistant</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History Sidebar */}
            {showHistory && (
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 rounded-l-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h3>
                  <button
                    onClick={() => setShowHistory(false)}
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
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentChat?.messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <ChatInput
              message={newMessage}
              setMessage={setNewMessage}
              onSubmit={handleSubmit}
              disabled={isLoading}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBubble;