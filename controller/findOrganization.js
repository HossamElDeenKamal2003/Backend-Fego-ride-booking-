const organizationModel = require('../model/oragnization and doctors/registerOrganization')
const favModel = require('../model/oragnization and doctors/myFavoriteOrganzations')
const getOrganization = async function (req, res) {
    try {
        const organizations = await organizationModel.find();
        if (!organizations || organizations.length === 0) {
            return res.status(404).json({ message: "No Organization Found" });
        }
        res.status(200).json({ organizations: organizations });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const addFav = async function (req, res) {
    const { userId, organizationId } = req.body;
    try {
        if (!userId || !organizationId) {
            return res.status(400).json({ message: "userId and organizationId are required" });
        }
        const newFav = new favModel({
            userId,
            organizationId
        });
        await newFav.save();
        res.status(200).json({ newFav: newFav });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const myFavoriteOrganizations = async function (req, res) {
    const userId = req.params.id;
    try {
        const favoriteOrganizations = await favModel.find({ userId: userId });
        if (!favoriteOrganizations || favoriteOrganizations.length === 0) {
            return res.status(404).json({ message: "No Organizations Found" });
        }
        res.status(200).json({ favorite: favoriteOrganizations });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

const updateWorkDays = async function(req, res) {
    const { organizationId, workDays } = req.body;

    try {
        // Validate request data
        if (!organizationId || !workDays) {
            return res.status(400).json({ message: "organizationId and workDays are required" });
        }

        // Validate workDays format (optional)
        const isValidDays = workDays.every(dayObj => {
            return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(dayObj.day)
                && dayObj.from && dayObj.to;
        });

        if (!isValidDays) {
            return res.status(400).json({ message: "Invalid workDays format" });
        }

        // Find organization by ID and update workDays
        const updatedOrganization = await organizationModel.findByIdAndUpdate(
            organizationId, 
            { workDays: workDays }, 
            { new: true } // Returns the updated document
        );

        if (!updatedOrganization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Send success response
        res.status(200).json({ message: "Work days updated successfully", organization: updatedOrganization });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    getOrganization,
    addFav,
    myFavoriteOrganizations,
    updateWorkDays
};
