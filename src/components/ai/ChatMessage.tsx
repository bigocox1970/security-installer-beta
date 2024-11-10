import React from 'react';
import { Message } from '../../types/chat';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  // Function to format text with line breaks and proper spacing
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          message.role === 'assistant'
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            : 'bg-indigo-600 text-white'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap">
          {formatContent(message.content)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;