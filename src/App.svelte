<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { initApp, cleanupApp } from "./appInit";
  import AudioPlayer from "./lib/AudioPlayer.svelte";
  import Topbar from "./lib/Topbar.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import Help from "./lib/Help.svelte";
  import Login from "./lib/Login.svelte";
  import SvelteMarkdown from "svelte-markdown";
  import CodeRenderer from "./renderers/Code.svelte";
  import UserCodeRenderer from "./renderers/userCode.svelte";
  import EmRenderer from "./renderers/Em.svelte";
  import ListRenderer from "./renderers/ListRenderer.svelte";
  import ListItemRenderer from "./renderers/ListItem.svelte";
  import CodeSpanRenderer from "./renderers/CodeSpan.svelte";
  import ParagraphRenderer from "./renderers/Paragraph.svelte";
  import HtmlRenderer from "./renderers/Html.svelte";
  import DeleteIcon from "./assets/delete.svg";
  import CopyIcon from "./assets/CopyIcon.svg";
  import UserIcon from "./assets/UserIcon.svg";
  import RobotIcon from "./assets/RobotIcon.svg";
  import SemioIcon from "./assets/sa-avatar.png";
  import MoreIcon from "./assets/more.svg";
  import EditIcon from "./assets/edit.svg";
  import SendIcon from "./assets/send.svg";
  import WaitIcon from "./assets/wait.svg";
  import UploadIcon from "./assets/upload-icon.svg";
  import PDFIcon from "./assets/pdf-icon.svg";
  import { afterUpdate } from "svelte";
  import { processPDF } from "./managers/pdfManager";
  import {
    conversations,
    chosenConversationId,
    helpVisible,
    clearFileInputSignal,
    clearPDFInputSignal,
    isPanelOpen,
    assistants,
    loggedInUser,
  } from "./stores/stores";
  import {
    isAudioMessage,
    formatMessageForMarkdown,
  } from "./utils/generalUtils";
  import {
    routeMessage,
    newChat,
    deleteMessageFromConversation,
  } from "./managers/conversationManager";
  import { copyTextToClipboard } from "./utils/generalUtils";
  import {
    selectedModel,
    selectedVoice,
    selectedMode,
    isStreaming,
  } from "./stores/stores";
  import { reloadConfig, createThread } from "./services/openaiService";
  import {
    handleImageUpload,
    onSendVisionMessageComplete,
  } from "./managers/imageManager";
  import { base64Images } from "./stores/stores";
  import { closeStream, getAssistants } from "./services/openaiService";

  let fileInputElement;
  let pdfInputElement;
  let input: string = "";
  let textAreaElement;
  let editTextArea;

  let pdfFile;
  let pdfOutput = "";

  let chatContainer: HTMLElement;
  let moreButtonsToggle: boolean = false;
  let conversationTitle = "";

  let currentUser = null;
  let editingMessageId: number | null = null;
  let editingMessageContent: string = "";

  function togglePanel() {
    isPanelOpen.update((value) => !value);
  }

  $: if ($clearFileInputSignal && fileInputElement) {
    fileInputElement.value = "";
    clearFileInputSignal.set(false); // Reset the signal
  }

  $: if ($clearPDFInputSignal && pdfInputElement) {
    pdfInputElement.value = "";
    clearPDFInputSignal.set(false); // Reset the signal
  }

  let availableAssistants = [];

  const refreshAssistants = () => {
    availableAssistants = $assistants;
  };

  $: {
    const currentConversationId = $chosenConversationId;
    const currentConversations = $conversations;
    const totalConversations = $conversations.length;

    if (
      currentConversationId !== undefined &&
      currentConversations[currentConversationId]
    ) {
      conversationTitle =
        currentConversations[currentConversationId].title || "New Conversation";
    }
    if (
      currentConversationId === undefined ||
      currentConversationId === null ||
      currentConversationId < 0 ||
      currentConversationId >= totalConversations
    ) {
      console.log("changing conversation from ID", $chosenConversationId);
      chosenConversationId.set(
        totalConversations > 0 ? totalConversations - 1 : null
      );
      console.log("to ID", $chosenConversationId);
    }
  }

  async function uploadPDF(event) {
    pdfFile = event.target.files[0]; // Get the first file (assuming single file upload)
    if (pdfFile) {
      pdfOutput = await processPDF(pdfFile);
      console.log(pdfOutput);
    }
  }

  function clearFiles() {
    base64Images.set([]); // Assuming this is a writable store tracking uploaded images
    pdfFile = null; // Clear the file variable
    pdfOutput = ""; // Reset the output
    pdfInputElement.value = "";
  }

  let chatContainerObserver: MutationObserver | null = null;

  function setupMutationObserver() {
    if (!chatContainer) return; // Ensure chatContainer is mounted

    const config = { childList: true, subtree: true, characterData: true };

    chatContainerObserver = new MutationObserver((mutationsList, observer) => {
      // Trigger scroll if any relevant mutations observed
      scrollChatToEnd();
    });

    chatContainerObserver.observe(chatContainer, config);
  }

  onMount(async () => {
    await initApp();
    await getAssistants();
    await refreshAssistants();

    selectedModel.set("Semio Academy talks");

    const currentConversations = $conversations;
    if (currentConversations[0]?.id === "0") {
      const thread = await createThread();
      if (thread?.id) {
        conversations.update((convs) => {
          convs[0].id = thread.id;
          return convs;
        });
      }
    }

    // Setup MutationObserver after app initialization and component mounting
    setupMutationObserver();
  });

  onDestroy(() => {
    // Clean up MutationObserver when component is destroyed to prevent memory leaks
    if (chatContainerObserver) {
      chatContainerObserver.disconnect();
      chatContainerObserver = null;
    }
    // Clean up app-specific resources
    cleanupApp();
  });

  function scrollChatToEnd() {
    if (chatContainer) {
      const threshold = 150; // How close to the bottom (in pixels) to trigger auto-scroll
      const isNearBottom =
        chatContainer.scrollHeight - chatContainer.scrollTop - threshold <=
        chatContainer.clientHeight;

      if (isNearBottom) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }

  const textMaxHeight = 300; // Maximum height in pixels

  function autoExpand(event) {
    event.target.style.height = "inherit"; // Reset the height
    const computed = window.getComputedStyle(event.target);
    // Calculate the height
    const height =
      parseInt(computed.getPropertyValue("border-top-width"), 10) +
      event.target.scrollHeight +
      parseInt(computed.getPropertyValue("border-bottom-width"), 10);

    event.target.style.height = `${Math.min(height, textMaxHeight)}px`; // Apply the smaller of the calculated height or maxHeight
  }

  async function processMessage() {
    try {
      // const userEmail = $loggedInUser?.email;

      // if (!userEmail) {
      //   console.error("No user email found");
      //   return;
      // }

      let convId = $chosenConversationId;
      routeMessage(input, convId, pdfOutput);
      input = "";
      clearFiles();
      textAreaElement.style.height = "96px";
    } catch (error) {
      console.error("Error processing message:", error);
      alert(
        "Wystąpił błąd podczas przetwarzania wiadomości. Spróbuj ponownie później."
      );
    }
  }
  function scrollChat() {
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  let lastMessageCount = 0;
  afterUpdate(() => {
    const currentMessageCount =
      $conversations[$chosenConversationId]?.history.length || 0;
    if (currentMessageCount > lastMessageCount) {
      scrollChat();
    }
    lastMessageCount = currentMessageCount; // Update the count after every update
  });

  $: isVisionMode = $selectedMode.includes("Vision");
  $: isGPTMode = $selectedMode.includes("GPT");

  $: conversationTitle = $conversations[$chosenConversationId]
    ? $conversations[$chosenConversationId].title
    : "Semio Academy AI";

  let uploadedFileCount: number = 0;
  $: uploadedFileCount = $base64Images.length;

  let uploadedPDFCount: number = 0;
  $: if (pdfOutput) {
    uploadedPDFCount = 1;
  } else {
    uploadedPDFCount = 0;
  }

  function startEditMessage(i: number) {
    editingMessageId = i;
    editingMessageContent =
      $conversations[$chosenConversationId].history[i].content;
  }

  function cancelEdit() {
    editingMessageId = null;
    editingMessageContent = "";
    editTextArea.style.height = "96px"; // Reset the height when editing is canceled
  }

  function submitEdit(i: number) {
    const editedContent = editingMessageContent; // Temporarily store the edited content
    // Calculate how many messages need to be deleted
    const deleteCount =
      $conversations[$chosenConversationId].history.length - i;
    // Delete messages from the end to the current one, including itself
    for (let j = 0; j < deleteCount; j++) {
      deleteMessageFromConversation(
        $conversations[$chosenConversationId].history.length - 1
      );
    }
    // Process the edited message as new input
    let convId = $chosenConversationId;
    routeMessage(editedContent, convId, pdfOutput);
    cancelEdit(); // Reset editing state
  }

  function isImageUrl(url) {
    // Ensure the URL has no spaces and matches the domain and specific content type for images
    // return (
    //   !/\s/.test(url) &&
    //   url.includes("blob.core.windows.net") &&
    //   /rsct=image\/(jpeg|jpg|gif|png|bmp)/i.test(url)
    // );
    return;
  }

  function handleQuestionClick(str) {
    input = str;
    processMessage();
  }
</script>

<title>
  {#if $conversations.length > 0 && $conversations[$chosenConversationId]}
    {$conversations[$chosenConversationId].title || "Semio Academy AI"}
  {:else}
    Semio Academy AI
  {/if}
</title>
{#if $helpVisible}
  <Help />
{/if}

<main class="bg-primary overflow-hidden">
  <!-- {#if $loggedInUser === null}
    <Login />
  {/if} -->

  <!-- usunięty panel boczny

  <Sidebar on:new-chat={() => newChat()} />
-->
<!-- oryginalny
  <div
    class="h-screen flex justify-stretch flex-col md:ml-[260px] bg-secondary text-white/80 height-manager"
  >
  -->
  <div
    class="h-screen flex justify-stretch flex-col bg-secondary text-white/80 height-manager"
  >
    <Topbar bind:conversation_title={conversationTitle} on:new-chat={newChat} />
    <div
      class="py-5 bg-primary px-5 flex flex-row justify-between flex-wrap-reverse"
    >
      <div class="font-bold text-l flex flex-row">
        <span class="font-normal">{$selectedModel}</span>
        <!-- <img
          class="edit-icon"
          alt="Edit"
          src={EditIcon}
          height="25"
          width="25"
          style="margin-left: 10px; cursor: pointer"
          role="button"
          tabindex="0"
          on:click={() => {
            togglePanel();
          }}
          on:keydown={(e) => e.key === "m" && togglePanel()}
        /> -->
      </div>
      <!--  <button
        on:click={() => {
          loggedInUser.set(null);
          localStorage.removeItem("loggedInUser");
        }}
      >
        Wyloguj
      </button> -->
    </div>

    <div
      class="flex bg-primary overflow-y-auto overflow-x-hidden justify-center grow"
      bind:this={chatContainer}
    >
      {#if $conversations.length > 0 && $conversations[$chosenConversationId]}
        <div class="flex flex-col semio-col-width pt-5 grow">
          {#if $isPanelOpen}
            {#if availableAssistants.length > 0}
              <div class="flex flex-col mb-2">
                <h2 class="text-lg mb-1">Dostępne modele:</h2>
                {#each availableAssistants as assistant}
                  <button
                    class="text-white w-100 py-1 text-left hover:text-gray-400"
                    on:click={() => {
                      selectedModel.set(assistant.name);
                      togglePanel();
                    }}
                  >
                    {assistant.name}
                  </button>
                {/each}
              </div>
            {/if}
          {/if}

          {#if !$isPanelOpen && $conversations[$chosenConversationId].history.length === 0}
            <div class="questions-module">
              <div class="flex flex-col space-y-2 mt-2">
                <div style="text-align: center;">
                  <div
                    style="display: flex; justify-content: center; align-items: center; height: 20vh;"
                  >
                    <img
                      class="semio-icon"
                      alt="Copy"
                      src={SemioIcon}
                      style="width: 100px; height: auto; margin-bottom: 20px;"
                    />
                  </div>
                  <p>To jest eksperymantalny model Semio Academy AI</p>
                </div>

                <div class="grid grid-cols-3 gap-4 p-4">
                  <button
                    class="text-white py-4 px-6 rounded border border-white hover:bg-gray-700 flex items-center justify-center"
                    style="height: 10vw; width: 100%; font-size: 1.5vw;"
                    on:click={() =>
                      handleQuestionClick(
                        "Dla kogo są zajęcia w Semio Academy i czego się tam nauczysz?"
                      )}
                  >
                    Dla kogo są zajęcia w Semio Academy i czego się tam
                    nauczysz?
                  </button>

                  <button
                    class="text-white py-4 px-6 rounded border border-white hover:bg-gray-700 flex items-center justify-center"
                    style="height: 10vw; width: 100%; font-size: 1.5vw;"
                    on:click={() =>
                      handleQuestionClick(
                        "Do czego służą takie narzędzia jak znak, kody, mapa kodów, RDE, kwadrat semiotyczny?"
                      )}
                  >
                    Do czego służą takie narzędzia jak znak, kody, mapa kodów,
                    RDE, kwadrat semiotyczny?
                  </button>

                  <button
                    class="text-white py-4 px-6 rounded border border-white hover:bg-gray-700 flex items-center justify-center"
                    style="height: 10vw; width: 100%; font-size: 1.5vw;"
                    on:click={() =>
                      handleQuestionClick(
                        "Jak semiotyka marketingowa może pomóc w budowaniu odróżnialnego wizerunku marki na konkurencyjnym rynku?"
                      )}
                  >
                    Jak semiotyka marketingowa może pomóc w budowaniu
                    odróżnialnego wizerunku marki na konkurencyjnym rynku?
                  </button>
                </div>
              </div>
            </div>
          {/if}
          {#if !$isPanelOpen}
            <div>
              {#each $conversations[$chosenConversationId].history as message, i}
                <!-- {#if message.role !== "assistant"} -->
                <div
                  class="message relative inline-block bg-primary px-2 pb-5 flex flex-col"
                >
                  <div class="profile-picture flex">
                    <div>
                      <img
                        src={message.role === "user" ? UserIcon : SemioIcon}
                        alt="Profile"
                        class="w-6 h-6 ml-10"
                      />
                    </div>
                    <div class="relative ml-3 font-bold">
                      {#if message.role === "assistant"}
                        Semio Academy AI
                      {:else}
                        Ty
                      {/if}
                    </div>
                  </div>

                  {#if editingMessageId === i}
                    <textarea
                      bind:this={editTextArea}
                      class="message-edit-textarea mt-2 bg-gray-700 p-3 mx-10 resize-none focus:outline-none rounded-lg"
                      bind:value={editingMessageContent}
                      on:input={autoExpand}
                      style="height: 96px; overflow-y: auto;"
                    ></textarea>
                    <div class="flex place-content-center mt-4">
                      <button
                        class="submit-edit rounded-lg p-2 mr-2
              {$isStreaming
                          ? 'bg-gray-500 cursor-not-allowed hover:bg-gray-500'
                          : 'hover:bg-green-500 bg-green-700'}"
                        on:click={() => submitEdit(i)}
                        disabled={$isStreaming}>Zatwierdz</button
                      >
                      <button
                        class="cancel-edit bg-gray-700 hover:bg-gray-500 rounded-lg p-2 mr-2"
                        on:click={() => cancelEdit()}>Anuluj</button
                      >
                    </div>
                  {:else}
                    <div
                      class="message-display pl-20 pr-5 md:px-20 text-[1rem]"
                    >
                      <!-- {#if isImageUrl(message.content)}
                          <img
                            src={message.content}
                            alt="Generated"
                            class="max-w-full h-auto my-3"
                          />
                          <div class="text-sm text-gray-500">
                            This image will be available for 60 minutes. Right
                            click + save as!
                          </div>
                        {:else  -->
                      {#if isAudioMessage(message)}
                        <div class="pb-3">
                          <AudioPlayer audioUrl={message.audioUrl} />
                        </div>
                      {:else if message.role === "system"}
                        <SvelteMarkdown
                          renderers={{
                            code: CodeRenderer,
                            em: EmRenderer,
                            list: ListRenderer,
                            listitem: ListItemRenderer,
                            paragraph: ParagraphRenderer,
                            html: HtmlRenderer,
                          }}
                          source={formatMessageForMarkdown(
                            message.content.toString()
                          )}
                        />
                      {:else}
                        <SvelteMarkdown
                          renderers={{
                            code: UserCodeRenderer,
                            codespan: CodeSpanRenderer,
                            em: EmRenderer,
                            list: ListRenderer,
                            listitem: ListItemRenderer,
                            paragraph: ParagraphRenderer,
                            html: HtmlRenderer,
                          }}
                          source={formatMessageForMarkdown(
                            message.content.toString()
                          )}
                        />
                      {/if}
                    </div>
                    <div class="toolbelt flex space-x-2 pl-20 mb-2 tools">
                      {#if message.role === "system"}
                        {#if !isAudioMessage(message)}
                          <button
                            class="copyButton w-5"
                            on:click={() =>
                              copyTextToClipboard(message.content)}
                          >
                            <img class="copy-icon" alt="Copy" src={CopyIcon} />
                          </button>
                        {/if}
                        <button
                          class="deleteButton w-5"
                          on:click={() => deleteMessageFromConversation(i)}
                        >
                          <img
                            class="delete-icon"
                            alt="Delete"
                            src={DeleteIcon}
                          />
                        </button>
                      {/if}
                      {#if message.role === "user"}
                        <button
                          class="editButton w-5"
                          on:click={() => startEditMessage(i)}
                        >
                          <img class="edit-icon" alt="edit" src={EditIcon} />
                        </button>
                      {/if}
                    </div>
                  {/if}
                </div>
                <!-- {/if} -->
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <div class="flex justify-center items-center h-full">
          <p>No conversation selected. Start a new conversation.</p>
        </div>
      {/if}
    </div>

    <div
      class="inputbox-container w-full flex justify-center items-center bg-primary"
    >
      <div
        class="inputbox flex flex-1 bg-primary mt-auto mx-auto semio-col-width mb-3"
      >
        {#if isVisionMode}
          <input
            type="file"
            id="imageUpload"
            multiple
            accept="image/*"
            on:change={handleImageUpload}
            bind:this={fileInputElement}
            class="file-input"
          />
          <label
            for="imageUpload"
            class="file-label bg-chat rounded py-2 px-4 mx-1 cursor-pointer hover:bg-hover2 transition-colors"
          >
            {#if uploadedFileCount > 0}
              <span class="fileCount">{uploadedFileCount}</span>
            {:else}
              <img
                src={UploadIcon}
                alt="Upload"
                class="upload-icon icon-white"
              />
            {/if}
          </label>

          {#if uploadedFileCount > 0}
            <button on:click={clearFiles} class="clear-btn">X</button>
          {/if}
        {:else if isGPTMode}
          <input
            type="file"
            id="pdfUpload"
            accept="application/pdf"
            on:change={(event) => uploadPDF(event)}
            bind:this={pdfInputElement}
            class="file-input"
            disabled={true}
          />

          <!-- <label
            for="pdfUpload"
            class="file-label bg-chat rounded py-2 px-4 mx-1 cursor-pointer hover:bg-hover2 transition-colors opacity-50"
          >
            {#if uploadedPDFCount === 0}
              <img src={PDFIcon} alt="PDF" class="pdf-icon icon-white" />
            {:else}
              <span class="fileCount">{uploadedPDFCount}</span>
            {/if}
          </label> -->

          {#if uploadedPDFCount > 0}
            <button
              on:click={clearFiles}
              class="clear-btn px-4 rounded-lg bg-red-700 mx-2 hover:bg-red-500"
              >X</button
            >
          {/if}
        {/if}

        <textarea
          bind:this={textAreaElement}
          class="w-full min-h-[96px] h-24 rounded-lg p-2 mx-1 mr-0 border-t-2 border-b-2 border-l-2 rounded-r-none bg-primary border-gray-500 resize-none focus:outline-none"
          placeholder="Type your message..."
          bind:value={input}
          on:input={autoExpand}
          style="height: 96px; overflow-y: auto; overflow:visible !important;"
          on:keydown={(event) => {
            const isMobile =
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
              );
            if (
              !$isStreaming &&
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.ctrlKey &&
              !event.metaKey &&
              !isMobile
            ) {
              event.preventDefault(); // Prevent default insert line break behavior
              processMessage();
            } else if (!$isStreaming && event.key === "Enter" && isMobile) {
              // Allow default behavior on mobile, which is to insert a new line
              // Optionally, you can explicitly handle mobile enter key behavior here if needed
            }
          }}
        ></textarea>
        <button
          class="bg-chat rounded-lg py-2 px-4 mx-1 ml-0 border-t-2 border-b-2 border-r-2 border-gray-500 rounded-l-none cursor-pointer"
          on:click={() => {
            if ($isStreaming) {
              closeStream();
            } else {
              processMessage();
            }
          }}
          disabled={!$isStreaming && !input.trim().length}
        >
          {#if $isStreaming}
            <img
              class="icon-white min-w-[24px] w-[24px]"
              alt="Wait"
              src={WaitIcon}
            />
          {:else}
            <img
              class="icon-white min-w-[24px] w-[24px]"
              alt="Send"
              src={SendIcon}
            />
          {/if}
        </button>
      </div>
    </div>

    <div class="flex justify-center bg-primary px-4">
      <div class="semio-col-width"></div>
    </div>
  </div>
</main>

<style>
  @import "./styles/styles.css";
</style>
