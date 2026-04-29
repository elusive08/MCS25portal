const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role: requestedRole } = req.body;
        
        // Determine role based on password if role not explicitly provided or to override
        let role = requestedRole || 'student';
        if (password === 'admin/25/1010') {
            role = 'admin';
        } else if (password === 'rep/25/1010') {
            role = 'rep';
        } else {
            role = 'student';
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'student'
        });

        await user.save();
        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        res.status(201).send({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).send({ error: 'Unable to login' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ error: 'Unable to login' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        res.send({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;
