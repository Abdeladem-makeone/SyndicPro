
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/syndicpro')
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur MongoDB:', err));

// --- SCHEMAS ---

const ApartmentSchema = new mongoose.Schema({
  number: String,
  owner: String,
  shares: Number,
  monthlyFee: Number,
  floor: Number,
  phone: String,
  email: String
});

const OperationSchema = new mongoose.Schema({
  type: { type: String, enum: ['project', 'complaint'], required: true },
  title: String,
  description: String,
  status: String,
  priority: String,
  authorName: String,
  apartmentNumber: String,
  attachments: Array,
  date: { type: Date, default: Date.now }
});

const PaymentSchema = new mongoose.Schema({
  apartmentId: String,
  month: Number,
  year: Number,
  amount: Number,
  paidDate: Date
});

const ExpenseSchema = new mongoose.Schema({
  date: Date,
  category: String,
  description: String,
  amount: Number,
  excludedFromReports: Boolean
});

// --- MODELS ---
const Apartment = mongoose.model('Apartment', ApartmentSchema);
const Operation = mongoose.model('Operation', OperationSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);

// --- API ROUTES ---

// Initialisation (Setup)
app.post('/api/setup', async (req, res) => {
  try {
    const { apartments } = req.body;
    await Apartment.deleteMany({}); // Reset si nécessaire
    const created = await Apartment.insertMany(apartments);
    res.json({ success: true, count: created.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/apartments', async (req, res) => {
  const apts = await Apartment.find();
  res.json(apts);
});

app.get('/api/operations', async (req, res) => {
  const ops = await Operation.find().sort({ date: -1 });
  res.json({
    projects: ops.filter(o => o.type === 'project'),
    complaints: ops.filter(o => o.type === 'complaint')
  });
});

app.get('/api/finances', async (req, res) => {
  const year = parseInt(req.query.year);
  const payments = await Payment.find({ year });
  const expenses = await Expense.find();
  res.json({ payments, expenses });
});

app.post('/api/payments/toggle', async (req, res) => {
  const { apartmentId, month, year } = req.body;
  const existing = await Payment.findOne({ apartmentId, month, year });
  if (existing) {
    await Payment.deleteOne({ _id: existing._id });
    res.json({ removed: true });
  } else {
    const p = new Payment(req.body);
    await p.save();
    res.json(p);
  }
});

app.post('/api/operations/:type', async (req, res) => {
  const op = new Operation({ ...req.body, type: req.params.type });
  await op.save();
  res.json(op);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
