import { Message } from '../../types/chat';

export const sendMessageToOpenAI = async (messages: Message[], apiKey: string, model: string) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })
  });

  if (!response.ok) throw new Error('Failed to get response from OpenAI');
  const data = await response.json();
  return data.choices[0].message.content;
};

export const sendMessageToOllama = async (messages: Message[], apiUrl: string) => {
  const response = await fetch(`${apiUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })
  });

  if (!response.ok) throw new Error('Failed to get response from Ollama');
  const data = await response.json();
  return data.message.content;
};

export const sendMessageToFlowise = async (
  messages: Message[],
  chatflowId: string,
  apiHost: string
) => {
  const response = await fetch(`${apiHost}/api/v1/prediction/${chatflowId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: messages[messages.length - 1].content,
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    }),
  });

  if (!response.ok) throw new Error('Failed to get response from Flowise');
  const data = await response.json();
  return data.text || data.response || 'Sorry, I could not generate a response.';
};