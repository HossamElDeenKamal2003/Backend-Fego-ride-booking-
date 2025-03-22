const colorsModel = require('../model/colors');
const handleFileUpload = (files, fieldName) => {
    return files?.[fieldName] ? files[fieldName][0].path : null;
};
const addColor = async(req, res)=>{
    const {color, hexDecimal } = req.body;
    try{
        const carImage = handleFileUpload(req.files, 'carImage');
        const newColor = new colorsModel({
            color,
            hexDecimal,
            carImage
        });
        await newColor.save();
        return res.status(200).json({message: "Added Successfully"});
    }
    catch(error){
        console.log(error);
        return res.status(500).json({message:  error.message});
    }
};

const getColors = async(req, res)=>{
    try{
        const colors = await colorsModel.find();
        return res.status(200).json({colors});
    }   
    catch(error){
        console.log(error);
        return res.status(500).json({message:  error.message});
    }
}

module.exports = {
    addColor,
    getColors
}