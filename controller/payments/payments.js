const axios = require('axios');
const payment = require('../../model/payments/fawry');
const User = require('../../model/regestration/userModel');
const Driver = require('../../model/regestration/driverModel');

const increaseWallet = async(transactionId)=>{
    const transaction = await payment.findOne({ transactionId: transactionId });
    try{
        const {
            userId,
            transactionId,
            amount,
            trans_status,
            type
        } = transaction
        if(type === 'user'){
            const updateWallet = await User.findOneAndUpdate(
                { _id: userId },
                { $inc: { wallet: amount } },
                { new: true }
            );
            const updateStatus = await transaction.findOneAndUpdate(
                { transactionId: transactionId },
                { transactionStatus: "SUCCESSFULL"},
                { new: true }
            )
        }
        if(type === 'driver'){
            const updateWallet = await Driver.findOneAndUpdate(
                {_id: userId},
                {$inc: {wallet: amount}},
                {new: true}
            );
            const updateStatus = await transaction.findOneAndUpdate(
                { transactionId: transactionId },
                { transactionStatus: "SUCCESSFULL"},
                { new: true }
            )
        }
    } 
    catch(error){
        console.log(error);
        res.send('Error While Inceasing Wallet');
    }
}

const initiatePayment = async (req, res) => {
  try {
    const { amount, currency, customerDetails, paymentUsing, type, userId } = req.body;

    if (!amount || !currency || !customerDetails?.name || !customerDetails?.email || !customerDetails?.phone_number) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const data = {
      amount,
      currency,
      billing_data: {
        name: customerDetails.name,
        email: customerDetails.email,
        phone_number: customerDetails.phone_number,
      },
      variable_amount_id: process.env.variable_amount,
      language: 'en',
      community_id: process.env.communityId,
      pay_using: paymentUsing,
      // date
    };

    const response = await axios.post(
      'https://community.xpay.app/api/v1/payments/pay/variable-amount',
      data,
      {
        headers: {
          'x-api-key': process.env.XPAY_API_KEY,
        },
      }
    );
    // Store transaction record with PENDING status
    console.log(response.data);
    await payment.create({
        userId,
        transactionId: response.data.data.transaction_uuid,  // Store transaction_uuid as transactionId
        transactionStatus: 'PENDING',  // The transaction is initially in 'PENDING' status
        amount,
        type,
        // date
    });

    res.json({ paymentUrl: response.data });
  } catch (error) {
    console.error('Payment initiation error:', error.message);
    res.status(500).json({ message: 'Error initiating payment', error: error.message });
  }
};

const handlePaymentRedirect = async (req, res) => {
  try {
    const { total_amount, transaction_Id, transaction_status } = req.query;
    if (transaction_status === 'SUCCESSFUL') {
      return res.send(`Payment Successful! Transaction ID: ${transaction_Id}, Amount: ${total_amount}`);
    }

    res.send(`Payment Failed. Transaction Status: ${transaction_status}`);
  } catch (error) {
    console.error('Payment redirect handling error:', error.message);
    res.status(500).send('Error handling payment redirect');
  }
}

const handlePaymentCallback = async (req, res) => {
  try {
    const { total_amount, transaction_id, transaction_status } = req.body;

    const transaction = await payment.findOne({ transactionId: transaction_id });
    if (!transaction) {
      console.error('Transaction not found in callback');
      return res.status(404).send('Transaction not found');
    }

    if (transaction_status === 'SUCCESSFUL') {
      transaction.transactionStatus = 'SUCCESSFUL';
      await transaction.save();
        increaseWallet(transaction_id);
    } else {
      console.log(`Transaction Failed: ${transaction_id}, Status: ${transaction_status}`);
    }

    res.status(200).send('Callback received');
  } catch (error) {
    console.error('Payment callback handling error:', error.message);
    res.status(500).send('Error handling payment callback');
  }
};

const filterPayment = async(req, res)=>{
  const { startDate, endDate } = req.body;
  try{
    console.log("start date : ",startDate,"end date", endDate);
    const paymentData = await payment.find({date: {$gte: startDate, $lt: endDate}});
    console.log("Filtered Payments : ", paymentData);
    res.status(200).json(paymentData);
  }
  catch(error){
    console.log(error);
    return res.status(500).json({message: error.message});
  }
}

module.exports = {
  initiatePayment,
  handlePaymentRedirect,
  handlePaymentCallback,
  filterPayment
};
