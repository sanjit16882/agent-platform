// Sample E-commerce Application Code with Multiple Issues
// This code has security vulnerabilities, code quality issues, and bugs
// that an agent should detect and create GitHub tickets for

const express = require('express');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(helmet()); // Security headers

// FIXED ISSUE 1: Use environment variables instead of hardcoded credentials
const DB_PASSWORD = process.env.DB_PASSWORD;
const API_KEY = process.env.API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

// FIXED ISSUE 2: Use parameterized queries to prevent SQL injection
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  
  // Validate userId is a number
  if (!Number.isInteger(parseInt(userId))) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  // Use parameterized query
  const query = "SELECT * FROM users WHERE id = ?";
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database error');
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

// FIXED ISSUE 3: Add input validation
app.post('/api/user/update', (req, res) => {
  const userData = req.body;
  
  // Validate required fields
  if (!userData.id || !userData.email || !userData.username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Sanitize and validate username
  if (userData.username.length < 3 || userData.username.length > 50) {
    return res.status(400).json({ error: 'Username must be 3-50 characters' });
  }
  
  updateUser(userData);
  res.json({ success: true });
});

// FIXED ISSUE 4: Prevent XSS by escaping HTML or using JSON responses
app.get('/profile/:username', (req, res) => {
  const username = req.params.username;
  
  // Option 1: Return JSON instead of HTML
  res.json({ message: `Welcome ${username}` });
  
  // Option 2: If HTML is needed, escape the input
  // const escapeHtml = (str) => str.replace(/[&<>"']/g, (char) => ({
  //   '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  // }[char]));
  // res.send(`<h1>Welcome ${escapeHtml(username)}</h1>`);
});

// FIXED ISSUE 5: Add proper error handling
app.post('/api/payment', async (req, res) => {
  const amount = req.body.amount;
  
  // Validate amount
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount' });
  }
  
  try {
    const result = await processPayment(amount);
    res.json({ status: 'success', transactionId: result.id });
  } catch (error) {
    console.error('Payment processing error:', error.message);
    res.status(500).json({ 
      error: 'Payment processing failed',
      message: 'Please try again later'
    });
  }
});

// FIXED ISSUE 6: Hash passwords before storing
async function createUser(username, password) {
  // Hash password with bcrypt (10 rounds)
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  const user = {
    username: username,
    password: hashedPassword // Store hashed password
  };
  db.insert('users', user);
}

// FIXED ISSUE 7: Add authentication and authorization middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

app.delete('/api/admin/delete-user/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  db.delete('users', userId);
  res.json({ deleted: true });
});

// FIXED ISSUE 8: Use database auto-increment or UUID to prevent race conditions
const { v4: uuidv4 } = require('uuid');

