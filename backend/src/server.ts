import { createApp } from './app';
import { createPrismaClient } from './providers/database';

const prisma = createPrismaClient();
const app = createApp(prisma);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
