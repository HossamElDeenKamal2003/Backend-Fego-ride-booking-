const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const socketHandler = require('./controller/booking/offerWebsocket');
const offerController = require('./controller/booking/offers')
const tripSocketHandler = require('./controller/booking/allTripswebSocket');
const chatHandler = require('./controller/booking/chating/newChatHandler');
const { driverDataHandler } = require('./controller/booking/statusTripSockets/acceotTripSockets');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
dotenv.config();
console.log(process.env.NODE_ENV);
const app = express();
const server = http.createServer(app);
// const io = new Server(server);
const io = new Server(server, {
  cors: {
      origin: "*", // TODO: Replace "*" with your client origin(s) for better security
      methods: ["GET", "POST"],
  },
});
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(morgan("combined"));
app.use(express.urlencoded({ extended: true }));
const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
},
  authStrategy: new LocalAuth()  // Use LocalAuth for session management
});

// Generate and Display QR Code for first-time authentication or re-login
client.on('qr', (qr) => {
  console.log('Scan this QR code:');
  qrcode.generate(qr, { small: true });  // Display the QR code in the terminal
});

// When the WhatsApp client is ready (after scanning the QR code)
client.on('ready', () => {
  console.log('Client is ready!');
});
client.initialize();
module.exports = client;

//connected to MONGODB
mongoose.connect(process.env.DB_URL) 
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1); // Exit process with failure code
    });

// Ensure the directory exists before setting up multer storage
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for local file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage: storage });

// Import routes
const user = require("./router/userRouter/userRouter");
const driver = require("./router/userRouter/driverRouter");
const book = require("./router/bookTrip/bookingRouting");
const userProfile = require("./router/userProfile/patchUser");
const driverProfile = require("./router/userProfile/patchDriver");
const prices = require("./router/bookTrip/priceRouter");
const createChat = require("./router/chatingRouter/createChat");
const admin = require('./router/admin/adminRouters');
const colors = require('./router/colorsRouter');
const payments = require('./router/payments/payments');
const disc = require('./router/discountRouter');
// Middleware for static files
app.use("/uploads", express.static(uploadDir));
app.use("/auth", user);
app.use("/", disc);
app.use("/authdriver", driver);
app.use("/book", book);
app.use("/user-profile", userProfile);
app.use("/driverprofile", driverProfile);
app.use("/prices", prices);
app.use("/create", createChat);
app.use("/admin", admin);
app.use('/colors', colors);
app.use('/', payments);
// Track user searches
const userSearches = new Map(); // Map<socketId, searchCriteria>

const locationHandler = require('./controller/booking/driverDest'); // Adjust the path as necessary
const costHandler = require('./controller/booking/costUpdate');
const handleSocketConnection = require('./controller/booking/tripsPending');
offerController.setSocketInstance(io);

// Initialize WebSocket handler
// socketHandler(io);
socketHandler(io);
tripSocketHandler(io);
costHandler(io);
//driverSocketHandler(io); // Driver-specific WebSocket handler
chatHandler(io);
//tripStatusHandler(io);
driverDataHandler(io);
locationHandler(io) // Attaches the socket instance to the HTTP server
handleSocketConnection(io);
//updateLocation(io);

global.io = io;
//const io = new Server(server);
const patchStatus = async (id, type, status) => {
  try {
      if (type === 'driver') {
          const driver = await Driver.findById(id);
          if (!driver) {
              console.error('Driver not found');
              return;
          }
          driver.status = status;
          await driver.save();
      } else if (type === 'user') {
          const user = await User.findById(id);
          if (!user) {
              console.error('User not found');
              return;
          }
          user.status = status;
          await user.save();
      }
  } catch (error) {
      console.error('Error updating status:', error);
  }
};

const connectedUsers = {};

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Listen for the client to send their id and type
  socket.on('register', ({ id, type }) => {
      console.log(`Registered ${type} with id: ${id}`);
      connectedUsers[socket.id] = { id, type };

      // Update status to "online" when the user/driver connects
      patchStatus(id, type, 'online');
  });

  // When a user disconnects
  socket.on('disconnect', () => {
      const user = connectedUsers[socket.id];
      if (user) {
          const { id, type } = user;
          console.log(`Disconnected ${type} with id: ${id}`);

          // Update status to "offline" when the user/driver disconnects
          patchStatus(id, type, 'offline');

          // Remove the user from the connectedUsers object
          delete connectedUsers[socket.id];
      }
  });
});

