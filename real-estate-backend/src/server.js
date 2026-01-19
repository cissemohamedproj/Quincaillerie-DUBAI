import mongoose from 'mongoose';
import app from './app.js';

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT || 5000, () =>
    console.log('Server running')
  );
});
