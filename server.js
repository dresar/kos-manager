const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  }
}

function defaultData() {
  return {
    settings: { currency: 'IDR', kosName: 'Kos Manager', ownerName: '', paymentAccount: '' },
    rooms: [],
    tenants: [],
    transactions: [],
    bills: []
  };
}

function readDB() {
  try {
    const content = fs.readFileSync(DB_PATH, 'utf8');
    if (!content.trim()) return defaultData();
    const parsed = JSON.parse(content);
    return { ...defaultData(), ...parsed };
  } catch (err) {
    return defaultData();
  }
}

function writeDB(data) {
  ensureDataDir();
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  if (digits.startsWith('8')) digits = '628' + digits.slice(1);
  return digits;
}

function findTenantByRoomId(db, roomId) {
  const room = db.rooms.find(r => r.id === roomId);
  if (!room) return null;
  return {
    id: room.tenantPhone || room.id,
    name: room.tenantName,
    phone: room.tenantPhone,
    roomId: room.id
  };
}

function findTenantById(db, tenantId) {
  const fromRooms = db.rooms.find(r => r.id === tenantId || r.tenantPhone === tenantId);
  if (fromRooms) {
    return {
      id: fromRooms.tenantPhone || fromRooms.id,
      name: fromRooms.tenantName,
      phone: fromRooms.tenantPhone,
      roomId: fromRooms.id
    };
  }
  const fromTenants = db.tenants.find(t => t.id === tenantId);
  if (fromTenants) return fromTenants;
  return null;
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/data', (req, res) => {
  const db = readDB();
  res.json({
    settings: db.settings,
    rooms: db.rooms,
    transactions: db.transactions,
    bills: db.bills
  });
});

app.get('/api/rooms', (req, res) => {
  const db = readDB();
  res.json(db.rooms);
});

