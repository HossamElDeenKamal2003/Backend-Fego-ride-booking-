const User = require('../models/users');
const favouriteModel = require('../models/favouriteModel');
const Post = require('../models/productions/production');
const followModel = require('../models/follow');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const messages = require('../models/messages');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('../middlewares/cloudinaryConfig');
const upload = require('../middlewares/files');
const handleUpload = (req, res, next) => {
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      return res.status(500).json({
        message: 'Error uploading file',
        error: err.message
      });
    }
    next();
  });
};
const handleSingleUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
          return res.status(400).json({
              message: 'File upload error',
              error: err.message
          });
      } else if (err) {
          return res.status(500).json({
              message: 'Error uploading file',
              error: err.message
          });
      }
      next();
  });
};


// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, phoneNumber, userFCMToken } = req.body;

    // Validate required fields
    if (!username || !email || !password || !phoneNumber) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: ['username', 'email', 'password', 'phoneNumber'].filter(field => !req.body[field])
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or username'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle file uploads for profileImage and coverImage
    const profileImage = req.files?.profileImage ? req.files.profileImage[0].location : '';
    const coverImage = req.files?.coverImage ? req.files.coverImage[0].location : '';

    // Create user object
    const userData = {
      username,
      email,
      profileImage,
      coverImage,
      phoneNumber,
      userFCMToken: userFCMToken || "",
      password: hashedPassword,
    };

    // Create and save user
    const user = new User(userData);
    await user.save();

    // Return success response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
};


