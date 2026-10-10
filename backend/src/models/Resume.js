const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true,
  },
  displayName: {
    type: String,
    trim: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
  },
  mimeType: {
    type: String,
    default: 'application/pdf',
  },
  targetRole: {
    type: String,
    index: true,
    trim: true,
  },
  yearsOfExperience: {
    type: Number,
    default: 0,
  },
  skills: {
    type: [String],
    default: [],
  },
  summary: {
    type: String,
    default: '',
  },
  contentText: {
    type: String,
    default: '',
  },
  customFields: [{
    key: { type: String, required: true },
    value: { type: String, required: true }
  }],
  userId: {
    type: String,
    default: 'default',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.file_name = ret.fileName;
      ret.display_name = ret.displayName || ret.fileName;
      ret.target_role = ret.targetRole;
      ret.years_of_experience = ret.yearsOfExperience;
      ret.uploaded_at = ret.createdAt;
      return ret;
    }
  }
});

module.exports = mongoose.model('Resume', ResumeSchema);
