const CACHE_KEY = 'mentorRules';
const CACHE_EXPIRE = 7 * 24 * 60 * 60 * 1000;

function saveMentorRulesCache(data) {
  wx.setStorageSync(CACHE_KEY, {
    data,
    timestamp: Date.now()
  });
}

function getMentorRulesCache() {
  const cached = wx.getStorageSync(CACHE_KEY);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_EXPIRE) {
    return null;
  }
  return cached.data;
}

module.exports = {
  saveMentorRulesCache,
  getMentorRulesCache
};
