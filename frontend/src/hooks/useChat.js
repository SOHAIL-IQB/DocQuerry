import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useChat = (initialChatId = null) => {
  const [chatId, setChatId] = useState(initialChatId);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  // Load chat history when chatId changes
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const loadHistory = async () => {
      try {
        setError(null);
        const { data } = await api.get(`/chat/${chatId}`);
        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setError('Failed to load conversation.');
      }
    };

    loadHistory();
  }, [chatId]);

  // Handle auto-creating a chat if none exists before sending a message
  const ensureChatExists = async () => {
    if (chatId) return chatId;
    try {
      // Creates a new 'New Chat' container
      const { data } = await api.post('/chat/create', { title: 'New Conversation' });
      if (data.success) {
        setChatId(data.data._id);
        return data.data._id;
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
      throw new Error('Chat creation failed');
    }
    return null;
  };

  // Send message to the backend
  const sendMessage = useCallback(async (question, documentIds = []) => {
    if (!question.trim()) return;

    try {
      setIsTyping(true);
      setError(null);

      // Optimistic UI Update for User Message
      const tempUserMsg = {
        _id: `temp-${Date.now()}`,
        role: 'user',
        content: question,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg]);

      // Ensure we have a valid chat container
      const currentChatId = await ensureChatExists();
      if (!currentChatId) throw new Error('No valid chat defined');

      // Send to Backend API
      const response = await api.post('/chat/message', {
        chatId: currentChatId,
        question,
        documentIds: Array.isArray(documentIds) ? documentIds : []
      });

      if (response.data.success) {
        const { answer, sources } = response.data.data;
        
        // Add Assistant Response
        const assistantMsg = {
          _id: `temp-ast-${Date.now()}`,
          role: 'assistant',
          content: answer,
          sources: sources,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An error occurred while communicating with the AI.');
    } finally {
      setIsTyping(false);
    }
  }, [chatId]);

  return {
    chatId,
    setChatId,
    messages,
    isTyping,
    error,
    sendMessage
  };
};
