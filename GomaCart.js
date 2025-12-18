let shoppingItems = [];
let stockItems = [];
let storeItems = [];

const shoppingList = document.getElementById('shoppingList');
const stockList = document.getElementById('stockList');
const storeList = document.getElementById('storeList');

const storePhotoInput = document.getElementById('storePhoto');
const storePhotoPreview = document.getElementById('storePhotoPreview');

// データ読み込み
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

// データ保存
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

// 入力チェック
function validateInput(name) {
    if (!name || !name.trim()) {
        alert('名前は必須です');
        return false;
    }
    return true;
}

// 共通リスト描画
function renderList(listElem, items, renderItemFn) {
    listElem.innerHTML = '';
    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = renderItemFn(item, index);
        listElem.appendChild(li);
    });
}

// 買い物リスト
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

// 在庫リスト
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

// 店舗メモリスト（写真対応）
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

// 店舗写真プレビュー
storePhotoInput.addEventListener('change', () => {
    storePhotoPreview.innerHTML = '';
    Array.from(storePhotoInput.files).forEach((file, i) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.dataset.index = i;
        storePhotoPreview.appendChild(img);
    });
});

// 店舗追加
document.getElementById('addStoreBtn').addEventListener('click', async () => {
    const storeName = document.getElementById('storeName').value.trim();
    const itemName = document.getElementById('storeItem').value.trim();
    const price = document.getElementById('storePrice').value.trim();
    const memo = document.getElementById('storeMemo').value.trim();
    if (!validateInput(storeName) || !validateInput(itemName)) return;

    const formData = new FormData();
    formData.append('storeName', storeName);
    formData.append('itemName', itemName);
    formData.append('price', price);
    formData.append('memo', memo);

    Array.from(storePhotoInput.files).forEach(file => formData.append('photos', file));

    const res = await fetch('http://localhost:3000/api/store', {
        method: 'POST',
        body: formData
    });

    const result = await res.json(); // photos 配列を含むオブジェクト
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

// クリックイベント（削除・写真削除・在庫移動・編集）
document.addEventListener('click', async e => {
    const type = e.target.dataset?.type;
    const index = e.target.dataset?.index;

    // アイテム削除
    if (e.target.classList.contains('delete-btn')) {
        if (type === 'shopping') shoppingItems.splice(index, 1);
        if (type === 'stock') stockItems.splice(index, 1);
        if (type === 'store') storeItems.splice(index, 1);
    }

    // 写真削除
    if (e.target.classList.contains('delete-photo')) {
        const storeIndex = e.target.dataset.store;
        const photoIndex = e.target.dataset.index;
        const photoName = storeItems[storeIndex].photos[photoIndex];

        // サーバーに削除リクエスト
        await fetch(`http://localhost:3000/api/store/photo/${photoName}`, { method: 'DELETE' });

        // フロントでも削除
        storeItems[storeIndex].photos.splice(photoIndex, 1);
    }

    // 在庫へ移動
    if (e.target.classList.contains('move-btn') && type === 'shopping') {
        const item = shoppingItems.splice(index, 1)[0];
        stockItems.push({ name: item.name, qty: item.qty, memo: item.memo });
    }

    // 在庫編集
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

// 初期描画
(async () => {
    await loadData();
    renderShoppingList();
    renderStockList();
    renderStoreList();
})();
