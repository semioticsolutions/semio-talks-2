import { type Writable, writable } from "svelte/store";
import type { ChatCompletionRequestMessage } from "openai";

export interface Conversation {
  history: ChatCompletionRequestMessage[];
  conversationTokens: number;
  assistantRole: string;
  title: string;
  id: string;
}

export interface DefaultAssistantRole {
  role: string;
  type: string;
}

export const settingsVisible = writable(false);
export const helpVisible = writable(false);
export const menuVisible = writable(false);

export const apiKey: Writable<string> = writable(
  "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"
);

let storedCombinedTokens = localStorage.getItem("combined_tokens");
let parsedCombinedTokens: number =
  storedCombinedTokens !== null ? JSON.parse(storedCombinedTokens) : 0;
export const combinedTokens = writable(parsedCombinedTokens);
combinedTokens.subscribe((value) =>
  localStorage.setItem("combined_tokens", JSON.stringify(value))
);

let storedDefaultAssistantRole = localStorage.getItem("default_assistant_role");
let parsedDefaultAssistantRole: DefaultAssistantRole =
  storedDefaultAssistantRole !== null
    ? JSON.parse(storedDefaultAssistantRole)
    : 0;
export const defaultAssistantRole = writable(
  parsedDefaultAssistantRole || {
    role: "You are a helpful assistant.",
    type: "assistant",
  }
);
defaultAssistantRole.subscribe((value) =>
  localStorage.setItem("default_assistant_role", JSON.stringify(value))
);

export const chosenConversationId = writable(0);

let storedConversations = localStorage.getItem("conversations");
let parsedConversations: Conversation[] =
  storedConversations !== null ? JSON.parse(storedConversations) : null;

export const conversations: Writable<Conversation[]> = writable([
  {
    history: [],
    conversationTokens: 0,
    assistantRole: "You are a helpful assistant.",
    title: "",
    id: "0",
  },
]);

conversations.subscribe((value) => {
  localStorage.setItem("conversations", JSON.stringify(value));
});

export const isPanelOpen = writable(false);

export const assistants = writable([]);

export const loggedInUser = writable(null);

export const selectedModel = writable(
  localStorage.getItem("selectedModel") || "Semio Academy talks"
);

export const selectedVoice = writable(
  localStorage.getItem("selectedVoice") || "alloy"
);

export const selectedMode = writable(
  localStorage.getItem("selectedMode") || "GPT"
);

export const selectedSize = writable(
  localStorage.getItem("selectedSize") || "1024x1024"
);
export const selectedQuality = writable(
  localStorage.getItem("selectedQuality") || "standard"
);

selectedModel.subscribe((value) => {
  localStorage.setItem("selectedModel", value);
});
selectedVoice.subscribe((value) => {
  localStorage.setItem("selectedVoice", value);
});
selectedSize.subscribe((value) => {
  localStorage.setItem("selectedSize", value);
});
selectedQuality.subscribe((value) => {
  localStorage.setItem("selectedQuality", value);
});
selectedMode.subscribe((value) => {
  localStorage.setItem("selectedMode", value);
});
export const audioUrls = writable([]);

export const base64Images = writable([]);
export const clearFileInputSignal = writable(false);
export const clearPDFInputSignal = writable(false);

export const isStreaming = writable(false);
export const userRequestedStreamClosure = writable(false);

export const streamContext = writable({ streamText: "", convId: null });

let storedShowTokens = localStorage.getItem("show_tokens");
let parsedShowTokens =
  storedShowTokens !== null ? JSON.parse(storedShowTokens) : false;

export const showTokens = writable(parsedShowTokens);

showTokens.subscribe((value) => {
  localStorage.setItem("show_tokens", JSON.stringify(value));
});
