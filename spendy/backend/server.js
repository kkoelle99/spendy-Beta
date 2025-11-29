require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const app = express();

// CORS setup
const allowedOrigins = [
  'https://spendy-beta.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/spendy';
console.log('Connecting to MongoDB:', mongoUri);

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth0 JWT middleware using express-jwt + jwks-rsa
const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,          
    rateLimit: true,            
    jwksRequestsPerMinute: 5,   
    jwksUri: 'https://dev-rcl8pcpcwm5cxd17.us.auth0.com/.well-known/jwks.json'
  }),

  audience: 'https://spendy-api',
  issuer: 'https://dev-rcl8pcpcwm5cxd17.us.auth0.com/',
  algorithms: ['RS256'],
  requestProperty: 'user'
});

// Import routers
const expensesRouter = require('./routes/expenses');
const budgetRouter = require('./routes/budget');

// Protect API routes with jwtCheck middleware
app.use('/api/expenses', jwtCheck, expensesRouter);
app.use('/api/budget', jwtCheck, (req, res, next) => {
  console.log('Decoded JWT:', req.user);
  next();
}, budgetRouter);

app.get('/api/test-auth', jwtCheck, (req, res) => {
  console.log('✅ Test route hit. Decoded token:', req.user);

  res.json({
    message: 'Token is valid!',
    authPayload: req.user,
  });
});

// Root route (health check)
app.get('/', (req, res) => {
  res.send('Spendy API is running with Auth0 authentication!');
});

// Error handlers AFTER all routes
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.error('JWT Error:', err);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    return res.status(401).json({ message: 'Invalid token', details: err.message });
  }
  next(err);
});

// Catch-all error handler for unhandled errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', details: err.message });
});

// Server listen
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
