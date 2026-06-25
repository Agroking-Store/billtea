import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import companyRoutes from './routes/company';
import usersRoutes from './routes/users';
import branchesRoutes from './routes/branches';
import profileRoutes from './routes/profile';
import { seedDefaultUser } from './seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billaro';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Error handler for body-parser exceptions
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Payload too large. Please upload a smaller file.' });
  }
  next(err);
});

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Billaro Server is running smoothly' });
});

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/profile', profileRoutes);

// Start server and connect DB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');

    // Seed the default admin user
    await seedDefaultUser();

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    // Even if DB connection fails for local tests, let the server listen on port
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT} (Database connection failed)`);
    });
  });
