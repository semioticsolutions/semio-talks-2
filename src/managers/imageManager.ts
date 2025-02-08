import { base64Images } from "../stores/stores";
import { clearFileInputSignal } from "../stores/stores";

export function handleImageUpload(event) {
    onSendVisionMessageComplete(); // Clear images before adding new ones
    const files = event.target.files;
    for (let file of files) {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Use 'update' method to add the new base64 string to the array
            base64Images.update((currentImages) => {
                return [...currentImages, reader.result as string]; // Explicitly cast 'reader.result' to string and add to the array
            });
        };
        reader.readAsDataURL(file);
    }
}

// Example function that gets called when sendVisionMessage completes
export function onSendVisionMessageComplete() {
    base64Images.set([]);
    clearFileInputSignal.set(true);
}
