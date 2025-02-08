// utils/generalUtils.ts

// Utility function for formatting messages for Markdown rendering
export function formatMessageForMarkdown(content: string): string {
    // Replace newline characters with two spaces followed by a newline character
    return content.replace(/\n/g, '  \n');
  }
  
  // Utility function to copy text to clipboard
  export async function copyTextToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text successfully copied to clipboard');
      return true;
    } catch (err) {
      console.error('Failed to copy text to clipboard: ', err);
      return false;
    }
  }
  

  
  // Utility function to check if a message is an audio message
  export function isAudioMessage(message: any): message is { audioUrl: string; isAudio: boolean } {
    return message.isAudio === true;
  }
 export function countTicks(str: string) {
    let out: number = str.split("").filter((char) => char === "`").length;
    return out;
  }

  