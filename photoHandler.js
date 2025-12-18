// photoHandler.js
const storePhotoInput = document.getElementById('storePhoto');
const storePhotoPreview = document.getElementById('storePhotoPreview');

const MAX_THUMB_WIDTH = 120;
const MAX_THUMB_HEIGHT = 120;

// ----------------- サムネイル生成 -----------------
async function createThumbnail(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectURL = URL.createObjectURL(file);
        img.src = objectURL;

        img.onload = () => {
            URL.revokeObjectURL(objectURL); // 元画像URL解放

            const canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;
            const ratio = Math.min(MAX_THUMB_WIDTH / w, MAX_THUMB_HEIGHT / h, 1);
            w *= ratio;
            h *= ratio;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);

            canvas.toBlob(
                blob => resolve(blob),
                'image/jpeg',
                0.7
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectURL);
            reject(new Error('画像読み込み失敗'));
        };
    });
}

// ----------------- プレビュー & アップロード -----------------
storePhotoInput.addEventListener('change', async () => {
    storePhotoPreview.innerHTML = '';

    for (const file of storePhotoInput.files) {
        try {
            const blob = await createThumbnail(file);

            // プレビューに追加
            const previewURL = URL.createObjectURL(blob);
            const img = document.createElement('img');
            img.src = previewURL;
            img.classList.add('thumb');
            img.onload = () => URL.revokeObjectURL(previewURL); // プレビュー後に解放
            storePhotoPreview.appendChild(img);

            // サーバへ送信
            const formData = new FormData();
            formData.append('photo', blob, file.name);

            const res = await fetch('http://localhost:3000/api/store/photo', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('アップロード失敗');
            const { filename } = await res.json();

            // プレビュー画像をサーバパスに置き換え（任意）
            img.src = `images/${filename}`;
        } catch (err) {
            console.error(err);
            alert(`画像処理に失敗しました: ${file.name}`);
        }
    }

    // 選択リセット
    storePhotoInput.value = '';
});
