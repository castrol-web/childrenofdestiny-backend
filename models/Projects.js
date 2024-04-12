const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  pictures: [{
    type: String // Array of picture file paths
  }],
  video: {
    type: String // Video file path
  },
  budgetDocument: {
    type: String // Word document file path
  }
});

export default mongoose.model('Project', projectSchema);


