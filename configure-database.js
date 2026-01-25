#!/usr/bin/env node

/**
 * CloudBase 数据库权限配置工具
 * 一键配置 letters 集合的安全规则
 */

const https = require('https');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

// 配置常量
const ENV_ID = 'cloud1-7gtwuw5665620997';
const API_HOST = 'tcb.tencentcloudapi.com';
const SERVICE = 'tcb';
const VERSION = '2018-06-08';
const ACTION = 'ModifyDatabaseACL';
const REGION = 'ap-shanghai';

// 集合配置
const COLLECTIONS = {
  letters: {
    name: 'letters',
    description: '用户信件',
    rule: {
      read: 'doc._openid == auth.uid',
      write: 'doc._openid == auth.uid'
    }
  },
  users: {
    name: 'users',
    description: '用户信息',
    rule: {
      read: 'doc._openid == auth.uid || doc._openid == \"\"',
      write: 'doc._openid == auth.uid'
    }
  }
};

/**
 * 生成 TC3-HMAC-SHA256 签名
 */
function sign(secretKey, date, service, strToSign) {
  function hmacSha256(key, msg) {
    return crypto.createHmac('sha256', key).update(msg).digest();
  }

  const s1 = hmacSha256('TC3' + secretKey, date);
  const s2 = hmacSha256(s1, service);
  const s3 = hmacSha256(s2, 'tc3_request');
  return hmacSha256(s3, strToSign).toString('hex');
}

/**
 * 调用腾讯云 API 配置权限
 */
function configureDatabase(secretId, secretKey, collectionName) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];

    const collection = COLLECTIONS[collectionName];
    
    const payload = {
      EnvId: ENV_ID,
      CollectionName: collection.name,
      AclTag: 'CUSTOM',
      AclRule: JSON.stringify(collection.rule)
    };

    const payloadStr = JSON.stringify(payload);
    const hashedPayload = crypto.createHash('sha256').update(payloadStr).digest('hex');

    const canonicalRequest =
      'POST\n' +
      '/\n' +
      '\n' +
      `content-type:application/json\n` +
      `host:${API_HOST}\n` +
      `x-tc-action:${ACTION}\n` +
      `x-tc-timestamp:${timestamp}\n` +
      `x-tc-version:${VERSION}\n` +
      '\n' +
      'content-type;host;x-tc-action;x-tc-timestamp;x-tc-version\n' +
      hashedPayload;

    const hashedCanonical = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const strToSign = `TC3-HMAC-SHA256\n${date}T000000Z\n${date}/${SERVICE}/tc3_request\n${hashedCanonical}`;

    const signature = sign(secretKey, date, SERVICE, strToSign);

    const authorization =
      `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${SERVICE}/tc3_request, ` +
      `SignedHeaders=content-type;host;x-tc-action;x-tc-timestamp;x-tc-version, ` +
      `Signature=${signature}`;

    const options = {
      hostname: API_HOST,
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': API_HOST,
        'X-TC-Action': ACTION,
        'X-TC-Timestamp': timestamp.toString(),
        'X-TC-Version': VERSION,
        'Authorization': authorization
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.Response?.Error) {
            reject(new Error(response.Response.Error.Message));
          } else {
            resolve(response);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payloadStr);
    req.end();
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('\n================================================');
  console.log('   🔐 CloudBase 数据库权限配置工具');
  console.log('================================================\n');

  try {
    console.log('📋 配置信息：');
    console.log(`   环境 ID: ${ENV_ID}`);
    console.log(`   集合: ${Object.keys(COLLECTIONS).join(', ')}`);
    console.log(`   权限: 用户只能访问自己的数据\n`);

    const secretId = await question('🔑 请输入腾讯云 SecretId: ');
    const secretKey = await question('🔑 请输入腾讯云 SecretKey: ');

    if (!secretId || !secretKey) {
      throw new Error('SecretId 和 SecretKey 不能为空');
    }

    console.log('\n⏳ 正在配置权限...\n');

    // 配置所有集合
    for (const [key, collection] of Object.entries(COLLECTIONS)) {
      console.log(`⚙️  正在配置 "${collection.name}" 集合...`);
      try {
        await configureDatabase(secretId, secretKey, key);
        console.log(`✅ "${collection.name}" 配置成功！`);
      } catch (error) {
        console.warn(`⚠️  "${collection.name}" 配置失败: ${error.message}`);
      }
    }

    console.log('\n✅ 所有集合权限配置完成！\n');
    console.log('📌 配置详情：');
    
    for (const collection of Object.values(COLLECTIONS)) {
      console.log(`\n📚 ${collection.name}:`);
      console.log(`   描述: ${collection.description}`);
      console.log(`   读权限: ${collection.rule.read}`);
      console.log(`   写权限: ${collection.rule.write}`);
    }
    
    console.log('\n⏱️  注意：规则更新可能需要 2-5 分钟才能生效\n');
    console.log('💡 下一步：更新小程序页面并测试数据库操作\n');

  } catch (error) {
    console.error('\n❌ 配置失败：', error.message);
    console.log('\n💡 可能的原因：');
    console.log('   1. SecretId 或 SecretKey 不正确');
    console.log('   2. 账户无权限操作此环境');
    console.log('   3. 网络连接问题\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