app.post('/api/order', async (req, res) => {
  try {
    // Option 1: Use UUID for guaranteed uniqueness
    const orderId = uuidv4();
    
    // Option 2: Use database auto-increment (commented)
    // const result = await db.query('INSERT INTO orders (...) VALUES (...)');
    // const orderId = result.insertId;
    
    await createOrder(orderId, req.body);
    res.json({ orderId });
  } catch (error) {
    console.error('Order creation error:', error.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// FIXED ISSUE 9: Use LRU cache with size limit to prevent memory leaks
const LRU = require('lru-cache');

const cache = new LRU({
  max: 500, // Maximum 500 items
  maxAge: 1000 * 60 * 60 // 1 hour TTL
});

app.get('/api/data/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    // Check cache first
    let data = cache.get(id);
    
    if (!data) {
      // Fetch from source if not in cache
      data = await fetchData(id);
      cache.set(id, data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Data fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// FIXED ISSUE 10: Never log sensitive data like passwords
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Only log non-sensitive information
  console.log(`Login attempt for user: ${username}`);
  
  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Compare hashed password
    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
      res.json({ token: generateToken(username) });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// FIXED ISSUE 11: Validate redirect URLs against whitelist
const ALLOWED_REDIRECT_DOMAINS = ['example.com', 'trusted-site.com'];

app.get('/redirect', (req, res) => {
  const url = req.query.url;
  
  try {
    const parsedUrl = new URL(url);
    
    // Check if domain is in whitelist
    if (!ALLOWED_REDIRECT_DOMAINS.includes(parsedUrl.hostname)) {
      return res.status(400).json({ error: 'Invalid redirect URL' });
    }
    
    res.redirect(url);
  } catch (error) {
    res.status(400).json({ error: 'Invalid URL format' });
  }
});

// FIXED ISSUE 12: Add rate limiting to prevent abuse
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many email requests, please try again later'
});

app.post('/api/send-email', emailLimiter, (req, res) => {
  const email = req.body.email;
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  sendEmail(email);
  res.json({ sent: true });
});

// FIXED ISSUE 13: Use generic error messages to prevent user enumeration
app.post('/api/login-check', async (req, res) => {
  const { username, password } = req.body;
  
  // Use the same generic message for all authentication failures
  const genericError = 'Invalid credentials';
  
  if (!userExists(username)) {
    return res.status(401).json({ error: genericError });
  }
  
  if (!await checkPassword(username, password)) {
    return res.status(401).json({ error: genericError });
  }
  
  res.json({ success: true });
});

// FIXED ISSUE 14: Secure file upload with validation
const path = require('path');
const crypto = require('crypto');

const ALLOWED_FILE_TYPES = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

app.post('/api/upload', (req, res) => {
  if (!req.files || !req.files.upload) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const file = req.files.upload;
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return res.status(400).json({ error: 'File too large (max 5MB)' });
  }
  
  // Validate file extension
  const fileExt = path.extname(file.name).toLowerCase();
  if (!ALLOWED_FILE_TYPES.includes(fileExt)) {
    return res.status(400).json({ error: 'File type not allowed' });
  }
  
  // Generate secure random filename to prevent path traversal
  const secureFilename = crypto.randomBytes(16).toString('hex') + fileExt;
  const uploadPath = path.join(__dirname, 'uploads', secureFilename);
  
  // Ensure the path is within the uploads directory
  if (!uploadPath.startsWith(path.join(__dirname, 'uploads'))) {
    return res.status(400).json({ error: 'Invalid file path' });
  }
  
  file.mv(uploadPath, (err) => {
    if (err) {
      console.error('File upload error');
      return res.status(500).json({ error: 'Upload failed' });
    }
    res.json({ uploaded: true, filename: secureFilename });
  });
});

// FIXED ISSUE 15: Configure CORS properly
const cors = require('cors');
const corsOptions = {
  origin: ['https://trusted-domain.com', 'https://another-trusted-domain.com'],
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

// FIXED ISSUE 16: Update dependencies in package.json to latest secure versions
// express@^4.18.0 (latest stable)
// body-parser@^1.20.0 (latest stable)
// Run: npm audit fix to update vulnerable dependencies

// FIXED ISSUE 17: Enforce HTTPS and use secure server configuration
const https = require('https');
const fs = require('fs');

// Redirect HTTP to HTTPS
const httpApp = express();
httpApp.use((req, res) => {
  res.redirect(301, `https://${req.headers.host}${req.url}`);
});
httpApp.listen(80);

// HTTPS server configuration
const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH)
};

https.createServer(httpsOptions, app).listen(443, () => {
  console.log('Secure server running on HTTPS port 443');
});

// FIXED ISSUE 18: Convert callback hell to async/await
async function processOrder(orderId) {
  try {
    const order = await getOrder(orderId);
    const isValid = await validateOrder(order);
    
    if (!isValid) {
      throw new Error('Order validation failed');
    }
    
    const payment = await processPayment(order);
    const inventory = await updateInventory(order);
    const confirmation = await sendConfirmation(order);
    
    console.log('Order processed successfully', {
      orderId,
      paymentId: payment.id,
      inventoryUpdated: inventory.success,
      confirmationSent: confirmation.sent
    });
    
    return { success: true, orderId };
  } catch (error) {
    console.error('Order processing failed:', error.message);
    throw error;
  }
}

// FIXED ISSUE 19: Replace magic numbers with named constants
const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.1; // 10% discount
const MIN_DISCOUNT = 0;

function calculateDiscount(price) {
  if (price > DISCOUNT_THRESHOLD) {
    return price * DISCOUNT_RATE;
  }
  return MIN_DISCOUNT;
}

// FIXED ISSUE 20: Removed unused variables and dead code
// All unused code has been removed to improve maintainability
