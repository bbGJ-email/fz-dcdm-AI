// Netlify Function - AI聊天接口
const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    // 解析请求体
    const body = JSON.parse(event.body);
    const { message } = body;
    
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '消息不能为空' })
      };
    }

    // 调用airoe.cn平台API（兼容OpenAI接口格式）
    const response = await axios.post(
      'https://airoe.cn/v1/chat/completions',
      {
        model: 'qwen-plus-2025-09-11', // airoe.cn支持的模型
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIROE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 返回AI的回复
    const reply = response.data.choices[0].message.content;
    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error('Error calling AI API:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.response?.data?.error?.message || '服务器错误'
      })
    };
  }
};