const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  views: { type: Number, default: 0 }
});

module.exports = mongoose.model('View', viewSchema);