module.exports = { connectedUsers, io };
app.get("/", (req, res) => {
    res.send("Express");
});

app.get('/payment-result-success', (req, res) => {
  return res.status(200).json({message: "Successfull Payment"})
});
const axios = require('axios');
// const XPAY_API_KEY = process.env.API_KEY;
// const XPAY_API_URL = process.env.XPAY_BASE_URL;
app.use(express.json());

app.post('/create-payment-link', async (req, res) => {
  const { amount, currency, customerEmail, customerPhone, orderId, description, dueDate } = req.body;

  const paymentData = {
    amount, // Amount in the smallest currency unit (e.g., cents)
    currency: currency || 'EGP', // Default to EGP if not provided
    receiptId: orderId,
    customerDetails: {
      name: "John Doe", // Replace with dynamic data if available
      email: customerEmail,
      contactNumber: customerPhone,
      customerAddress: {
        addressLine1: "123 Main St",
        addressLine2: "Apt 101",
        city: "Los Angeles",
        state: "California",
        country: "United States",
        postalCode: "123456"
      }
    },
    description: description || "Order for 2 items",
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default to 7 days later
  };

  const apiKey = "Zg29B4qO.8CxuKTUStfCD80AMmsDVrVyZRktaR98q";
  const encodedAuth = Buffer.from(`${apiKey}:`).toString('base64');

  const options = {
    method: 'POST',
    url: 'https://api.xpaycheckout.com/link/merchant/generate-link',
    headers: {
      'Authorization': 'Zg29B4qO.8CxuKTUStfCD80AMmsDVrVyZRktaR98q',
    },
    data: paymentData
  };

  try {
    const response = await axios(options);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating payment link:', error.response ? {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    } : error.message);

    res.status(500).json({ error: error.message });
  }
});

// Start the server

