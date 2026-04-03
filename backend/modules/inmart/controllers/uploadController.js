import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists - correctly relative to project root (or UPLOADS_DIR)
const uploadsRoot = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.join(__dirname, '../../../../uploads');
const uploadsDir = path.join(uploadsRoot, 'inmart');
if (!fs.existsSync(uploadsDir)) {
    console.log('📂 Creating uploads directory at:', uploadsDir);
    fs.mkdirSync(uploadsDir, { recursive: true });
} else {
    console.log('📂 Uploads directory exists at:', uploadsDir);
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'inmart-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Create multer upload instance
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Upload controller
export const uploadImage = async (req, res) => {
    console.log('📤 Image upload request received');
    try {
        if (!req.file) {
            console.warn('⚠️ No file in upload request');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const imageUrl = `/uploads/inmart/${req.file.filename}`;
        console.log('✅ Image uploaded to:', imageUrl);

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: imageUrl,
                filename: req.file.filename
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
        });
    }
};
