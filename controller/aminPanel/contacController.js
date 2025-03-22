const contactModel = require('../../model/contactUs');

const addContact = async function (req, res) {
  const { username, phoneNumber, whatsApp, question } = req.body;

  if (!username || !phoneNumber || !question) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const newContact = new contactModel({
      username,
      phoneNumber,
      whatsApp,
      question,
      file: req.file ? req.file.path : null, // Save file path if uploaded
    });
    await newContact.save();
    res.status(200).json({ contact: newContact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save contact. Please try again." });
  }
};


const getContact = async function(req, res){
    try{
        const contacts = await contactModel.find();
        if(contacts.length === 0){
            res.status(200).json({ message: "No Conatcts Yet" });
        }
        res.status(200).json({ Contacts: contacts });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const deleteContact = async (req, res) => {
    const { id } = req.params; // Get the ID from the URL parameters

    try {
        // Find and delete the contact by its ID
        const deletedContact = await contactModel.findOneAndDelete({ _id: id });

        // Check if the contact was found and deleted
        if (!deletedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        res.status(200).json({ message: 'Contact deleted successfully', deletedContact });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports ={
    addContact,
    getContact,
    deleteContact
}
