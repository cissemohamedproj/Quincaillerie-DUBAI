import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);
app.use(errorHandler);

export default app;
