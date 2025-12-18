const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

const multer = require('multer');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const DATA_FILE = './Gomadata.json';

function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        return { shoppingItems: [], stockItems: [], storeItems: [] };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/data', (req, res) => {
    const data = loadData();
    res.json(data);
});

app.post('/api/data', (req, res) => {
    saveData(req.body);
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Gomacart サーバ起動 → http://localhost:${PORT}/Goma.html`);
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/images/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/api/store', upload.array('photos', 10), (req, res) => {
    const { storeName, itemName, price, memo } = req.body;
    const photos = req.files.map(f => f.filename);
    const data = loadData();
    const storeItem = { storeName, itemName, price, memo, photos };
    data.storeItems.push(storeItem);
    saveData(data);
    res.json(storeItem);
});

app.delete('/api/store/photo/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = `public/images/${filename}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ status: 'ok' });
});
