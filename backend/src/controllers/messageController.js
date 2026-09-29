const Message = require('../models/Message');

// GET /api/messages - chat history, oldest first
exports.getMessages = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
};

// POST /api/messages - save a message, then broadcast it to everyone
exports.createMessage = async (req, res, next) => {
  try {
    const { username, text } = req.body;

    if (!username?.trim() || !text?.trim()) {
      return res.status(400).json({ error: 'username and text are required' });
    }

    const message = await Message.create({ username, text });

    req.app.get('io').emit('new_message', message);

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};
