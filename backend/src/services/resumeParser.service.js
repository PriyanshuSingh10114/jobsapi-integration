const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

const COMMON_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'php', 'ruby',
  'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'fastapi', 'flask', 'spring boot',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd',
  'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'dynamodb', 'graphql', 'rest api',
  'playwright', 'selenium', 'cypress', 'jest', 'kafka', 'rabbitmq', 'microservices', 'linux', 'git',
  'machine learning', 'pytorch', 'tensorflow', 'nlp', 'llm', 'tailwind', 'devops', 'agile'
];

class ResumeParserService {
  /**
   * Simple, reliable text extractor for resumes without external binary dependencies.
   */
  async extractText(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      // UTF-8 string decoding
      let text = buffer.toString('utf-8');
      
      // Filter out non-printable binary characters
      text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
      // Normalize whitespace
      text = text.replace(/\s+/g, ' ').trim();

      if (text.length > 50) {
        return text;
      }

      // Fallback filename based representation if raw binary stream
      return `Resume Document ${path.basename(filePath)}`;
    } catch (err) {
      logger.warn(`[ResumeParser] Could not extract text from ${filePath}: ${err.message}`);
      return path.basename(filePath);
    }
  }

  /**
   * Parses text to extract candidate skills, target role, and years of experience.
   */
  parseContent(rawText, filename) {
    const textLower = (rawText || '').toLowerCase();
    
    // 1. Extract matching skills from vocabulary
    const matchedSkills = COMMON_SKILLS.filter(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(textLower);
    });

    // 2. Estimate Target Role
    const roles = [
      'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer',
      'Software Engineer', 'DevOps Engineer', 'Cloud Architect',
      'Data Engineer', 'Machine Learning Engineer', 'Product Manager',
      'QA Automation Engineer', 'Systems Architect', 'Security Engineer'
    ];

    let targetRole = 'Software Engineer';
    for (const r of roles) {
      if (textLower.includes(r.toLowerCase())) {
        targetRole = r;
        break;
      }
    }

    // 3. Estimate Years of Experience (look for patterns like "5+ years", "10 years")
    let yoe = 3;
    const yoeMatch = textLower.match(/(\d+)\+?\s*years(?:\s*of)?\s*(?:experience|exp)/i);
    if (yoeMatch && yoeMatch[1]) {
      const val = parseInt(yoeMatch[1], 10);
      if (val > 0 && val < 40) yoe = val;
    }

    // 4. Generate summary
    const cleanWords = rawText.slice(0, 350).replace(/[^\w\s.,-]/g, ' ').trim();
    const summary = cleanWords.length > 30 
      ? `${cleanWords}...` 
      : `Experienced ${targetRole} with expertise in ${matchedSkills.slice(0, 5).join(', ')}.`;

    return {
      targetRole,
      yearsOfExperience: yoe,
      skills: matchedSkills.length > 0 ? matchedSkills.map(s => s.toUpperCase()) : ['JAVASCRIPT', 'REACT', 'NODE.JS'],
      summary,
      contentText: rawText.slice(0, 5000),
    };
  }
}

module.exports = new ResumeParserService();
