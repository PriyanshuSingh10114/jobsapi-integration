const mongoose = require('mongoose');

const SearchProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  keywords: {
    type: [String],
    required: true,
    default: [],
  },
  location: {
    type: String,
    default: 'United States',
    trim: true,
  },
  workSettings: {
    type: [String],
    default: ['Remote'],
  },
  employmentTypes: {
    type: [String],
    default: ['FULLTIME', 'CONTRACTS'],
  },
  easyApplyOnly: {
    type: Boolean,
    default: true,
  },
  postedWithin: {
    type: String,
    default: 'ONE',
  },
  radius: {
    type: Number,
    default: 30,
  },
  experienceLevels: {
    type: [String],
    default: [],
  },
  userId: {
    type: String,
    default: 'default',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
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
      ret.work_settings = ret.workSettings;
      ret.employment_types = ret.employmentTypes;
      ret.easy_apply_only = ret.easyApplyOnly;
      ret.posted_within = ret.postedWithin;
      return ret;
    }
  }
});

module.exports = mongoose.model('SearchProfile', SearchProfileSchema);
