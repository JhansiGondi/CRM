require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { setupDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function startServer() {
    try {
        const db = await setupDatabase();
        app.set('db', db);

        app.use('/api/auth', authRoutes);
        app.use('/api/leads', leadRoutes);

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();
