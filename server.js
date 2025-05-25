const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const photoRoutes = require('./routes/photos');
const adminRoutes = require('./routes/admin');
const { verifyToken } = require('./middlewares/auth');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/photoeditor', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use('/api/auth', authRoutes);
app.use('/api/photos', verifyToken, photoRoutes);
app.use('/api/admin', adminRoutes);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});