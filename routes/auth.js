const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = req.app.get('db');

    try {
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const db = req.app.get('db');

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check for active session (heartbeat within last 45 seconds)
        const now = new Date();
        if (user.last_seen && user.current_session_id) {
            const lastSeen = new Date(user.last_seen);
            const diffSeconds = (now - lastSeen) / 1000;

            if (diffSeconds < 45) {
                return res.status(403).json({
                    message: 'Access Denied: Account already in use',
                    code: 'SESSION_ACTIVE'
                });
            }
        }

        const sessionId = Math.random().toString(36).substring(2, 15);
        const token = jwt.sign({ id: user.id, sessionId }, JWT_SECRET, { expiresIn: '8h' });

        // Update session info
        await db.run(
            'UPDATE users SET current_session_id = ?, last_seen = ? WHERE id = ?',
            [sessionId, now.toISOString(), user.id]
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, sessionId } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/heartbeat', auth, async (req, res) => {
    const db = req.app.get('db');
    const { sessionId } = req.user;

    try {
        const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

        // If the session ID doesn't match, somebody else logged in
        if (user.current_session_id !== sessionId) {
            return res.status(401).json({ message: 'Session expired', code: 'SESSION_REPLACED' });
        }

        await db.run('UPDATE users SET last_seen = ? WHERE id = ?', [new Date().toISOString(), req.user.id]);
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ message: 'Heartbeat failed' });
    }
});

router.post('/logout', auth, async (req, res) => {
    const db = req.app.get('db');
    try {
        await db.run('UPDATE users SET current_session_id = NULL, last_seen = NULL WHERE id = ?', [req.user.id]);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Logout failed' });
    }
});

module.exports = router;
