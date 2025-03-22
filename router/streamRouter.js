const Stream = require('../model/stream'); // Import Stream model

const streamSocketHandler = (io, socket) => {
  socket.on('startStream', async ({ userId, title }) => {
    try {
      // Create a new stream in the database
      const stream = new Stream({
        broadcaster: userId,
        title,
        isLive: true,
      });

      await stream.save(); // Save the stream to the database

      // Join a specific room for the stream
      socket.join(`stream-${stream._id}`);

      // Notify all clients about the new stream
      io.emit('newStream', stream);
    } catch (error) {
      console.error('Start stream error:', error);
    }
  });

  // Handle other stream-related events here (e.g., endStream, offer, answer, etc.)
};

module.exports = streamSocketHandler;
