const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'data.sqlite');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS admissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentName TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender TEXT NOT NULL,
    class TEXT NOT NULL,
    fatherName TEXT NOT NULL,
    motherName TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    previousSchool TEXT,
    lastClass TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId TEXT NOT NULL,
    studentName TEXT NOT NULL,
    class TEXT NOT NULL,
    amount REAL NOT NULL,
    paymentMethod TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Admissions endpoint
app.post('/api/admissions', (req, res) => {
  const {
    studentName,
    dob,
    gender,
    class: classApplied,
    fatherName,
    motherName,
    phone,
    email,
    address,
    previousSchool,
    lastClass
  } = req.body || {};

  if (!studentName || !dob || !gender || !classApplied || !fatherName || !motherName || !phone || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO admissions (
      studentName, dob, gender, class, fatherName, motherName, phone, email, address, previousSchool, lastClass, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    String(studentName).trim(),
    String(dob).trim(),
    String(gender).trim(),
    String(classApplied).trim(),
    String(fatherName).trim(),
    String(motherName).trim(),
    String(phone).trim(),
    email ? String(email).trim() : null,
    String(address).trim(),
    previousSchool ? String(previousSchool).trim() : null,
    lastClass ? String(lastClass).trim() : null,
    createdAt
  );

  res.status(201).json({ id: info.lastInsertRowid });
});

// Fees endpoint
app.post('/api/fees', (req, res) => {
  const { studentId, studentName, class: classApplied, amount, paymentMethod } = req.body || {};

  if (!studentId || !studentName || !classApplied || !amount || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO fees (studentId, studentName, class, amount, paymentMethod, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    String(studentId).trim(),
    String(studentName).trim(),
    String(classApplied).trim(),
    numericAmount,
    String(paymentMethod).trim(),
    createdAt
  );

  res.status(201).json({ id: info.lastInsertRowid });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