// Endpoint to create a payment
app.post('/create', async (req, res) => {
    const { amount, currency, description, customerId } = req.body;

    try {
        const response = await axios.post(
            `https://api.xpaycheckout.com/link/merchant/generate-link`,
            {
                amount,
                currency,
                description,
                customer_id: customerId
            },
            {
                headers: {
                    Authorization: `Bearer ${XPAY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error creating payment:', error.response?.data || error.message);
        res.status(500).json({ error: 'Payment creation failed', message: error.message });
    }
}); 


app.get('/payment-result-fail', (req, res)=>{
  return res.status(200).json({message: "Fail Payment"})
})

app.get('/home', (req, res)=>{
    
});

app.get('/privacy-policy', (req, res) => {
    res.render(path.join(__dirname, 'views', 'index.ejs'));
  });

let amount = 0;
let email = '';
const updateWallet = async function(customerEmail, amount){
  try {
    // Find the driver by their email
    const driver = await Driver.findOne({ email: customerEmail });
    
    // If the driver is not found, return a 404 response
    if (!driver) {
        console.log('Driver not found');
        return { message: 'Driver not found' };
    }

    // Update the driver's wallet and the time of the update
    driver.wallet = (driver.wallet || 0) + parseFloat(amount); // Ensure amount is added correctly
    driver.updateWallettime = new Date();

    // Save the updated driver object to the database
    await driver.save();

    // Log the successful wallet update
    console.log('✅ Driver wallet updated successfully:', {
      wallet: driver.wallet,
      updateWallettime: driver.updateWallettime
    });

    // Return a success message
    return {
      message: 'Driver wallet updated successfully',
      wallet: driver.wallet,
      updateWallettime: driver.updateWallettime
    };
  } catch (error) {
    // Log any error that occurs
    console.error('Error updating wallet:', error);
    return { message: 'Error updating wallet', error: error.message };
  }
};
app.use(express.json()); // Ensure JSON body parsing middleware is included
// In-memory storage for payment details (amount, customerEmail, etc.)
const paymentDetails = {};
app.get('/res', async(req, res)=>{
  axios({
    method: "get",
    url:
      "https://staging.xpay.app/api/v1/communities/639/transactions/cfab6941-f80e-4edc-af91-c8cd75eaebbd",
    headers: {
      "x-api-key": "fVmOK4Y6.gHjL48wKy47MoIUwIBGCht8M8kSg7QCP",
    },
  })
    .then((response) => {
      console.log(response.data.data);
    })
    .catch((e) => {
      console.log(e.response.data.status);
    });
})

app.post('/payment-result', async (req, res) => {
  console.log('Payment result data:', req.body);

  try {
    const { respStatus, cartId, customerEmail } = req.body;

    console.log("Customer details:", customerEmail);

    if (respStatus === 'A') { // 'A' indicates approved payment
      console.log('✅ Payment approved');

      // Retrieve the payment information using the cartId
      const paymentInfo = paymentDetails[cartId]; // Use cartId as the key
      console.log('Payment information:', paymentInfo);
      if (!paymentInfo) {
        return res.status(400).json({ message: 'Payment information not found for the cartId' });
      }

      const amount = paymentInfo.amount;
      let driver = "";
      console.log('Payment amount:', amount);
      console.log('type : ', paymentInfo.type)
      if(paymentInfo.type === 'user'){
        driver = await User.findOne({ email: customerEmail });
        driver.wallet = (driver.wallet || 0) + parseFloat(amount); // Ensure amount is added correctly
        driver.updateWallettime = new Date();
        await driver.save();
        delete paymentDetails[cartId];
        return res.redirect('/payment-result-success');

      }
      
      driver = await Driver.findOne({email: customerEmail});
      // Update the driver's wallet with the payment amount
      driver.wallet = (driver.wallet || 0) + parseFloat(amount); // Ensure amount is added correctly
      driver.updateWallettime = new Date();

      await driver.save();
      
      console.log('✅ Driver wallet updated successfully:', { wallet: driver.wallet, updateWallettime: driver.updateWallettime });
      delete paymentDetails[cartId]; 
      return res.redirect('/payment-result-success');
    } else if (respStatus === 'D') {
      console.warn('⚠️ Payment declined');
      return res.redirect('/payment-result-fail');
    } else if (respStatus === 'V') {
      console.warn('⚠️ Payment voided');
      return res.redirect('/payment-result-fail');
    } else {
      console.warn('⚠️ Unknown payment status');
      return res.redirect('/payment-result-fail');
    }
  } catch (error) {
    console.error('❌ Error verifying payment result:', error);
    return res.status(500).json({ message: 'An error occurred while processing payment result', error: error.message });
  }
});

const ChatModel = require('./model/chatSupport');
const User = require('./model/regestration/userModel');
const Driver = require('./model/regestration/driverModel');
const AuthAdmin = require('./model/regestration/authAdmin');
const support = require('./model/regestration/support');
const sendNotification = require('./firebase');
const notifications = require('./model/notification');
// Middleware to get all chats (active or ended) with messages and user data
const getAllChatsWithMessagesAndUserData = async (req, res, next) => {
  try {
    // Retrieve all chats (both active and ended)
    const chats = await ChatModel.find().lean();

    // Attach user data and messages to each chat
    const chatWithUserData = await Promise.all(
      chats.map(async (chat) => {
        const user = await User.findById(chat.userId).lean();
        return {
          ...chat,
          user,
        };
      })
    );

    // Attach the resulting data to the request object
    req.allChatsWithUserData = chatWithUserData;

    // Continue to the next middleware or route
    next();
  } catch (error) {
    console.error('Error fetching all chats with user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
app.get('/getAllChats', getAllChatsWithMessagesAndUserData, (req, res) => {
  // Send the data attached by the middleware
  res.status(200).json({ chats: req.allChatsWithUserData });
});
const getChatsWithUserData = async (req, res, next) => {
  try {
    // Retrieve the first active chat (not an array, but a single chat)
    const chat = await ChatModel.findOne({ status: 'active' }).lean();

    if (!chat) {
      return res.status(404).json({ message: 'No active chats found.' });
    }
    const activeChatsCount = await ChatModel.countDocuments({ status: 'active' });

    // Fetch the user data for the single chat
    const user = await User.findById(chat.userId).lean();

    // Attach the chat and user data to the request object
    req.chatWithUserData = { ...chat, user };
    req.activeChatsCount = activeChatsCount;
    // Continue to the next middleware or route
    next();
  } catch (error) {
    console.error('Error fetching the chat with user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

app.get('/getChats', getChatsWithUserData, (req, res) => {
  // Send the data attached by the middleware
  res.status(200).json({ chats: req.chatWithUserData, activeChatsCount: req.activeChatsCount });
});

const data = require('./middlewares/fiels');
const supportModel = require("./model/regestration/support");
app.post('/sendMessage', data.array('media', 5), async (req, res) => {
  try {
    const { chatId, userId, sender, message } = req.body;
    const mediaFiles = req.files; // Uploaded files from the request

    // Find the chat session by ID
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found.' });
    }

    if (chat.status !== 'active') {
      return res.status(400).json({ message: 'Chat session is not active.' });
    }

    // Add the new message with optional media
    const newMessage = {
      userId,
      sender,
      message: message || '', // If message is not provided, use an empty string
      timestamp: new Date(),
      media: mediaFiles && mediaFiles.length > 0 ? mediaFiles.map((file) => ({
        url: file.path, // Cloudinary URL
        type: file.mimetype.split('/')[0], // e.g., 'image', 'video'
      })) : [], // If no media, return an empty array
    };

    chat.messages.push(newMessage);
    if (global.io) {
      io.emit(`newMessage/${chatId}`, { message: newMessage });
    }
    res.status(200).json({ message: newMessage });
    // Save the updated chat
    await chat.save();
    let token = null;
    let user = null;
    const notificationMessage = { title: 'New Message', body: message, route: "/supportScreen" };
  if(sender === 'user'){
    user = await User.findOne({_id: userId});
    console.log("ussserrrrrrr", user);
    if(user){
      token = user.userFCMToken;
    }
    if(token){
      sendNotification(token, notificationMessage);
    }
    if(!user){
      user = await Driver.findOne({_id: userId});
      console.log("ussserrrrrrr", user);
      if(user){
        console.log(user);
        token = user.driverFCMToken;
      }
      
      if(token){
        sendNotification(token, notificationMessage);
      }
    }
  }
  else{
    user = await AuthAdmin.findById(userId) 
    ? await AuthAdmin.findById(userId) 
    : await support.findById(userId);
    token = user.adminFCMToken;
    console.log("admin", user);
    if(token){
      sendNotification(token, notificationMessage);
    }
  }
    
    const newNotication = new notifications({
      title: "New Message",
      body: "New message from active chat",
      sender: sender,
    })
    await newNotication.save();
    
  } catch (error) {
    console.error('Error handling message upload:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
app.post('/startChat', async (req, res) => {
  const { userId } = req.body;

  // Check if the user already has an active chat
  const activeChat = await ChatModel.findOne({ userId, status: 'active' });
  if (activeChat) {
    return res.status(200).json({ chatId: activeChat._id});
  }
  // Count the number of currently active chats
  const activeChatsCount = await ChatModel.countDocuments({ status: 'active' });
  const supportDocs = await support.find().lean(); // Get all support documents
  const adminDocs = await AuthAdmin.find().lean(); // Get all admin documents

    const notificationMessage = {
      title: 'New Chat Started',
      body: 'A new user is waiting in the queue.',
    };
    for (const supportUser of supportDocs) {
      if (supportUser.adminFCMToken) {
        sendNotification(supportUser.adminFCMToken, notificationMessage);
      }
    }

    // Notify all admin users
    for (const adminUser of adminDocs) {
      if (adminUser.adminFCMToken) {
        sendNotification(adminUser.adminFCMToken, notificationMessage);
      }
    }

    // Save a new notification in the database
    const newNotification = new notifications({
      title: "New Chat Started",
      body: 'A new user is waiting for support.',
      sender: userId,
      route: "/supportScreen"
    });
    await newNotification.save();
  // Create a new chat session
  const newChat = await ChatModel.create({
    userId,
    status: 'active',
    messages: [],
    createdAt: new Date(),
  });
  // Respond with the chat ID and the number of waiting chats
  res.status(200).json({
    chatId: newChat._id,
    waitingChats: activeChatsCount,
    notifications: newNotification
  });
});

app.post('/endChat', async (req, res) => {
  const { chatId } = req.body;

  const chat = await ChatModel.findByIdAndUpdate(chatId, {
    status: 'ended',
    endedAt: new Date()
  });

  if (!chat) {
    return res.status(404).json({ message: 'Chat session not found.' });
  }

  res.status(200).json({ message: 'Chat session ended successfully.' });
});

app.get('/get-notifications', async(req, res)=>{
  try{
    const notification = await notifications.find();
    res.status(200).json({notifications: notification});
  }
  catch(error){
    console.log(error);
    return res.status(500).json({message: error.message});
  }
});

app.get('/chat/:id', async (req, res) => {
  try {
    // Extract the id from the request parameters
    const { id } = req.params;

    // Find the chat by _id
    const chat = await ChatModel.findOne({ _id: id });

    // Check if the chat exists
    if (!chat) {
      return res.status(400).json({ message: "No Chats Match This _id" });
    }

    // Send the chat data in the response
    res.status(200).json({ chat: chat });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
});

const updateFCMToken = async (model, adminId, fcmToken, res) => {
  try {
    // Validate FCM token
    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    // Find admin/support by ID
    const admin = await model.findOne({ _id: adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update FCM token and save
    admin.adminFCMToken = fcmToken;
    await admin.save();

    return res.status(200).json({ message: "FCM token updated successfully" });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return res.status(500).json({ message: "An error occurred while updating the FCM token" });
  }
};

// Routes
app.post('/updateAdmintoken/:id', async (req, res) => {
  const adminId = req.params.id;
  const { fcmToken } = req.body;

  await updateFCMToken(AuthAdmin, adminId, fcmToken, res);
});

app.post('/updateSupporttoken/:id', async (req, res) => {
  const adminId = req.params.id;
  const { fcmToken } = req.body;

  await updateFCMToken(supportModel, adminId, fcmToken, res);
});



// app.post('/create-payment-link', async (req, res) => {
//   const { amount, currency, customerEmail, customerPhone, orderId, description, dueDate } = req.body;

//   try {
//     // Prepare the payment
//     const paymentData = await xpay.preparePayment(amount);

//     console.log("Transaction data:", paymentData);
//     console.log("Active Payment Methods:", xpay.activePaymentMethods);
//     console.log("Payment Options Total Amounts:", xpay.PaymentOptionsTotalAmounts);

//     // User chooses a payment method (e.g., CARD or KIOSK)
//     const chosenMethod = PaymentMethod.CARD;

//     // Billing information
//     const billingInformation = {
//       name: "John Doe", // Replace with dynamic data if available
//       email: customerEmail,
//       phone_number: customerPhone,
//     };

//     // Complete the payment
//     const paymentResult = await xpay.makePayment(chosenMethod, billingInformation);

//     // Return the payment result to the client
//     res.status(200).json({
//       success: true,
//       paymentResult,
//     });
//   } catch (error) {
//     console.error("Error creating payment link:", error);
//     res.status(500).json({
//       success: false,
//       message: error,
//       error: error.message,
//     });
//   }
// });
app.get('/transaction/:transactionId', async (req, res) => {
  const { transactionId } = req.params;

  try {
    // Retrieve transaction details
    const transactionData = await xpay.getTransaction(transactionId);

    res.status(200).json({
      success: true,
      transactionData,
    });
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction details",
      error: error.message,
    });
  }
});
app.post('/payment-callback', async (req, res) => {
  const { transactionId, status, amount, customerEmail } = req.body;

  try {
    if (status === "success") {
      console.log("✅ Payment successful for transaction:", transactionId);

      // Update the user's wallet or perform other actions
      const driver = await Driver.findOne({ email: customerEmail });
      if (driver) {
        driver.wallet = (driver.wallet || 0) + parseFloat(amount);
        driver.updateWallettime = new Date();
        await driver.save();
      }

      res.status(200).json({ success: true, message: "Payment successful" });
    } else {
      console.warn("⚠️ Payment failed for transaction:", transactionId);
      res.status(400).json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.error("Error handling payment callback:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});

// Handle graceful shutdown 
process.on("SIGTERM", () => {
    server.close(() => {
        console.log("Process terminated");
    });
});
module.exports = app;
// Utility function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
}