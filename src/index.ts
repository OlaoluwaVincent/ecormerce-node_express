import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import errorHandler from './middlewares/errorHandler';
import routes from './routes';

const app: Application = express();
const PORT = process.env.PORT || 9000;

// Middleware to parse JSON
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://ecommerce-7qaml4wmf-olaoluwa-vincents-projects.vercel.app/',
    ],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Index Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!');
});

// Routes
app.use('/api', routes);

// Error handling middleware (must be defined last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next); // Use the errorHandler middleware
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
