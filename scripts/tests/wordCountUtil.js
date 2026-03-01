const wordCountConfig = {
  simple: { min: 200, max: 200, maxTokens: 280, label: '简单' },
  medium: { min: 200, max: 300, maxTokens: 400, label: '中等' },
  complex: { min: 400, max: 500, maxTokens: 650, label: '复杂' }
};

function estimateComplexity(userContent) {
  const length = userContent.length;
  if (length < 100) return 'simple';
  if (length > 300) return 'complex';
  return 'medium';
}

function getWordCountConfig(userContent) {
  const complexity = estimateComplexity(userContent);
  return wordCountConfig[complexity];
}

function countChineseWords(text) {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  return chineseChars.length + Math.round(englishWords.length * 1.5);
}

function truncateByChineseWords(text, maxWords) {
  const currentCount = countChineseWords(text);
  if (currentCount <= maxWords) return text;

  let low = 0, high = text.length;
  let best = text.substring(0, Math.floor(text.length * 0.7));

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.substring(0, mid);
    const count = countChineseWords(candidate);

    if (count <= maxWords) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const lastPunc = Math.max(
    best.lastIndexOf('。'),
    best.lastIndexOf('！'),
    best.lastIndexOf('？')
  );

  return lastPunc > 0 ? best.substring(0, lastPunc + 1) : best;
}

module.exports = {
  wordCountConfig,
  estimateComplexity,
  getWordCountConfig,
  countChineseWords,
  truncateByChineseWords
};
