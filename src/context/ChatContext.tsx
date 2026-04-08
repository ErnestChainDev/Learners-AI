import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ChatContext, type ChatMessage } from "./chat-context";

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[][]>([[]]);
  const [activeChatIndex, setActiveChatIndex] = useState<number | null>(0);

  const setActiveMessages = useCallback(
    (messages: ChatMessage[]) => {
      setChatHistory((prev) => {
        if (activeChatIndex === null) return prev;
        const copy = [...prev];
        copy[activeChatIndex] = messages;
        return copy;
      });
    },
    [activeChatIndex]
  );

  const newChat = useCallback(() => {
    setChatHistory((prev) => {
      const next = [...prev, []];
      setActiveChatIndex(next.length - 1);
      return next;
    });
  }, []);

  const selectChat = useCallback((index: number) => {
    setActiveChatIndex(index);
  }, []);

  const clearChats = useCallback(() => {
    setChatHistory([[]]);
    setActiveChatIndex(0);
  }, []);

  const value = useMemo(
    () => ({
      chatHistory,
      activeChatIndex,
      setActiveChatIndex,
      setChatHistory,
      setActiveMessages,
      newChat,
      selectChat,
      clearChats,
    }),
    [chatHistory, activeChatIndex, setActiveMessages, newChat, selectChat, clearChats]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}