import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// Importing from the root db folder
import { testDatabaseConnection } from '../db'; 

// Import the central router
import routes from './routes';

dotenv.config();

const app = express();
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'], 
}));

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(API_PREFIX, apiLimiter);

// Mount ALL routes through the central router
app.use(API_PREFIX, routes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Test DB connection before starting the local server
testDatabaseConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`FlowMart Server is running on port ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error("Failed to start server due to database connection error:", error);
    process.exit(1);
  });

export default app;
