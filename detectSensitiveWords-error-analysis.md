# 云函数 detectSensitiveWords 错误分析

## 🔍 常见错误原因分析

### 1. **部署错误 - 最常见原因**
❌ **问题**：云函数没有正确上传部署到云开发环境
✅ **检查**：
   - 在微信开发者工具的云开发控制台 → 云函数 → 查看是否有 `detectSensitiveWords`
   - 查看云函数版本是否是最新的

### 2. **依赖缺失 - 缺少 wx-server-sdk**
❌ **问题**：云函数运行时缺少依赖
✅ **检查**：
   - `detectSensitiveWords` 目录下是否有 `node_modules` 文件夹
   - 需在云函数目录执行 `npm install` 后再部署

### 3. **路径错误 - 无法导入 sensitiveWordDetector**
❌ **问题**：云函数中导入路径错误
```javascript
const sensitiveWordDetector = require('../replyToLetter/sensitiveWordDetector');
```
✅ **验证**：
   - 路径正确：`../replyToLetter/sensitiveWordDetector.js` 存在
   - replyToLetter 云函数已部署且文件存在

### 4. **权限错误 - 云函数权限配置问题**
❌ **问题**：云函数没有正确的执行权限
✅ **检查**：
   - 云开发控制台 → 云函数 → 权限配置
   - 确保拥有云函数执行权限

### 5. **参数错误 - 调用时缺少 text 参数**
❌ **问题**：调用云函数时没有传递 text 参数
```javascript
// 错误调用
wx.cloud.callFunction({ name: 'detectSensitiveWords' })

// 正确调用
wx.cloud.callFunction({ 
  name: 'detectSensitiveWords',
  data: { text: "需要检测的文本" }
})
```

## 📋 错误日志分析步骤

### 在微信开发者工具中查看日志：
1. 打开云开发控制台 → 云函数 → 日志
2. 搜索 `detectSensitiveWords` 查看最近的调用日志
3. 重点关注错误信息中的关键词：
   - `Cannot find module '../replyToLetter/sensitiveWordDetector'` → 路径错误或文件未部署
   - `Cannot find module 'wx-server-sdk'` → 缺少依赖
   - `text is undefined` → 调用时缺少参数
   - `permission denied` → 权限问题

## 🛠️ 修复方案

### 方案 1：重新部署云函数
```bash
# 1. 进入云函数目录
cd /Users/bill/编程/invest-diary/cloudfunctions/detectSensitiveWords

# 2. 安装依赖
npm install

# 3. 在微信开发者工具中右键云函数 → 上传并部署：云端安装依赖
```

### 方案 2：修复导入路径
如果部署后仍然提示找不到模块，可以将 `sensitiveWordDetector.js` 和 `sensitiveWords.json` 复制到 `detectSensitiveWords` 目录下，然后修改导入路径：
```javascript
// 修改为本地导入
const sensitiveWordDetector = require('./sensitiveWordDetector');
```

### 方案 3：测试云函数
在云开发控制台 → 云函数 → 测试，输入测试参数：
```json
{
  "text": "这是一段包含杀人的暴力文本"
}
```
点击测试，查看返回结果。
