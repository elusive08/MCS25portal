const express = require('express');
const News = require('../models/News');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Create News (Rep only)
router.post('/', auth, checkRole('rep'), async (req, res) => {
    try {
        const news = new News({
            ...req.body,
            author: req.user.id
        });
        await news.save();
        res.status(201).send(news);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get all news
router.get('/', auth, async (req, res) => {
    try {
        const news = await News.find().populate('author', 'name').sort({ createdAt: -1 });
        res.send(news);
    } catch (error) {
        res.status(500).send();
    }
});

// Delete News (Rep only)
router.delete('/:id', auth, checkRole('rep'), async (req, res) => {
    try {
        const news = await News.findOneAndDelete({ _id: req.params.id, author: req.user.id });
        if (!news) {
            return res.status(404).send({ error: 'News not found or unauthorized' });
        }
        res.send(news);
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;
