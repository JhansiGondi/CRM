const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all leads
router.get('/', auth, async (req, res) => {
    const db = req.app.get('db');
    try {
        const leads = await db.all('SELECT * FROM leads ORDER BY created_at DESC');
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single lead
router.get('/:id', auth, async (req, res) => {
    const db = req.app.get('db');
    try {
        const lead = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        res.json(lead);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create lead
router.post('/', auth, async (req, res) => {
    const { name, email, phone, company, status, notes } = req.body;
    const db = req.app.get('db');
    try {
        const result = await db.run(
            'INSERT INTO leads (name, email, phone, company, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, company, status || 'New', notes]
        );
        const newLead = await db.get('SELECT * FROM leads WHERE id = ?', [result.lastID]);
        res.status(201).json(newLead);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update lead
router.put('/:id', auth, async (req, res) => {
    const { name, email, phone, company, status, notes } = req.body;
    const db = req.app.get('db');
    try {
        await db.run(
            'UPDATE leads SET name = ?, email = ?, phone = ?, company = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, email, phone, company, status, notes, req.params.id]
        );
        const updatedLead = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
        res.json(updatedLead);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete lead
router.delete('/:id', auth, async (req, res) => {
    const db = req.app.get('db');
    try {
        await db.run('DELETE FROM leads WHERE id = ?', [req.params.id]);
        res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
