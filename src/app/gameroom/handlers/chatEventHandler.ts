import { ChatEvent, ChatEventPayloadMap } from "../types";

// Type alias for individual event handler
export type ChatEventHandler<T extends ChatEvent> = (
  data: ChatEventPayloadMap[T]
) => void;

// Handlers for each event type
export const chatEventHandlers: {
  [K in ChatEvent]: ChatEventHandler<K>;
} = {
  connection_success_chat: (data) => {
    console.log("Chat connection established:", data.message);
  },

  new_message: (data) => {
    console.log(`[${data.timestamp}] ${data.display_name}: ${data.text}`);
    // Optionally update chat UI or state here
  },
};
