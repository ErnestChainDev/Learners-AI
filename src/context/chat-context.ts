import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatContextValue = {
  chatHistory: ChatMessage[][];
  activeChatIndex: number | null;
  setActiveChatIndex: (index: number | null) => void;
  setChatHistory: Dispatch<SetStateAction<ChatMessage[][]>>;
  setActiveMessages: (messages: ChatMessage[]) => void;
  newChat: () => void;
  selectChat: (index: number) => void;
  clearChats: () => void;
};

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return ctx;
}