/* =============================
   データ定義
============================= */
let shoppingItems = [];
let stockItems = [];
let storeItems = [];

const shoppingList = document.getElementById('shoppingList');
const stockList = document.getElementById('stockList');
const storeList = document.getElementById('storeList');

/* =============================
   データロード / 保存
============================= */
function loadData() {
    const data = JSON.parse(localStorage.getItem('gomacart-data') || '{}');
    shoppingItems = data.shoppingItems || [];
    stockItems = data.stockItems || [];
    storeItems = data.storeItems || [];
}

function saveData() {
    const data = { shoppingItems, stockItems, storeItems };
    localStorage.setItem('gomacart-data', JSON.stringify(data));
}

/* =============================
   入力バリデーション
============================= */
function validateInput(value) {
    if (!value || !value.trim()) {
        alert('必須項目です');
        return false;
    }
    return true;
}

/* =============================
   リスト描画（共通）
============================= */
function renderList(listElem, items, renderFn) {
    listElem.innerHTML = '';
    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = renderFn(item, index);
        listElem.appendChild(li);
    });
}

/* =============================
   各リスト描画
============================= */
function renderShoppingList() {
    renderList(shoppingList, shoppingItems, (item, index) => `
        ${item.name} ${item.qty ? '(' + item.qty + ')' : ''}
        ${item.memo ? ' - ' + item.memo : ''}
        <button class="delete-btn" data-type="shopping" data-index="${index}">削除</button>
        <button class="move-btn" data-index="${index}">在庫へ</button>
    `);
}

function renderStockList() {
    renderList(stockList, stockItems, (item, index) => `
        ${item.name} ${item.qty ? '(' + item.qty + ')' : ''}
        ${item.memo ? ' - ' + item.memo : ''}
        <button class="edit-btn" data-type="stock" data-index="${index}">編集</button>
        <button class="delete-btn" data-type="stock" data-index="${index}">削除</button>
    `);
}

function renderStoreList() {
    renderList(storeList, storeItems, (item, index) => `
        ${item.storeName} - ${item.itemName}
        ${item.price ? '(' + item.price + '円)' : ''}
        ${item.memo ? ' - ' + item.memo : ''}
        <button class="edit-btn" data-type="store" data-index="${index}">編集</button>
        <button class="delete-btn" data-type="store" data-index="${index}">削除</button>
    `);
}

/* =============================
   追加処理
============================= */
addItemBtn.addEventListener('click', () => {
    if (!validateInput(itemName.value)) return;

    shoppingItems.push({
        name: itemName.value.trim(),
        qty: itemQty.value.trim(),
        memo: itemMemo.value.trim()
    });

    itemName.value = '';
    itemQty.value = '';
    itemMemo.value = '';

    saveData();
    renderShoppingList();
});

addStockBtn.addEventListener('click', () => {
    if (!validateInput(stockName.value)) return;

    stockItems.push({
        name: stockName.value.trim(),
        qty: stockQty.value.trim(),
        memo: stockMemo.value.trim()
    });

    stockName.value = '';
    stockQty.value = '';
    stockMemo.value = '';

    saveData();
    renderStockList();
});

addStoreBtn.addEventListener('click', () => {
    if (!validateInput(storeName.value) || !validateInput(storeItem.value)) return;

    storeItems.push({
        storeName: storeName.value.trim(),
        itemName: storeItem.value.trim(),
        price: storePrice.value.trim(),
        memo: storeMemo.value.trim()
    });

    storeName.value = '';
    storeItem.value = '';
    storePrice.value = '';
    storeMemo.value = '';

    saveData();
    renderStoreList();
});

/* =============================
   操作（削除・移動・編集）
============================= */
document.addEventListener('click', e => {
    const index = Number(e.target.dataset.index);

    /* 削除 */
    if (e.target.classList.contains('delete-btn')) {
        const type = e.target.dataset.type;
        if (type === 'shopping') shoppingItems.splice(index, 1);
        if (type === 'stock') stockItems.splice(index, 1);
        if (type === 'store') storeItems.splice(index, 1);
    }

    /* 買い物 → 在庫 */
    if (e.target.classList.contains('move-btn')) {
        const item = shoppingItems.splice(index, 1)[0];
        stockItems.push(item);
    }

    /* 編集 */
    if (e.target.classList.contains('edit-btn')) {
        const type = e.target.dataset.type;

        // 在庫編集
        if (type === 'stock') {
            const item = stockItems[index];
            const name = prompt('名前', item.name);
            if (name === null) return;
            const qty = prompt('数量', item.qty);
            const memo = prompt('メモ', item.memo);
            stockItems[index] = { name, qty, memo };
        }

        // 店舗メモ編集
        if (type === 'store') {
            const item = storeItems[index];
            const storeName = prompt('店舗名', item.storeName);
            if (storeName === null) return;
            const itemName = prompt('商品名', item.itemName);
            if (itemName === null) return;
            const price = prompt('値段', item.price);
            const memo = prompt('メモ', item.memo);
            storeItems[index] = { storeName, itemName, price, memo };
        }
    }

    saveData();
    renderShoppingList();
    renderStockList();
    renderStoreList();
});

/* =============================
   タブ切替
============================= */
function showTab(id, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

/* =============================
   初期化
============================= */
loadData();
renderShoppingList();
renderStockList();
renderStoreList();
