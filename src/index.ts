import express from 'express';
import docRoutes from './routes/documents.routes';
import userRoutes from './routes/users.routes';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

//JSON middleware
app.use(express.json());
// Cookie parser middleware
app.use(cookieParser());
// Cors Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
// Document routes
app.use('/api', docRoutes);
// User routes
app.use('/users', userRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Server running with Node + TS + Express!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