// Update profile image
const updateProfileImage = async (req, res) => {
  const {userId} = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image file provided'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    user.profileImage = req.file.location;
    await user.save();

    return res.status(200).json({
      message: 'Profile image updated successfully',
      profileImage: user.profileImage
    });

  } catch (error) {
    console.error('Profile image update error:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// Update cover image
const updateCoverImage = async (req, res) => {
  const {userId} = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image file provided'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    user.coverImage = req.file.location;
    await user.save();

    return res.status(200).json({
      message: 'Cover image updated successfully',
      coverImage: user.coverImage
    });

  } catch (error) {
    console.error('Cover image update error:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
};


// Utility function to upload image to Cloudinary
// Controller to update profile image
// const updateProfileImage = [
//     upload.single('profileImage'), // Use multer to handle single image upload
//     async (req, res) => {
//         try {
//             const { userId } = req.body;

//             if (!userId || !req.file) {
//                 return res.status(400).json({ message: 'Please provide both userId and profile image' });
//             }

//             // Upload image to Cloudinary
//             const imageUrl = await uploadImageToCloudinary(req.file.path, 'users/profileImages');

//             // Delete the file from the temporary uploads directory
//             fs.unlinkSync(req.file.path);

//             // Update the user's profile image in the database
//             const updatedUser = await User.findByIdAndUpdate(
//                 userId,
//                 { profileImage: imageUrl },
//                 { new: true }
//             );

//             if (!updatedUser) {
//                 return res.status(404).json({ message: 'User not found' });
//             }

//             res.status(200).json({
//                 message: 'Profile image updated successfully',
//                 profileImage: imageUrl,
//             });
//         } catch (err) {
//             console.error('Error updating profile image:', err);
//             res.status(500).json({ message: 'Failed to update profile image' });
//         }
//     },
// ];

// // Controller to update cover image
// const updateCoverImage = [
//     upload.single('coverImage'), 
//     async (req, res) => {
//         try {
//             const { userId } = req.body;

//             if (!userId || !req.file) {
//                 return res.status(400).json({ message: 'Please provide both userId and cover image' });
//             }

//             // Upload image to Cloudinary
//             const imageUrl = await uploadImageToCloudinary(req.file.path, 'users/coverImages');

//             // Delete the file from the temporary uploads directory
//             fs.unlinkSync(req.file.path);

//             // Update the user's cover image in the database
//             const updatedUser = await User.findByIdAndUpdate(
//                 userId,
//                 { coverImage: imageUrl },
//                 { new: true }
//             );

//             if (!updatedUser) {
//                 return res.status(404).json({ message: 'User not found' });
//             }

//             res.status(200).json({
//                 message: 'Cover image updated successfully',
//                 coverImage: imageUrl,
//             });
//         } catch (err) {
//             console.error('Error updating cover image:', err);
//             res.status(500).json({ message: 'Failed to update cover image' });
//         }
//     },
// ];


const updateToken = async function (req, res) {
  const id = req.params.id;
  const { userFCMToken } = req.body;

  if (!id || !userFCMToken) {
      return res.status(400).json({ message: "Invalid ID or Token" });
  }

  try {
      const updatedUser = await User.findOneAndUpdate(
          { _id: id },
          { userFCMToken },
          { new: true }
      );

      if (!updatedUser) {
          return res.status(400).json({ message: "Failed to update userFCMToken" });
      }

      res.status(200).json({ 
          message: "Token updated successfully", 
          updatedToken: updatedUser.userFCMToken 
      });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  const { email, password, phoneNumber } = req.body;

  if ((!email && !phoneNumber) || !password) {
      return res.status(400).json({ message: 'Email or phone number and password are required' });
  }
  try {
      const user = await User.findOne({ $or: [{ email }, { phoneNumber }] });
      if (!user) {
          return res.status(401).json({ message: 'User not found' });
      }

      // if(user.block === true){
          const valid = bcrypt.compareSync(password, user.password);
          if (!valid) {
              return res.status(401).json({ message: 'Incorrect password' });
          }

          //const token = jwt.sign({ id: user._id, username: user.username }, "5739dc5e96c68d2200d196390a0dc53e73013a4ecc6fb144ff1368e570c0126d4afda02965f5d67975f2a01dc1bd9abb77a5284f230468a5ea24155aee8ae1d4", { expiresIn: '1h' });

          const userData = {
              id: user._id,
              username: user.username,
              email: user.email,
              profileImage: user.profileImage,
              coverImage: user.coverImage,
              phoneNumber: user.phoneNumber
          };

          return res.status(200).json({ message: 'Login successful', user: userData });

  } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateEmail = async function(req, res){
  const { id, email } = req.body;
  try{
      const result = await User.findByIdAndUpdate(
          { _id: id },
          { email: email},
          { new: true}
      );
      if(!result){
          res.status(404).json({ message: "Failed to update user email" });
      }
      res.status(200).json({ message: result });
  }
  catch(error){
      console.log(error);
      res.status(500).json({ message: error.message });
  }
}

const updatePhoneNumber = async function(req, res){
  const { id, phoneNumber } = req.body;
  try{
      const result = await User.findByIdAndUpdate(
          { _id: id },
          { phoneNumber: phoneNumber },
          { new: true }
      )
      if(!result){
          res.status(404).json({ message: "Failed to update user phone number" });
      }
      res.status(200).json({ message: result });
  }
  catch(error){
      console.log(error);
      res.status(500).json({ message: error.message });
  }
}


const updatePassword = async (req, res) => {
  const { id, oldPassword, newPassword } = req.body;

  // Validate required fields
  if (!id || !oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare old password with stored hash
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password' });
    }

    // Hash new password using bcrypt
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserById = async function(req, res){
  const id = req.params.id;
  try{
      const user = await User.findOne({ _id: id });
      const postsFavourite = await favouriteModel.find({userId: id});
      const userPosts = await Post.find({userId: id});
      if(!user){
          return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ User: user, favourite: postsFavourite, posts: userPosts });
  }
  catch(error){
      console.log(error);
      res.status(500).json({ Error: error.message });
  }
};

const updateUsername = async function(req, res){
  const { userId, newName } = req.body;
  try{
      const updateUsername = await User.findByIdAndUpdate(
          { _id: userId },
          { username: newName },
          { new: true }
      );
      if(!updateUsername){
          return res.status(400).json({ message: "Failed to update username" });
      }
      res.status(200).json({ message: updateUsername });
  }
  catch(error){
      console.log(error);
      res.status(500).json({ message: error.message }); 
  }
};

const deletUser = async function(req, res){
  const userId = req.params.id;
  try{
      const deletedUser = await User.findOneAndDelete({ _id: userId });
      if(!deletedUser){
          res.status(400).json({message: "Error while delete user"});
      }
      res.status(200).json({message: "User Deleted Successfully", user: deletUser});
  }
  catch(error){
      console.log(error.message);
      res.status(500).json({ message: error.message });
  }
}

const addFollow = async function(req, res) {
  const { userId, postId } = req.body;

  try {
      // Create a new follow document
      const newFollow = new followModel({
          userId,
          postId,
      });

      // Save the document to the database
      await newFollow.save();

      return res.status(201).json({ message: 'Follow added successfully', data: newFollow });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
  }
};

const getFollow = async function (req, res) {
  const userId = req.params.id;

  try {
      // Find all follow documents for the given userId
      const followPosts = await followModel.find({ userId: userId });

      if (!followPosts.length) {
          return res.status(200).json({
              message: "No followed posts found",
              postsFollowed: [],
          });
      }

      // Extract all postId values and ensure they are ObjectIds
      const postIds = followPosts.map(follow => new mongoose.Types.ObjectId(follow.postId));

      // Fetch post data for the corresponding postIds
      const posts = await Post.find({ _id: { $in: postIds } });

      res.status(200).json({
          message: "Followed posts fetched successfully",
          postsFollowed: posts
      });
  } catch (error) {
      console.error("Error fetching followed posts:", error);
      return res.status(500).json({ message: error.message });
  }
};

const deleteFollow = async function(req, res){
  const {userId,postId} = req.body;
  try{
      const deletedPost = await followModel.findOneAndDelete({userId: userId, postId:postId});
      if(!deletedPost){
          return res.status(400).json({message: 'cannot delete post from followed post'});
      }
      res.status(200).json({message: "Post deleted successfully from follow model", deletedPost: deletedPost});
  }
  catch(error){
      console.log(error);
      res.status(500).json({message: error.message});
  }
}
const addCoupon = async (req, res) => {
  const { id, coupon } = req.body;

  // Validate input
  if (!id || !coupon) {
      return res.status(400).json({ message: "User ID and coupon are required" });
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid User ID format" });
  }

  try {
      const user = await User.findOne({ _id: id });

      // Check if user exists
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      // Ensure `coupons` field is an array before pushing
      if (!Array.isArray(user.coupons)) {
          user.coupons = [];
      }

      user.coupons.push(coupon);
      await user.save();

      return res.status(200).json({ message: "Coupon Added Successfully" });
  } catch (error) {
      console.error("Error adding coupon:", error);
      return res.status(500).json({ message: "Internal Server Error" });
  }
};
module.exports = {
  register,
  login,
  updateEmail,
  updatePhoneNumber,
  updatePassword,
  getUserById,
  updateUsername,
  deletUser,
  updateToken,
  addFollow,
  getFollow,
  deleteFollow,
  updateCoverImage,
  updateProfileImage,
  handleUpload,
  updateCoverImage,
  updateProfileImage,
  handleSingleUpload,
  addCoupon
};
