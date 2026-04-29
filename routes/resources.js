const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');
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
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload Resource (Rep only)
router.post('/', auth, checkRole('rep'), upload.array('pdf', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send({ error: 'Please upload at least one PDF file' });
        }

        const resources = await Promise.all(req.files.map(async (file) => {
            const resource = new Resource({
                courseName: req.body.courseName,
                fileName: file.originalname,
                filePath: file.path, // Local path: uploads/...
                uploadedBy: req.user.id
            });
            return await resource.save();
        }));

        res.status(201).send(resources);
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(400).send({ error: error.message || 'Upload failed' });
    }
});

// Get all resources
router.get('/', auth, async (req, res) => {
    try {
        const resources = await Resource.find().populate('uploadedBy', 'name').sort({ createdAt: -1 });
        res.send(resources);
    } catch (error) {
        res.status(500).send();
    }
});

// Delete Resource (Rep only)
router.delete('/:id', auth, checkRole('rep'), async (req, res) => {
    try {
        const resource = await Resource.findOne({ _id: req.params.id, uploadedBy: req.user.id });
        if (!resource) {
            return res.status(404).send({ error: 'Resource not found or unauthorized' });
        }

        // Delete physical file
        if (fs.existsSync(resource.filePath)) {
            fs.unlinkSync(resource.filePath);
        }

        await Resource.findByIdAndDelete(req.params.id);
        res.send({ message: 'Resource deleted' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
