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
import fetch from 'node-fetch';

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
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https://*.tile.openstreetmap.org https://unpkg.com; connect-src 'self' https://nominatim.openstreetmap.org https://api.ipify.org; object-src 'none'; upgrade-insecure-requests`
  );
  next();
});

app.use(compression());

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(trackAPIStats);

// CORS Configuration
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

// Root endpoint - health check HTML with geolocation, IP, and map
app.get("/", async (req, res) => {
  const nonce = res.locals.nonce;

  // Fetch client IP address server-side
  let ipAddress = 'Unknown';
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    ipAddress = ipData.ip;
  } catch (error) {
    console.error('Failed to fetch IP address:', error);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BuildEstate API Monitor</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
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
          .location, .ip-box {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            color: #1f2937;
          }
          .location span, .ip-box span {
            font-weight: 500;
            color: #3b82f6;
          }
          #map {
            height: 200px;
            border-radius: 8px;
            margin-top: 10px;
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
          .error {
            color: #dc2626;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="dashboard">
          <h1>BuildEstate API Monitor</h1>
          <div class="status-box">
            <span class="status pulse">Operational</span>
            <span class="time">${new Date().toLocaleString()}</span>
          </div>
          <div class="ip-box">
            <p>IP Address: <span id="ip">${ipAddress}</span></p>
          </div>
          <div class="location" id="location">
            <p>Coordinates: <span id="coords">Fetching...</span></p>
            <p>Area: <span id="area">Loading...</span></p>
            <div id="map"></div>
          </div>
          <div class="details">
            The BuildEstate API powers property listings, user management, and AI-driven insights for the BuildEstate platform.
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} BuildEstate. All rights reserved.
          </div>
        </div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" nonce="${nonce}"></script>
        <script nonce="${nonce}">
          const coordsElement = document.getElementById('coords');
          const areaElement = document.getElementById('area');
          const locationElement = document.getElementById('location');
          let mapInitialized = false;
          let map;
          let marker;

          function updateLocation(coords, area, lat, lon, buildingName) {
            coordsElement.textContent = coords;
            areaElement.textContent = area;
            if (lat && lon && !mapInitialized) {
              map = L.map('map').setView([lat, lon], 13);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }).addTo(map);
              marker = L.marker([lat, lon]).addTo(map);
              marker.bindPopup(buildingName ? \`<b>\${buildingName}</b><br>Your Location\` : 'Your Location').openPopup();
              mapInitialized = true;
            } else if (buildingName && marker) {
              marker.setPopupContent(buildingName ? \`<b>\${buildingName}</b><br>Your Location\` : 'Your Location').openPopup();
            }
          }

          if (navigator.geolocation) {
            console.log('Geolocation is supported, requesting position...');
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords;
                const coords = \`\${latitude.toFixed(4)}, \${longitude.toFixed(4)}\`;
                console.log('Position obtained:', coords);
                updateLocation(coords, 'Fetching area...', latitude, longitude);

                try {
                  const response = await fetch(
                    \`https://nominatim.openstreetmap.org/reverse?lat=\${latitude}&lon=\${longitude}&format=json\`,
                    { headers: { 'User-Agent': 'BuildEstate-API-Monitor' } }
                  );
                  if (!response.ok) throw new Error('Geocoding API failed: ' + response.status);
                  const data = await response.json();
                  console.log('Geocoding response:', data);
                  const area = \`\${data.address.city || data.address.town || data.address.village || ''}, \${data.address.state || ''}\`.trim();
                  const buildingName = data.address.building || data.address.house_number || data.address.road || '';
                  updateLocation(coords, area || 'Unknown area', null, null, buildingName);
                } catch (error) {
                  console.error('Geocoding error:', error);
                  updateLocation(coords, 'Unable to fetch area');
                  areaElement.classList.add('error');
                }
              },
              (error) => {
                console.error('Geolocation error:', error.message);
                let errorMessage = 'Location unavailable';
                switch (error.code) {
                  case error.PERMISSION_DENIED:
                    errorMessage = 'Permission denied by user';
                    break;
                  case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Position unavailable';
                    break;
                  case error.TIMEOUT:
                    errorMessage = 'Request timed out';
                    break;
                  default:
                    errorMessage = 'Unknown error';
                }
                locationElement.innerHTML = \`<p class="error">\${errorMessage}</p>\`;
              },
              { timeout: 10000, maximumAge: 60000 }
            );
          } else {
            console.error('Geolocation not supported by this browser');
            locationElement.innerHTML = '<p class="error">Geolocation not supported</p>';
          }
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