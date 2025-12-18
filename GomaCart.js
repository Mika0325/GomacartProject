let shoppingItems = [];
let stockItems = [];
let storeItems = [];

const shoppingList = document.getElementById('shoppingList');
const stockList = document.getElementById('stockList');
const storeList = document.getElementById('storeList');
const storePhotoInput = document.getElementById('storePhoto');
const storePhotoPreview = document.getElementById('storePhotoPreview');

const MAX_THUMB_WIDTH = 120;
const MAX_THUMB_HEIGHT = 120;

// ---------------- データロード・保存 ----------------
async function loadData() {
    try {
        const res = await fetch('http://localhost:3000/api/data');
        if (!res.ok) throw new Error();
        const data = await res.json();
        shoppingItems = data.shoppingItems || [];
        stockItems = data.stockItems || [];
        storeItems = data.storeItems || [];
        localStorage.setItem('gomacart-data', JSON.stringify(data));
    } catch {
        const data = JSON.parse(localStorage.getItem('gomacart-data') || '{}');
        shoppingItems = data.shoppingItems || [];
        stockItems = data.stockItems || [];
        storeItems = data.storeItems || [];
    }
}

async function saveData() {
    const data = { shoppingItems, stockItems, storeItems };
    localStorage.setItem('gomacart-data', JSON.stringify(data));
    try {
        await fetch('http://localhost:3000/api/data', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
    } catch { }
}

// ---------------- 入力チェック ----------------
function validateInput(name) { return name && name.trim(); }

// ---------------- リストレンダリング ----------------
function renderList(listElem, items, renderFn) {
    listElem.innerHTML = '';
    items.forEach((item, i) => {
        const li = document.createElement('li');
        li.innerHTML = renderFn(item, i);
        listElem.appendChild(li);
    });
}

function renderShoppingList() {
    renderList(shoppingList, shoppingItems, (item, i) => `
    ${item.name}${item.qty ? '(' + item.qty + ')' : ''}${item.memo ? ' - ' + item.memo : ''}
    <button class="delete-btn" data-index="${i}" data-type="shopping">削除</button>
    <button class="move-btn" data-index="${i}" data-type="shopping">在庫へ</button>
`);
}

function renderStockList() {
    renderList(stockList, stockItems, (item, i) => `
    ${item.name}${item.qty ? '(' + item.qty + ')' : ''}${item.memo ? ' - ' + item.memo : ''}
    <button class="edit-btn" data-index="${i}" data-type="stock">編集</button>
    <button class="delete-btn" data-index="${i}" data-type="stock">削除</button>
`);
}

function renderStoreList() {
    renderList(storeList, storeItems, (item, i) => `
    ${item.storeName} - ${item.itemName}${item.price ? '(' + item.price + '円)' : ''}${item.memo ? ' - ' + item.memo : ''}
    ${item.photos ? item.photos.map((p, j) => `
        <span>
            <img src="images/${p}" class="thumb" data-store="${i}" data-index="${j}">
            <button class="delete-photo" data-store="${i}" data-index="${j}">×</button>
        </span>
    `).join('') : ''}
    <button class="delete-btn" data-type="store" data-index="${i}">削除</button>
`);
}

// ---------------- 写真処理 ----------------
async function createThumbnail(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objURL = URL.createObjectURL(file);
        img.src = objURL;
        img.onload = () => {
            URL.revokeObjectURL(objURL);
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            const ratio = Math.min(MAX_THUMB_WIDTH / w, MAX_THUMB_HEIGHT / h, 1);
            w *= ratio; h *= ratio;
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.7);
        };
        img.onerror = () => { URL.revokeObjectURL(objURL); reject('読み込み失敗'); };
    });
}

storePhotoInput.addEventListener('change', async () => {
    storePhotoPreview.innerHTML = '';
    for (const file of storePhotoInput.files) {
        try {
            const blob = await createThumbnail(file);
            const previewURL = URL.createObjectURL(blob);
            const img = document.createElement('img');
            img.src = previewURL; img.classList.add('thumb');
            img.onload = () => URL.revokeObjectURL(previewURL);
            storePhotoPreview.appendChild(img);

            // サーバ送信
            const formData = new FormData();
            formData.append('photo', blob, file.name);
            const res = await fetch('http://localhost:3000/api/store/photo', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('アップロード失敗');
            const { filename } = await res.json();
            img.src = `images/${filename}`;
        } catch (e) { console.error(e); alert('画像アップロード失敗'); }
    }
    storePhotoInput.value = '';
});

// ---------------- イベント ----------------
document.getElementById('addItemBtn').addEventListener('click', async () => {
    const name = document.getElementById('itemName').value.trim();
    const qty = document.getElementById('itemQty').value.trim();
    const memo = document.getElementById('itemMemo').value.trim();
    if (!validateInput(name)) return alert('名前必須');
    shoppingItems.push({ name, qty, memo });
    await saveData(); renderShoppingList();
    document.getElementById('itemName').value = '';
    document.getElementById('itemQty').value = '';
    document.getElementById('itemMemo').value = '';
});

document.getElementById('addStockBtn').addEventListener('click', async () => {
    const name = document.getElementById('stockName').value.trim();
    const qty = document.getElementById('stockQty').value.trim();
    const memo = document.getElementById('stockMemo').value.trim();
    if (!validateInput(name)) return alert('名前必須');
    stockItems.push({ name, qty, memo });
    await saveData(); renderStockList();
    document.getElementById('stockName').value = '';
    document.getElementById('stockQty').value = '';
    document.getElementById('stockMemo').value = '';
});

document.getElementById('addStoreBtn').addEventListener('click', async () => {
    const storeName = document.getElementById('storeName').value.trim();
    const itemName = document.getElementById('storeItem').value.trim();
    const price = document.getElementById('storePrice').value.trim();
    const memo = document.getElementById('storeMemo').value.trim();
    if (!validateInput(storeName) || !validateInput(itemName)) return alert('必須入力');
    const photos = storePhotoPreview.querySelectorAll('img.thumb');
    const photoFiles = Array.from(photos).map(img => img.src.split('/').pop());
    storeItems.push({ storeName, itemName, price, memo, photos: photoFiles });
    await saveData(); renderStoreList();

    // リセット
    document.getElementById('storeName').value = '';
    document.getElementById('storeItem').value = '';
    document.getElementById('storePrice').value = '';
    document.getElementById('storeMemo').value = '';
    storePhotoPreview.innerHTML = '';
});

// ---------------- 削除 ----------------
document.addEventListener('click', async e => {
    const index = e.target.dataset?.index;
    const type = e.target.dataset?.type;
    if (e.target.classList.contains('delete-btn')) {
        if (type === 'shopping') shoppingItems.splice(index, 1);
        if (type === 'stock') stockItems.splice(index, 1);
        if (type === 'store') storeItems.splice(index, 1);
    }
    if (e.target.classList.contains('delete-photo')) {
        const storeIndex = e.target.dataset.store;
        const photoIndex = e.target.dataset.index;
        const photoName = storeItems[storeIndex].photos[photoIndex];
        await fetch(`http://localhost:3000/api/store/photo/${photoName}`, { method: 'DELETE' });
        storeItems[storeIndex].photos.splice(photoIndex, 1);
    }
    await saveData();
    renderShoppingList(); renderStockList(); renderStoreList();
});

// ---------------- タブ切替 ----------------
function showTab(id, button) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}

// ---------------- 初期ロード ----------------
(async () => {
    await loadData();
    renderShoppingList(); renderStockList(); renderStoreList();
})();
