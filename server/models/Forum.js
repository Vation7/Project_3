const { Schema, model } = require('mongoose');

const forumSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: { 
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
});

const Forum = model('Forum', forumSchema);

module.exports = Forum;