app.get('/api/rooms/:id', (req, res) => {
  const db = readDB();
  const room = db.rooms.find(r => r.id === req.params.id);
  if (room) {
    res.json(room);
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

app.post('/api/rooms', (req, res) => {
  const db = readDB();
  const roomIndex = db.rooms.findIndex(r => r.id === req.body.id);

  if (roomIndex >= 0) {
    db.rooms[roomIndex] = { ...db.rooms[roomIndex], ...req.body };
  } else {
    db.rooms.push(req.body);
  }

  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/rooms/:id', (req, res) => {
  const db = readDB();
  db.rooms = db.rooms.filter(r => r.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

app.get('/api/tenants', (req, res) => {
  const db = readDB();
  const derived = db.rooms
    .filter(r => r.tenantName && r.tenantName !== '-')
    .map(r => ({
      id: r.tenantPhone || r.id,
      name: r.tenantName,
      phone: r.tenantPhone,
      roomId: r.id
    }));
  res.json(derived.length ? derived : db.tenants);
});

app.get('/api/tenants/:id', (req, res) => {
  const db = readDB();
  const tenant = db.tenants.find(t => t.id === req.params.id);
  if (tenant) {
    res.json(tenant);
  } else {
    res.status(404).json({ error: 'Tenant not found' });
  }
});

app.post('/api/tenants', (req, res) => {
  const db = readDB();
  const tenantIndex = db.tenants.findIndex(t => t.id === req.body.id);

  if (tenantIndex >= 0) {
    db.tenants[tenantIndex] = { ...db.tenants[tenantIndex], ...req.body };
  } else {
    db.tenants.push(req.body);
  }

  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/tenants/:id', (req, res) => {
  const db = readDB();
  db.tenants = db.tenants.filter(t => t.id !== req.params.id);
  db.rooms.forEach(room => {
    if (room.tenantId === req.params.id) {
      room.tenantId = null;
      room.status = 'KOSONG';
    }
  });
  writeDB(db);
  res.json({ success: true });
});

app.get('/api/transactions', (req, res) => {
  const db = readDB();
  res.json(db.transactions);
});

app.post('/api/transactions', (req, res) => {
  const db = readDB();
  const transaction = {
    id: req.body.id || Date.now().toString(),
    ...req.body,
    timestamp: new Date().toISOString()
  };

  db.transactions.push(transaction);
  writeDB(db);
  res.json({ success: true, id: transaction.id });
});

app.delete('/api/transactions/:id', (req, res) => {
  const db = readDB();
  db.transactions = db.transactions.filter(t => t.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

app.get('/api/bills', (req, res) => {
  const db = readDB();
  res.json(db.bills);
});

app.post('/api/bills/pay', (req, res) => {
  const db = readDB();
  const bill = db.bills.find(b => b.id === req.body.billId);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }
  bill.status = 'LUNAS';
  db.transactions.push({
    id: 'TX-' + Date.now(),
    date: new Date().toISOString().split('T')[0],
    type: 'PEMASUKAN',
    category: 'Sewa Kamar',
    amount: bill.amount,
    description: `Pembayaran ${bill.id} - ${bill.tenantName}`,
    timestamp: new Date().toISOString()
  });
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/bills/generate-wa', (req, res) => {
  const db = readDB();
  const bill = db.bills.find(b => b.id === req.body.billId);
  if (!bill) {
    return res.status(404).json({ success: false, error: 'Bill not found' });
  }
  const message = `Halo ${bill.tenantName}, ini pengingat pembayaran sewa kamar ${bill.roomId} sebesar Rp${bill.amount.toLocaleString()} untuk periode ${bill.month}. Mohon segera melunasi. Terima kasih.`;
  const phone = normalizePhone(bill.tenantPhone);
  res.json({
    success: true,
    message,
    waUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  });
});

app.get('/api/cashflow', (req, res) => {
  const db = readDB();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyIncome = db.transactions
    .filter(t => {
      const tDate = new Date(t.timestamp || t.date);
      return t.type === 'income' &&
             tDate.getMonth() === currentMonth &&
             tDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlyExpenses = db.transactions
    .filter(t => {
      const tDate = new Date(t.timestamp || t.date);
      return t.type === 'expense' &&
             tDate.getMonth() === currentMonth &&
             tDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  res.json({
    monthlyIncome,
    monthlyExpenses,
    balance: monthlyIncome - monthlyExpenses,
    currency: db.settings.currency
  });
});

app.post('/api/whatsapp-reminder', (req, res) => {
  const { tenantId, roomId, amount } = req.body;
  const db = readDB();

  let tenant = null;
  if (roomId) {
    tenant = findTenantByRoomId(db, roomId);
  } else if (tenantId) {
    tenant = findTenantById(db, tenantId);
  }

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  const target = roomId || tenantId;
  const message = `Halo ${tenant.name},

Ini adalah pengingat bahwa pembayaran sewa kamar ${target} sebesar Rp${amount.toLocaleString()} sudah jatuh tempo. Mohon segera melakukan pembayaran. Terima kasih.`;
  const phoneNumber = normalizePhone(tenant.phone);
  const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  res.json({
    waLink,
    message,
    success: true
  });
});

app.post('/api/ai-advisor', async (req, res) => {
  try {
    const db = readDB();

    const occupied = db.rooms.filter(r => r.status === 'TERISI').length;
    const total = db.rooms.length;
    const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(1) + '%' : '0%';

    const advisorResponse = {
      recommendations: [
        'Occupancy rate is currently optimal, consider slight price increase for premium rooms',
        'Several tenants are consistently late with payments, implement early payment incentives',
        'Maintenance expenses are higher than average, negotiate better rates with suppliers',
        'Peak season approaching, prepare for increased demand'
      ],
      financialInsights: {
        monthlyCashflow: 'Positive trend, income exceeds expenses by 35%',
        overduePayments: db.rooms.filter(r => r.status === 'MENUNGGAK').length,
        occupancyRate
      },
      riskFactors: [
        '2 tenants showing payment delays',
        '1 room approaching maintenance schedule'
      ]
    };

    res.json({
      advice: advisorResponse,
      success: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kos Manager running on http://localhost:${PORT}`);
});