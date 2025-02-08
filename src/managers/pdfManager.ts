// src/managers/pdfManager.ts
async function initPDFJS() {
    const PDFJS = await import('pdfjs-dist');
    PDFJS.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
    return PDFJS;
  }
  
  function parsePDFDate(dateStr: string) {  
    // Pattern: D:YYYYMMDDHHmmSSOHH'mm'  
    const regex = /^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/;  
    const parts = regex.exec(dateStr);  
  
    if (parts) {  
        // Adjust months down by 1 for JS Date (0-based)  
        const year = parseInt(parts[1], 10);  
        const month = parseInt(parts[2], 10) - 1;  
        const day = parseInt(parts[3], 10);  
        const hours = parseInt(parts[4], 10);  
        const minutes = parseInt(parts[5], 10);  
        const seconds = parseInt(parts[6], 10);  
  
        // Note: This parser ignores timezone offsets and always creates a local date object  
        return new Date(year, month, day, hours, minutes, seconds).toISOString().split('T')[0];  
    }  
  
    return 'Unknown Date'; // Return 'Unknown Date' if parsing fails  
}  

export async function processPDF(file: File): Promise<string> {
  try {
    const fileReader = new FileReader();
    const PDFJS = await initPDFJS();

    return new Promise((resolve, reject) => {
      fileReader.onload = async (event) => {
        const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
        const loadingTask = PDFJS.getDocument({ data: typedArray });
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;
        let textContent = '';
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const text = await page.getTextContent();
          textContent += text.items.map(item => ('str' in item) ? item.str : '').join(' ');
        }
        const wordCount = textContent.split(/\s+/).length;
        const docMetadata = await pdfDoc.getMetadata();
        const info = docMetadata.info as any;  // Use 'any' to bypass the type checking issues temporarily

        const filename = file.name;
        const title = info.Title || 'Untitled';
        const author = info.Author || 'Unknown Author';
        const creationDate = info.CreationDate ? parsePDFDate(info.CreationDate) : 'Unknown Date';  

        resolve(`The user uploaded a PDF titled "${title}" with a file name of "${filename}". It has ${numPages} pages and ${wordCount} words. File metadata includes Author: "${author}" and creation date: ${creationDate}. The extracted text is as follows: ${textContent}`);
      };
      fileReader.onerror = reject;

      fileReader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return Promise.reject('Failed to load the PDF file.');
  }
}
