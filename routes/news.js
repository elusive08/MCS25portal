const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const News = require('../models/News');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Multer configuration for local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
        }
    }
});

// Create News (Rep only)
router.post('/', auth, checkRole('rep'), upload.single('image'), async (req, res) => {
    try {
        const newsData = {
            title: req.body.title,
            content: req.body.content,
            author: req.user.id
        };

        if (req.file) {
            newsData.imageUrl = req.file.path; // Local path
        }

        const news = new News(newsData);
        await news.save();
        res.status(201).send(news);
    } catch (error) {
        console.error('News Post Error:', error);
        res.status(400).send({ error: error.message });
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
        const news = await News.findOne({ _id: req.params.id, author: req.user.id });
        if (!news) {
            return res.status(404).send({ error: 'News not found or unauthorized' });
        }

        // Delete image from local storage if it exists
        if (news.imageUrl && fs.existsSync(news.imageUrl)) {
            fs.unlinkSync(news.imageUrl);
        }

        await News.findByIdAndDelete(req.params.id);
        res.send(news);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
