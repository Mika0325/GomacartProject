const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

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
