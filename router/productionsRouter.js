// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const upload = multer({ dest: 'uploads/' });
// // Import controller functions
// const {
//     createproduct,
//     addFavourite,
//     myFavourite,
//     getPosts,
//     getSimilarProductsByCategory,
//     filterProducts,
//     patchGlobalProperty,
//     deleteProductFromFavourite,
//     deletePost,
//     addFollow,
//     deleteFollow,
//     updatePrivacy,
//     handleUpload,
//     searchProducts
// } = require('../controller/productions');
//
// router.post('/follow', addFollow);
// router.delete('/follow', deleteFollow);
// router.post('/search/:id', searchProducts);
// // Route to create a product
// router.post('/create',handleUpload, createproduct);
//
// // Route to add product to favourites
// router.post('/favourite', addFavourite);
//
// // Route to get user's favourite products
// router.get('/favourite/:id', myFavourite);
//
// // Route to get posts with favourite status
//
// router.get('/posts/:id', getPosts);
//
// // Route to get similar products based on category
// router.get('/similar/:userId/:id', getSimilarProductsByCategory);
//
// // Route to filter products based on filters and pagination
// router.post('/filter/:id', filterProducts);
//
// // Route to update a global property for all products
// router.patch('/update-global', patchGlobalProperty);
//
// // Route to remove product from user's favourites
// router.delete('/favourite/:userId/:productId', deleteProductFromFavourite);
//
// // Route to delete a product
// router.delete('/delete/:id', deletePost);
// router.patch('/privacy', updatePrivacy);
// module.exports = router;
