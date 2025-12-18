let shoppingItems = [];
let stockItems = [];
let storeItems = [];

const shoppingList = document.getElementById('shoppingList');
const stockList = document.getElementById('stockList');
const storeList = document.getElementById('storeList');

const storePhotoInput = document.getElementById('storePhoto');
const storePhotoPreview = document.getElementById('storePhotoPreview');

async function loadData() {
    try {
        const res = await fetch('http://localhost:3000/api/data');
        if (!res.ok) throw new Error('サーバ応答なし');
        const data = await res.json();
        shoppingItems = data.shoppingItems || [];
        stockItems = data.stockItems || [];
        storeItems = data.storeItems || [];
        localStorage.setItem('gomacart-data', JSON.stringify(data));
    } catch {
        console.warn('サーバ未接続。localStorageから読み込みます。');
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch {
        console.warn('サーバ未接続。localStorageに保存しました。');
    }
}

function validateInput(name) {
    if (!name || !name.trim()) {
        alert('名前は必須です');
        return false;
    }
    return true;
}

function renderList(listElem, items, renderItemFn) {
    listElem.innerHTML = '';
    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = renderItemFn(item, index);
        listElem.appendChild(li);
    });
}

function renderShoppingList() {
    renderList(shoppingList, shoppingItems, (item, index) => `
        ${item.name} ${item.qty ? '(' + item.qty + ')' : ''} ${item.memo ? ' - ' + item.memo : ''}
        <button class="delete-btn" data-index="${index}" data-type="shopping">削除</button>
        <button class="move-btn" data-index="${index}" data-type="shopping">在庫へ</button>
    `);
}

document.getElementById('addItemBtn').addEventListener('click', async () => {
    const name = document.getElementById('itemName').value.trim();
    const qty = document.getElementById('itemQty').value.trim();
    const memo = document.getElementById('itemMemo').value.trim();
    if (!validateInput(name)) return;

    shoppingItems.push({ name, qty, memo });
    await saveData();
    renderShoppingList();
    document.getElementById('itemName').value = '';
    document.getElementById('itemQty').value = '';
    document.getElementById('itemMemo').value = '';
});

function renderStockList() {
    renderList(stockList, stockItems, (item, index) => `
        ${item.name} ${item.qty ? '(' + item.qty + ')' : ''} ${item.memo ? ' - ' + item.memo : ''}
        <button class="edit-btn" data-index="${index}" data-type="stock">編集</button>
        <button class="delete-btn" data-index="${index}" data-type="stock">削除</button>
    `);
}

document.getElementById('addStockBtn').addEventListener('click', async () => {
    const name = document.getElementById('stockName').value.trim();
    const qty = document.getElementById('stockQty').value.trim();
    const memo = document.getElementById('stockMemo').value.trim();
    if (!validateInput(name)) return;

    stockItems.push({ name, qty, memo });
    await saveData();
    renderStockList();
    document.getElementById('stockName').value = '';
    document.getElementById('stockQty').value = '';
    document.getElementById('stockMemo').value = '';
});

// ======================== 店舗メモ ========================

function renderStoreList() {
    renderList(storeList, storeItems, (item, index) => `
        ${item.storeName} - ${item.itemName} ${item.price ? '(' + item.price + '円)' : ''} ${item.memo ? ' - ' + item.memo : ''}
        ${item.photos ? item.photos.map((p, i) => `
            <span>
                <img src="images/${p}" class="thumb" data-index="${i}" data-store="${index}">
                <button class="delete-photo" data-index="${i}" data-store="${index}">×</button>
            </span>
        `).join('') : ''}
        <button class="delete-btn" data-index="${index}" data-type="store">削除</button>
    `);
}

// 画像を Canvas で縮小
function resizeImage(file, maxWidth = 100, maxHeight = 100) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            let w = img.width;
            let h = img.height;

            if (w > h) {
                if (w > maxWidth) { h *= maxWidth / w; w = maxWidth; }
            } else {
                if (h > maxHeight) { w *= maxHeight / h; h = maxHeight; }
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.7);
        };
        img.src = URL.createObjectURL(file);
    });
}

// サムネイルプレビュー
storePhotoInput.addEventListener('change', async () => {
    storePhotoPreview.innerHTML = '';
    for (const file of storePhotoInput.files) {
        const thumbBlob = await resizeImage(file);
        const thumbUrl = URL.createObjectURL(thumbBlob);
        const imgElem = document.createElement('img');
        imgElem.src = thumbUrl;
        imgElem.dataset.blobUrl = thumbUrl;
        storePhotoPreview.appendChild(imgElem);
    }
});

document.getElementById('addStoreBtn').addEventListener('click', async () => {
    const storeName = document.getElementById('storeName').value.trim();
    const itemName = document.getElementById('storeItem').value.trim();
    const price = document.getElementById('storePrice').value.trim();
    const memo = document.getElementById('storeMemo').value.trim();
    if (!validateInput(storeName) || !validateInput(itemName)) return;

    // フォーム送信
    const formData = new FormData();
    formData.append('storeName', storeName);
    formData.append('itemName', itemName);
    formData.append('price', price);
    formData.append('memo', memo);
    Array.from(storePhotoInput.files).forEach(f => formData.append('photos', f));

    const res = await fetch('http://localhost:3000/api/store', { method: 'POST', body: formData });
    const result = await res.json();
    storeItems.push(result);
    renderStoreList();

    // リセット
    document.getElementById('storeName').value = '';
    document.getElementById('storeItem').value = '';
    document.getElementById('storePrice').value = '';
    document.getElementById('storeMemo').value = '';
    storePhotoInput.value = '';
    storePhotoPreview.innerHTML = '';
});

// 削除処理
document.addEventListener('click', async e => {
    const index = e.target.dataset?.index;
    const type = e.target.dataset?.type;

    if (e.target.classList.contains('delete-photo')) {
        const storeIndex = e.target.dataset.store;
        const photoIndex = e.target.dataset.index;
        const photoName = storeItems[storeIndex].photos[photoIndex];

        await fetch(`http://localhost:3000/api/store/photo/${photoName}`, { method: 'DELETE' });
        storeItems[storeIndex].photos.splice(photoIndex, 1);
        renderStoreList();
        await saveData();
        return;
    }

    if (!index || !type) return;

    if (e.target.classList.contains('delete-btn')) {
        if (type === 'shopping') shoppingItems.splice(index, 1);
        if (type === 'stock') stockItems.splice(index, 1);
        if (type === 'store') storeItems.splice(index, 1);
    }

    if (e.target.classList.contains('move-btn') && type === 'shopping') {
        const item = shoppingItems.splice(index, 1)[0];
        stockItems.push({ name: item.name, qty: item.qty, memo: item.memo });
    }

    if (e.target.classList.contains('edit-btn') && type === 'stock') {
        const item = stockItems[index];
        const newName = prompt('新しい名前', item.name);
        if (newName === null) return;
        const newQty = prompt('数量', item.qty);
        const newMemo = prompt('メモ', item.memo);
        stockItems[index] = { name: newName.trim(), qty: newQty.trim(), memo: newMemo.trim() };
    }

    await saveData();
    renderShoppingList();
    renderStockList();
    renderStoreList();
});

// タブ切替
function showTab(id, button) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}

// 初期化
(async () => {
    await loadData();
    renderShoppingList();
    renderStockList();
    renderStoreList();
})();
