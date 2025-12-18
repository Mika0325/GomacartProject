const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// データファイル
const DATA_FILE = path.join(__dirname, 'Gomadata.json');
// 画像保存フォルダ
const IMAGE_DIR = path.join(__dirname, 'images');

// CORS許可
app.use(cors());
// JSONパース
app.use(express.json());
// staticでimagesフォルダ公開
app.use('/images', express.static(IMAGE_DIR));

// ---------------- データロード・保存 ----------------
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return { shoppingItems: [], stockItems: [], storeItems: [] };
    const json = fs.readFileSync(DATA_FILE, 'utf-8');
    try { return JSON.parse(json); } catch { return { shoppingItems: [], stockItems: [], storeItems: [] }; }
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ----------------- ルート -----------------
app.get('/api/data', (req, res) => {
    const data = loadData();
    res.json(data);
});

app.post('/api/data', (req, res) => {
    const data = req.body;
    saveData(data);
    res.json({ status: 'ok' });
});

// ----------------- 画像アップロード ----------------
if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR);

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, IMAGE_DIR); },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.floor(Math.random() * 1000);
        const ext = path.extname(file.originalname);
        cb(null, unique + ext);
    }
});
const upload = multer({ storage });

app.post('/api/store/photo', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'ファイルなし' });
    res.json({ filename: req.file.filename });
});

// ----------------- 画像削除 ----------------
app.delete('/api/store/photo/:filename', (req, res) => {
    const filePath = path.join(IMAGE_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ status: 'deleted' });
    } else {
        res.status(404).json({ error: 'not found' });
    }
});

// ----------------- サーバ起動 ----------------
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
