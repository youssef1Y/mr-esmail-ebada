/**
 * Compress an image file before upload.
 * Reduces phone camera images (3-8MB) to ~200-500KB.
 */
export const compressImage = (file: File, maxWidth = 1600, quality = 0.7): Promise<File> => {
  return new Promise((resolve) => {
    // Skip non-image files
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    // Skip already small files (< 500KB)
    if (file.size < 500 * 1024) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file); // Keep original if compression didn't help
            return;
          }
          const compressed = new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() });
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};

/**
 * Compress multiple images in parallel
 */
export const compressImages = (files: File[]): Promise<File[]> => {
  return Promise.all(files.map(f => compressImage(f)));
};
