// Netlify Function - AI聊天接口
const axios = require('axios');

exports.handler = async function(event, context) {
  console.log('Received chat request:', new Date().toISOString());
  
  // 添加CORS头，确保前端可以正常访问
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST'
  };
  
  // 处理OPTIONS请求（预检请求）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: headers
    };
  }
  
  try {
    // 检查API密钥是否配置
    if (!process.env.AIROE_API_KEY) {
      console.error('AIROE_API_KEY 环境变量未配置');
      return {
        statusCode: 500,
        headers: headers,
        body: JSON.stringify({ error: '服务器配置错误：缺少API密钥' })
      };
    }
    
    // 解析请求体
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('请求体解析失败:', parseError);
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ error: '请求格式错误，无效的JSON' })
      };
    }
    
    const { message } = body;
    
    if (!message || typeof message !== 'string') {
      console.error('缺少有效的消息参数:', message);
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ error: '消息不能为空且必须是字符串格式' })
      };
    }

    console.log('处理消息请求，长度:', message.length);
    
    // 设置axios超时和重试配置
    const axiosConfig = {
      timeout: 30000, // 30秒超时
      headers: {
        'Authorization': `Bearer ${process.env.AIROE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    // 调用airoe.cn平台API
    let response;
    try {
      response = await axios.post(
        'https://airoe.cn/v1/chat/completions',
        {
          model: 'qwen-plus-2025-09-11', // airoe.cn支持的模型
          messages: [{ role: 'user', content: message }],
          max_tokens: 1000,
          temperature: 0.7
        },
        axiosConfig
      );
    } catch (axiosError) {
      console.error('AI服务请求失败:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data
      });
      
      // 根据不同错误类型返回更具体的错误信息
      if (axiosError.response) {
        // 服务器返回了错误响应
        const errorMessage = axiosError.response.data?.error?.message || 
                          axiosError.response.statusText || 
                          `AI服务错误，状态码: ${axiosError.response.status}`;
        return {
          statusCode: axiosError.response.status,
          headers: headers,
          body: JSON.stringify({ error: errorMessage })
        };
      } else if (axiosError.request) {
        // 请求已发送但没有收到响应
        return {
          statusCode: 504,
          headers: headers,
          body: JSON.stringify({ error: 'AI服务超时或无法访问' })
        };
      } else {
        // 请求配置出错
        return {
          statusCode: 500,
          headers: headers,
          body: JSON.stringify({ error: `请求配置错误: ${axiosError.message}` })
        };
      }
    }
    
    // 验证响应格式
    if (!response.data || !response.data.choices || !response.data.choices[0]?.message?.content) {
      console.error('AI服务返回格式无效:', response.data);
      return {
        statusCode: 500,
        headers: headers,
        body: JSON.stringify({ error: 'AI服务返回格式错误' })
      };
    }

    // 返回AI的回复
    const reply = response.data.choices[0].message.content;
    console.log('成功获取AI回复，长度:', reply.length);
    
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    // 捕获所有未预期的错误
    console.error('处理请求时发生未预期错误:', error);
    
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({
        error: '服务器处理请求时发生错误',
        timestamp: new Date().toISOString()
      })
    };
  }
};