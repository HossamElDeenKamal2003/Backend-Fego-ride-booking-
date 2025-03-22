const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    format: async (req, file) => {
      // Determine the format dynamically based on the MIME type
      if (file.mimetype === 'image/png') {
        return 'png'; // Allow PNG files
      }
      return 'jpg'; // Default to JPG for other types
    },
    public_id: (req, file) => Date.now() + '-' + file.originalname,
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
