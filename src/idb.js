// idb.js
import { openDB } from 'idb';

export const dbPromise = openDB('audio-store', 1, {
    upgrade(db) {
      db.createObjectStore('audios', { keyPath: 'id' });
    },
  });
  
  export async function saveAudioBlob(id, blob, conversationId) {  
    const db = await dbPromise;  
    const tx = db.transaction('audios', 'readwrite');  
    tx.objectStore('audios').put({ id, blob, conversationId });  
    return tx.done;  
  }  
  
  export async function getAudioBlob(id) {
    const db = await dbPromise;
    const tx = db.transaction('audios', 'readonly');
    const result = await tx.objectStore('audios').get(id);
    return result?.blob;
  }
  
  export async function getAllAudioUrls() {
    const db = await dbPromise;
    const tx = db.transaction('audios', 'readonly');
    return tx.objectStore('audios').getAll();
  }
  
  // Function to delete all blobs associated with a conversationId


  
  export async function clearAllAudioBlobs() {
    const db = await dbPromise;
    const tx = db.transaction('audios', 'readwrite');
    await tx.objectStore('audios').clear();
    return tx.done;
  }
  