const mongoose = require('mongoose');
const {
    Level1,
    Level2,
    Level3,
    Level4
} = require('../../model/booking/prices');

const getLevelModel = (level) => {
    switch (level) {
        case 'level1':
            return Level1;
        case 'level2':
            return Level2;
        case 'level3':
            return Level3;
        case 'level4':
            return Level4;
        default:
            return null;
    }
};

// PUT Prices for each level
const putPrices = async function (req, res) {
    const { level } = req.params;
    const { country, priceCar, motorocycle, priceVan, penfits, compfort } = req.body;

    const LevelModel = getLevelModel(level);
    if (!LevelModel) {
        return res.status(400).json({ message: 'Invalid level specified' });
    }

    try {
        if (!country || !priceCar || !motorocycle || !priceVan) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const sendPrices = new LevelModel({
            country,
            priceCar,
            motorocycle,
            priceVan,
            penfits,
            compfort
        });

        await sendPrices.save();
        return res.status(200).json({ message: 'Prices sent successfully' });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ message: error.message });
    }
};

// PATCH Prices for each level
const patchPrices = async function (req, res) {
    const { level } = req.params;
    const { country, priceCar, motorocycle, priceVan, penfits, compfort } = req.body;

    const LevelModel = getLevelModel(level);
    if (!LevelModel) {
        return res.status(400).json({ message: 'Invalid level specified' });
    }

    try {
        if (!country || !priceCar || !motorocycle || !priceVan) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const updatePrice = await LevelModel.findOneAndUpdate(
            { country: country },
            {
                priceCar: priceCar,
                motorocycle: motorocycle,
                priceVan: priceVan,
                penfits: penfits,
                compfort: compfort
            },
            { new: true }
        );

        // Check if an update was made
        if (!updatePrice) {
            return res.status(404).json({ message: 'No prices were updated' });
        }

        return res.status(200).json({ message: 'Prices updated successfully', updatePrice });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ message: error.message });
    }
};

// GET Prices for each level
const getPrices = async function (req, res) {
    const { level } = req.params;

    const LevelModel = getLevelModel(level);
    if (!LevelModel) {
        return res.status(400).json({ message: 'Invalid level specified' });
    }

    try {
        const pricesData = await LevelModel.find();
        if (!pricesData || pricesData.length === 0) {
            return res.status(404).json({ message: 'No prices found for the specified country' });
        }
        res.status(200).json(pricesData);
    } catch (error) {
        console.log('Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// DELETE Prices for each level based on country
const deletePrice = async function (req, res) {
    const { level } = req.params;
    const { country } = req.body;

    const LevelModel = getLevelModel(level);
    if (!LevelModel) {
        return res.status(400).json({ message: 'Invalid level specified' });
    }

    try {
        if (!country) {
            return res.status(400).json({ message: 'Country is required' });
        }

        const deleteResult = await LevelModel.deleteOne({ country: country });

        // Check if any document was deleted
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ message: 'No prices found for the specified country' });
        }

        return res.status(200).json({ message: 'Price deleted successfully' });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ message: error.message });
    }
};
const getCountry = async function(req, res) {
    const { level, country } = req.params;

    const LevelModel = getLevelModel(level);
    if (!LevelModel) {
        return res.status(400).json({ message: 'Invalid level specified' });
    }

    try {
        const countryData = await LevelModel.find({ country });
        if (!countryData || countryData.length === 0) {
            return res.status(404).json({ message: 'No data found for the specified country' });
        }
        res.status(200).json(countryData);
    } catch (error) {
        console.log('Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    putPrices,
    patchPrices,
    getPrices,
    deletePrice,
    getCountry
};
