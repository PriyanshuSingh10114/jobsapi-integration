const mongoose = require('mongoose');

const ReviewItemSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },
  questionType: {
    type: String,
    default: 'text',
    enum: ['text', 'radio', 'checkbox', 'select'],
  },
  options: {
    type: [String],
    default: [],
  },
  jobId: {
    type: String,
    index: true,
  },
  jobTitle: {
    type: String,
    default: 'Requisition',
  },
  companyName: {
    type: String,
    default: 'Employer',
  },
  applicationId: {
    type: String,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'ANSWERED', 'DISMISSED'],
    default: 'PENDING',
    index: true,
  },
  answerText: {
    type: String,
    default: '',
  },
  answeredAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.question_text = ret.questionText;
      ret.question_type = ret.questionType;
      ret.job_id = ret.jobId;
      ret.job_title = ret.jobTitle;
      ret.company_name = ret.companyName;
      ret.application_id = ret.applicationId;
      ret.answer_text = ret.answerText;
      return ret;
    }
  }
});

module.exports = mongoose.model('ReviewItem', ReviewItemSchema);
