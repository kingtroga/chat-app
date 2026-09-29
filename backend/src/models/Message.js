const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, maxlength: 30 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  // createdAt is our message timestamp
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('Message', messageSchema);
