// 这是Vercel Serverless Function，用于处理AI聊天请求
import axios from 'axios';

export default async function handler(req, res) {
  try {
    // 解析请求体
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 调用airoe.cn平台API（兼容OpenAI接口格式）
    const response = await axios.post(
      'https://airoe.cn/v1/chat/completions',
      {
        model: 'qwen-plus-2025-09-11', // airoe.cn支持的模型，也可以选择其他支持的模型如moonshot、grok等
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AIROE_API_KEY}`, // 使用airoe平台的API密钥
          'Content-Type': 'application/json'
        }
      }
    );

    // 返回AI的回复
    const reply = response.data.choices[0].message.content;
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // 返回错误信息
    return res.status(500).json({
      error: error.response?.data?.error?.message || '服务器错误'
    });
  }
}