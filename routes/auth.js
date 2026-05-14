const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, matric, level, role: requestedRole } = req.body;
        
        // Validate required fields
        if (!name || !email || !password || !matric || !level) {
            return res.status(400).send({ error: 'All fields (name, email, password, matric, level) are required.' });
        }

        // Determine role based on password if role not explicitly provided or to override
        let role = requestedRole || 'student';
        if (password === 'admin/25/1010') {
            role = 'admin';
        } else if (password === 'rep/25/1010') {
            role = 'rep';
        } else {
            role = 'student';
        }

        // Check if user already exists by email
        const existingUserEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingUserEmail) {
            return res.status(400).send({ error: 'Email already in use' });
        }

        // Check if matric number already exists
        const existingUserMatric = await User.findOne({ matric: matric.toUpperCase() });
        if (existingUserMatric) {
            return res.status(400).send({ error: 'Matric number already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const user = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            matric: matric.toUpperCase(),
            level,
            role: role || 'student'
        });

        await user.save();
        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        res.status(201).send({ 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                matric: user.matric,
                level: user.level,
                role: user.role 
            }, 
            token 
        });
    } catch (error) {
        res.status(400).send({ error: error.message || 'Signup failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).send({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(400).send({ error: 'Unable to login' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ error: 'Unable to login' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        res.send({ 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                matric: user.matric,
                level: user.level,
                role: user.role 
            }, 
            token 
        });
    } catch (error) {
        res.status(500).send({ error: 'Login failed' });
    }
});

module.exports = router;
