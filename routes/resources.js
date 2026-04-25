const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');
const { auth, checkRole } = require('../middleware/auth');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const router = express.Router();

// Validate Cloudinary configuration
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
} else {
    console.warn('WARNING: Cloudinary is not fully configured. File uploads will fail.');
}

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'resources',
            format: 'pdf', // Force format to pdf
            resource_type: 'raw', // Required for PDFs to be handled as raw files
            public_id: path.parse(file.originalname).name + '-' + Date.now()
        };
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload Resource (Rep only)
router.post('/', auth, checkRole('rep'), upload.array('pdf', 10), async (req, res) => {
    try {
        if (!isCloudinaryConfigured) {
            throw new Error('Cloudinary is not configured on the server');
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).send({ error: 'Please upload at least one PDF file' });
        }

        const resources = await Promise.all(req.files.map(async (file) => {
            const resource = new Resource({
                courseName: req.body.courseName,
                fileName: file.originalname,
                filePath: file.path, // Cloudinary URL
                cloudinaryId: file.filename, // Cloudinary Public ID
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

        // Delete from Cloudinary
        if (resource.cloudinaryId) {
            await cloudinary.uploader.destroy(resource.cloudinaryId, { resource_type: 'raw' });
        }

        await Resource.findByIdAndDelete(req.params.id);
        res.send({ message: 'Resource deleted' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
