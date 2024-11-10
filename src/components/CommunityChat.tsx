import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Lock } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  isCurrentUser: boolean;
}

interface CommunityChatProps {
  onAuthRequired: () => void;
  isAuthenticated: boolean;
}

function CommunityChat({ onAuthRequired, isAuthenticated }: CommunityChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Has anyone worked with the new Hikvision ColorVu cameras?',
      author: 'John Smith',
      timestamp: '10:30 AM',
      isCurrentUser: false,
    },
    {
      id: '2',
      content: 'Yes, they work great in low light conditions!',
      author: 'Current User',
      timestamp: '10:32 AM',
      isCurrentUser: true,
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      author: 'Current User',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCurrentUser: true,
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
          <Lock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Authentication Required</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please sign in to join the community chat.</p>
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[calc(100vh-16rem)]">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Community Chat</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[70%]`}>
                  {!message.isCurrentUser && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                    </div>
                  )}
                  <div>
                    {!message.isCurrentUser && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {message.author}
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        message.isCurrentUser
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CommunityChat;