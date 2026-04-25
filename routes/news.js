const express = require('express');
const multer = require('multer');
const path = require('path');
const News = require('../models/News');
const { auth, checkRole } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const router = express.Router();

// Cloudinary configuration
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'news_images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 800, height: 600, crop: 'limit' }]
    }
});

const upload = multer({ storage: storage });

// Create News (Rep only)
router.post('/', auth, checkRole('rep'), upload.single('image'), async (req, res) => {
    try {
        const newsData = {
            title: req.body.title,
            content: req.body.content,
            author: req.user.id
        };

        if (req.file) {
            newsData.imageUrl = req.file.path;
            newsData.cloudinaryId = req.file.filename;
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

        // Delete image from Cloudinary if it exists
        if (news.cloudinaryId) {
            await cloudinary.uploader.destroy(news.cloudinaryId);
        }

        await News.findByIdAndDelete(req.params.id);
        res.send(news);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
