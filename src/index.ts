import express from 'express';
import docRoutes from './routes/documents.routes';
import userRoutes from './routes/users.routes';

console.log('🔹 index.ts iniciado');

const app = express();

//JSON middleware
app.use(express.json());
// Routes middleware
app.use('/api', docRoutes);

app.use('/users', userRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('✅ Servidor funcionando con Node + TS + Express!');
});

// Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
