const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = './Gomadata.json';

/* ---------------- データ操作 ---------------- */
function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        return { shoppingItems: [], stockItems: [], storeItems: [] };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/* ---------------- API ---------------- */
app.get('/api/data', (req, res) => {
    res.json(loadData());
});

app.post('/api/data', (req, res) => {
    saveData(req.body);
    res.json({ status: 'ok' });
});

/* ---------------- 起動 ---------------- */
app.listen(PORT, () => {
    console.log(`Gomacart server running → http://localhost:${PORT}`);
});
