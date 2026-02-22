class SensitiveWordUtil {
  constructor() {
    this.words = {
      violence: [
        '杀人', '暴力', '恐怖', '袭击', '爆炸', '枪支', '武器',
        '血腥', '残忍', '虐待', '杀戮', '谋杀', '伤害', '残害'
      ],
      porn: [
        '色情', '淫秽', '性交易', '嫖娼', '卖淫', '裸聊',
        '成人', '黄色', '低俗', '下流', '猥琐', '淫秽物品'
      ],
      investment: [
        '买入', '卖出', '推荐', '估值', '收益率', '回报率',
        '目标价', '股价', '基金净值', '投资建议', '理财规划',
        '增持', '减持', '抄底', '逃顶', '加仓', '减仓'
      ]
    };
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

  detect(text) {
    if (!text) {
      return {
        hasSensitive: false,
        words: [],
        categories: []
      };
    }

    const foundWords = [];
    const foundCategories = [];

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

    return {
      hasSensitive: foundWords.length > 0,
      words: foundWords,
      categories: foundCategories,
      isHighSensitive: foundCategories.some(c => c === 'violence' || c === 'porn'),
      isInvestment: foundCategories.includes('investment')
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
}

module.exports = new SensitiveWordUtil();
