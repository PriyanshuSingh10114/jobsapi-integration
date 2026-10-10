const mongoose = require('mongoose');

const DiceSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'default',
    unique: true,
  },
  username: {
    type: String,
    default: '',
  },
  isConnected: {
    type: Boolean,
    default: false,
  },
  cookies: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  cookiesCount: {
    type: Number,
    default: 0,
  },
  lastVerified: {
    type: Date,
  },
  settings: {
    openaiModel: { type: String, default: 'gpt-4o-mini' },
    maxJobsPerSearch: { type: Number, default: 15 },
    maxApplicationsPerRun: { type: Number, default: 10 },
    headlessBrowser: { type: Boolean, default: true },
    defaultMode: { type: String, default: 'APPLY' },
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.is_connected = ret.isConnected;
      ret.cookies_count = ret.cookiesCount || (ret.cookies ? ret.cookies.length : 0);
      ret.last_verified = ret.lastVerified;
      return ret;
    }
  }
});

module.exports = mongoose.model('DiceSession', DiceSessionSchema);
