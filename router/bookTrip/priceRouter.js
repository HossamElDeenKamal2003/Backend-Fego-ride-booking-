const express = require('express');
const router = express.Router();
const {
    putPrices,
    patchPrices,
    getPrices,
    deletePrice,
    getCountry
} = require('../../controller/booking/prices');

// POST: Add prices for a specific level (e.g., level1, level2, level3, level4)
router.post('/:level/putprices', putPrices);

// PATCH: Update prices for a specific level (e.g., level1, level2, level3, level4)
router.patch('/:level/updateprices', patchPrices);

// GET: Get prices for a specific level and country (e.g., level1, level2, level3, level4)
router.get('/:level/getprices', getPrices);
router.post('/delete/:level', deletePrice);
router.get('/:level/country/:country', getCountry);

module.exports = router;
