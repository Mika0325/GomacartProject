let shoppingItems = [];
let stockItems = [];
let storeItems = [];

const shoppingList = document.getElementById('shoppingList');
const stockList = document.getElementById('stockList');
const storeList = document.getElementById('storeList');

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

function renderStoreList() {
    renderList(storeList, storeItems, (item, index) => `
        ${item.storeName} - ${item.itemName} ${item.price ? '(' + item.price + '円)' : ''} ${item.memo ? ' - ' + item.memo : ''}
        <button class="delete-btn" data-index="${index}" data-type="store">削除</button>
    `);
}

document.getElementById('addStoreBtn').addEventListener('click', async () => {
    const storeName = document.getElementById('storeName').value.trim();
    const itemName = document.getElementById('storeItem').value.trim();
    const price = document.getElementById('storePrice').value.trim();
    const memo = document.getElementById('storeMemo').value.trim();
    if (!validateInput(storeName) || !validateInput(itemName)) return;

    storeItems.push({ storeName, itemName, price, memo });
    await saveData();
    renderStoreList();
    document.getElementById('storeName').value = '';
    document.getElementById('storeItem').value = '';
    document.getElementById('storePrice').value = '';
    document.getElementById('storeMemo').value = '';
});

document.addEventListener('click', async e => {
    const index = e.target.dataset?.index;
    const type = e.target.dataset?.type;

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

function showTab(id, button) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}

(async () => {
    await loadData();
    renderShoppingList();
    renderStockList();
    renderStoreList();
})();
