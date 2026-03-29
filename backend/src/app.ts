import express from 'express';
import helloRoutes from '@/modules/hello';

const app = express();

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'UBE HR Backend is running!' });
});

// Routes
app.use('/api', helloRoutes);

export default app;
