// GomaCartServer.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// ----------------- ミドルウェア -----------------
app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

// ----------------- Multer設定（写真保存用） -----------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'images');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        cb(null, `photo_${timestamp}_${random}${ext}`);
    }
});
const upload = multer({ storage });

// ----------------- データファイル -----------------
const DATA_FILE = path.join(__dirname, 'Gomadata.json');

// データ読み込み
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return { shoppingItems: [], stockItems: [], storeItems: [] };
    const raw = fs.readFileSync(DATA_FILE);
    return JSON.parse(raw);
}

// データ保存
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ----------------- API -----------------

// データ取得
app.get('/api/data', (req, res) => {
    const data = loadData();
    res.json(data);
});

// データ保存
app.post('/api/data', (req, res) => {
    const data = req.body;
    saveData(data);
    res.json({ status: 'ok' });
});

// 店舗アイテム追加（写真付き）
app.post('/api/store', upload.array('photos'), (req, res) => {
    const { storeName, itemName, price, memo } = req.body;
    const photos = req.files.map(f => f.filename);

    const data = loadData();
    const newItem = { storeName, itemName, price, memo, photos };
    data.storeItems.push(newItem);
    saveData(data);

    res.json(newItem);
});

// 写真削除
app.delete('/api/store/photo/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'images', filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // データ内の写真名も削除
    const data = loadData();
    data.storeItems.forEach(item => {
        if (item.photos) {
            item.photos = item.photos.filter(p => p !== filename);
        }
    });
    saveData(data);

    res.json({ status: 'deleted' });
});

// ----------------- サーバ起動 -----------------
app.listen(PORT, () => {
    console.log(`GomaCartServer running on http://localhost:${PORT}`);
});
