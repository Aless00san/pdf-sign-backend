import express from 'express';
import docRoutes from './routes/documents.routes';
import userRoutes from './routes/users.routes';

const app = express();

//JSON middleware
app.use(express.json());

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
