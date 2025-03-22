const express = require('express');
const router = express.Router();
const upload = require('../middlewares/fiels'); 
const {
    addColor,
    getColors
} = require('../controller/colorsController');

router.post('/add-color', upload.fields([{ name: 'carImage', maxCount: 1 }]), addColor);

router.get('/get-colors', getColors);

module.exports = router;