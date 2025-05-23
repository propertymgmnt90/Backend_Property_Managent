



import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import connectdb from './config/mongodb.js';
import { trackAPIStats } from './middleware/statsMiddleware.js';
import propertyrouter from './routes/ProductRouter.js';
import userrouter from './routes/UserRoute.js';
import formrouter from './routes/formrouter.js';
import newsrouter from './routes/newsRoute.js';
import appointmentRouter from './routes/appointmentRoute.js';
import adminRouter from './routes/adminRoute.js';
import propertyRoutes from './routes/propertyRoutes.js';
import { randomBytes } from 'crypto';

dotenv.config();

const app = express();

// Apply base helmet middleware without CSP
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Middleware to generate nonce and set CSP header per request
app.use((req, res, next) => {
  const nonce = randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; upgrade-insecure-requests`
  );
  next();
});

app.use(compression());

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(trackAPIStats);

// CORS Configuration
// app.use(cors({
//   origin: [
//     'http://localhost:4000',
//     'http://localhost:5174',
//     'http://localhost:5173',
//   ],
// // CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:4000',
    'http://localhost:5174',
    'http://localhost:5173',
    'https://backend-property-managent.onrender.com',
    // 'https://e2f2-110-226-127-135.ngrok-free.app/',
    // 'https://buildestate.vercel.app',
    // 'https://real-estate-website-admin.onrender.com',
    // 'https://real-estate-website-backend-zfu7.onrender.com',
    'https://admin-property-managent.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Database connection
connectdb().then(() => {
  console.log('Database connected successfully');
}).catch(err => {
  console.error('Database connection error:', err);
});

// API Routes
app.use('/api/products', propertyrouter);
app.use('/api/users', userrouter);
app.use('/api/forms', formrouter);
app.use('/api/news', newsrouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/admin', adminRouter);
app.use('/api', propertyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

// Status check endpoint (JSON)
app.get('/status', (req, res) => {
  res.status(200).json({ status: 'OK', time: new Date().toISOString() });
});

// Root endpoint - health check HTML
app.get("/", (req, res) => {
  const nonce = res.locals.nonce;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BuildEstate API Monitor-Update 5/4/25</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1e3a8a, #60a5fa);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
          }
          .dashboard {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 30px;
            width: 90%;
            max-width: 600px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
          }
          .dashboard:hover {
            transform: translateY(-5px);
          }
          h1 {
            color: #1e40af;
            font-size: 2rem;
            margin: 0 0 20px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .status-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #ecfdf5;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
          }
          .status {
            color: #059669;
            font-weight: 600;
            font-size: 1.2rem;
          }
          .time {
            color: #4b5563;
            font-size: 0.95rem;
          }
          .details {
            font-size: 0.95rem;
            color: #4b5563;
            text-align: center;
            padding: 15px 0;
            border-top: 1px dashed #d1d5db;
          }
          .footer {
            text-align: center;
            font-size: 0.85rem;
            color: #6b7280;
            margin-top: 20px;
          }
          .pulse {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
        </style>
      </head>
      <body>
        <div class="dashboard">
          <h1>BuildEstate API Monitor 5/4/25 6:53</h1>
          <div class="status-box">
            <span class="status pulse">Operational</span>
            <span class="time">${new Date().toLocaleString()}</span>
          </div>
          <div class="details">
            The BuildEstate API powers property listings, user management, and AI-driven insights for the BuildEstate platform.
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} BuildEstate. All rights reserved.
          </div>
        </div>

        <script nonce="${nonce}">
          console.log('BuildEstate API Monitor loaded');
        </script>
      </body>
    </html>
  `);
});

const port = process.env.PORT || 4000;

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;