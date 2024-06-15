import express, { Request, Response, NextFunction, Application } from 'express';
import errorHandler from './middlewares/errorHandler';
import config from './utils/config';
import routes from './routes';
import excludedRoutes from './middlewares/excludedRoutes';

const app: Application = express();
const PORT = process.env.PORT || 9000;

// Connect to DB
config.connect();

// Middleware to parse JSON
app.use(express.json());

// Index Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!');
});

// Global routes
app.use(excludedRoutes);

// Routes
app.use('/api', routes);

// Error handling middleware (must be defined last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next); // Use the errorHandler middleware
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
