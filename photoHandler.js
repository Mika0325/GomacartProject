const storePhotoInput = document.getElementById('storePhoto');
const storePhotoPreview = document.getElementById('storePhotoPreview');

const MAX_THUMB_WIDTH = 120;
const MAX_THUMB_HEIGHT = 120;

// サムネイル生成（フロントで軽量化）
function createThumbnail(file) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const ratio = Math.min(MAX_THUMB_WIDTH / width, MAX_THUMB_HEIGHT / height, 1);
            width *= ratio;
            height *= ratio;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/jpeg', 0.7);
        };
        img.src = URL.createObjectURL(file);
    });
}

// プレビュー表示
storePhotoInput.addEventListener('change', async () => {
    storePhotoPreview.innerHTML = '';
    for (const file of storePhotoInput.files) {
        const thumbURL = await createThumbnail(file);
        const img = document.createElement('img');
        img.src = thumbURL;
        img.classList.add('thumb');
        storePhotoPreview.appendChild(img);
    }
});
