const sensitiveWords = require('./sensitiveWords.json');

class SensitiveWordDetector {
  constructor() {
    this.words = sensitiveWords;
  }

  detect(text) {
    if (!text) {
      return {
        hasSensitive: false,
        isHighSensitive: false,
        isInvestment: false,
        words: [],
        categories: []
      };
    }

    const foundWords = [];
    const foundCategories = [];
    let isHighSensitive = false;
    let isInvestment = false;

    for (const category in this.words) {
      for (const word of this.words[category]) {
        if (text.includes(word)) {
          if (!foundWords.includes(word)) {
            foundWords.push(word);
          }
          if (!foundCategories.includes(category)) {
            foundCategories.push(category);
          }
        }
      }
    }

    isHighSensitive = foundCategories.some(c => c === 'violence' || c === 'porn');
    isInvestment = foundCategories.includes('investment');

    return {
      hasSensitive: foundWords.length > 0,
      isHighSensitive,
      isInvestment,
      words: foundWords,
      categories: foundCategories
    };
  }

  filter(text) {
    if (!text) return text;

    let result = text;
    for (const category in this.words) {
      for (const word of this.words[category]) {
        const regex = new RegExp(word, 'g');
        result = result.replace(regex, '***');
      }
    }
    return result;
  }

  hasSensitiveWord(text) {
    if (!text) return false;

    for (const category in this.words) {
      for (const word of this.words[category]) {
        if (text.includes(word)) {
          return true;
        }
      }
    }
    return false;
  }
}

module.exports = new SensitiveWordDetector();
