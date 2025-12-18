// photoHandler.js
export async function processPhotos(files, maxSize = 120, maxPhotos = 3) {
    const processed = [];
    const limitedFiles = Array.from(files).slice(0, maxPhotos);

    for (const file of limitedFiles) {
        const thumb = await createThumbnail(file, maxSize);
        processed.push({ original: file, thumb });
    }
    return processed;
}

function createThumbnail(file, maxSize) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const ratio = Math.min(maxSize / width, maxSize / height, 1);
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/jpeg', 0.7);
        };
        img.src = URL.createObjectURL(file);
    });
}
