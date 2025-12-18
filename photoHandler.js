const storePhotoInput = document.getElementById('storePhoto');
const storePhotoPreview = document.getElementById('storePhotoPreview');

const MAX_THUMB_WIDTH = 120;
const MAX_THUMB_HEIGHT = 120;

// サムネイル生成（軽量化）
async function createThumbnail(file) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;
            const ratio = Math.min(MAX_THUMB_WIDTH / w, MAX_THUMB_HEIGHT / h, 1);
            w *= ratio;
            h *= ratio;
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.7);
        };
        img.src = URL.createObjectURL(file);
    });
}

// アップロード & プレビュー
storePhotoInput.addEventListener('change', async () => {
    storePhotoPreview.innerHTML = '';

    for (const file of storePhotoInput.files) {
        const blob = await createThumbnail(file);
        const formData = new FormData();
        formData.append('photo', blob, file.name);

        try {
            const res = await fetch('http://localhost:3000/api/store/photo', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('アップロード失敗');
            const { filename } = await res.json();

            // プレビューに表示
            const img = document.createElement('img');
            img.src = `images/${filename}`;
            img.classList.add('thumb');
            storePhotoPreview.appendChild(img);
        } catch (err) {
            console.error(err);
            alert('画像アップロードに失敗しました');
        }
    }

    // ファイル選択をリセット
    storePhotoInput.value = '';
});
