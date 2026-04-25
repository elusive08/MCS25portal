const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
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
    }
});

// Upload Resource (Rep only)
router.post('/', auth, checkRole('rep'), upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ error: 'Please upload a PDF file' });
        }

        const resource = new Resource({
            courseName: req.body.courseName,
            fileName: req.file.originalname,
            filePath: req.file.path,
            uploadedBy: req.user.id
        });

        await resource.save();
        res.status(201).send(resource);
    } catch (error) {
        res.status(400).send({ error: error.message });
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
        const filePath = path.resolve(__dirname, '..', resource.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Resource.findByIdAndDelete(req.params.id);
        res.send({ message: 'Resource deleted' });
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;
