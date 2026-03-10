require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { initializeEmbedder } = require('./utils/embeddings');

// Remove early execution here since it will wrap the entire server
// Bootloader logic will wrap the app.listen

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://doc-querry.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Basic Health Check Route (API level)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DocuQuery AI Backend is running smoothly.' });
});

// Render Health Check Route (Root level)
app.get('/', (req, res) => {
  res.send('DocQuery API running');
});

// Define standard port
const PORT = process.env.PORT || 5001;

// Connect to MongoDB and then pre-heat local transformers model sequentially
connectDB().then(async () => {
  console.log("MongoDB Connected. Heating up local vector models...");
  await initializeEmbedder();
  
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server securely:", err);
  process.exit(1);
});
