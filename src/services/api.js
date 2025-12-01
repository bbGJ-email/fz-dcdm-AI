// API服务文件
import supabase from './supabaseClient'

// 发送消息到AI接口
export const sendMessageToAI = async (message) => {
  try {
    // 开发环境始终使用模拟数据
    if (import.meta.env.DEV) { 
      console.log('开发环境: 使用模拟数据响应消息:', message);
      return await getMockResponse(message);
    }
    
    // 生产环境尝试使用真实AI服务，但添加回退机制
    try {
      // 生产环境: 确定正确的Netlify Functions API端点
      const apiEndpoint = '/.netlify/functions/chat';
      
      console.log('生产环境: 尝试发送请求到Netlify Functions:', apiEndpoint);
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      })

      if (!response.ok) {
        console.error(`AI服务请求失败: ${response.status} ${response.statusText}`);
        // 尝试获取错误信息后回退到模拟数据
        try {
          const errorData = await response.json();
          console.error('AI服务错误详情:', errorData);
        } catch (e) {
          console.error('无法解析错误响应:', e);
        }
        // 回退到模拟数据
        console.warn('将使用模拟数据作为回退方案');
        return await getMockResponse(message);
      }

      const result = await response.json();
      
      // 验证响应格式
      if (!result.reply) {
        console.error('AI服务返回格式错误，缺少回复内容:', result);
        console.warn('将使用模拟数据作为回退方案');
        return await getMockResponse(message);
      }
      
      console.log('成功接收AI回复');
      
      // 记录用户消息和AI响应到Supabase
      try {
        await logMessage(message, result.reply);
      } catch (err) {
        console.warn('记录消息失败，但不影响回复:', err);
      }
      
      return result;
    } catch (error) {
      console.error('生产环境AI服务调用异常:', error);
      // 任何异常都回退到模拟数据
      console.warn('将使用模拟数据作为回退方案');
      return await getMockResponse(message);
    }
  } catch (error) {
    console.error('sendMessageToAI 整体调用错误:', error);
    // 最后的兜底机制，确保用户至少能得到一个响应
    try {
      return await getMockResponse(message);
    } catch (e) {
      // 最极端情况，直接返回错误信息
      return { 
        reply: '系统暂时无法处理请求，请稍后再试。我们的团队已经收到错误报告并正在解决问题。',
        isErrorFallback: true 
      };
    }
  }
}

// 封装模拟响应逻辑，便于多次调用
async function getMockResponse(message) {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟AI回复，根据消息内容稍微调整回复
  let mockReply;
  if (message.includes('你好') || message.includes('hi') || message.includes('Hello')) {
    mockReply = `你好！很高兴为你服务。你发送的消息是："${message}"`;
  } else if (message.includes('帮助') || message.includes('help')) {
    mockReply = `我是AI助手，可以回答你的问题。你发送的消息是："${message}"\n\n在生产环境中，我将由真实的AI模型提供更智能的回答。`;
  } else {
    mockReply = `这是模拟的AI回复。你发送的消息是："${message}"\n\n在真实环境部署后，将由专业的AI模型生成回复。`;
  }
  
  // 尝试记录到Supabase，但不影响主流程
  try {
    await logMessage(message, mockReply);
  } catch (err) {
    console.warn('记录消息失败，但不影响回复:', err);
  }
  
  return { reply: mockReply, isMock: true };
}

// 获取AI配置（从Supabase）
export const getAIConfig = async () => {
  try {
    // 从Supabase获取最新的AI配置
    const { data, error } = await supabase
      .from('ai_config')
      .select('model, temperature, max_tokens')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      console.warn('从Supabase获取配置失败，使用默认配置:', error)
      // 如果获取失败，返回默认配置
      return {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000
      }
    }
    
    return data
  } catch (error) {
    console.error('获取配置失败:', error)
    // 异常情况下也返回默认配置
    return {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000
    }
  }
}

// 保存AI配置（到Supabase）
export const saveAIConfig = async (config) => {
  try {
    // 插入新的配置记录（我们保留历史记录）
    const { data, error } = await supabase
      .from('ai_config')
      .insert([config])
      .select()
    
    if (error) {
      console.error('保存配置到Supabase失败:', error)
      throw error
    }
    
    return true
  } catch (error) {
    console.error('保存配置失败:', error)
    throw error
  }
}

// 记录用户消息到Supabase
export const logMessage = async (userMessage, aiResponse) => {
  try {
    const { error } = await supabase
      .from('user_messages')
      .insert([{
        message: userMessage,
        ai_response: aiResponse
      }])
    
    if (error) {
      console.error('记录消息失败:', error)
    }
  } catch (error) {
    console.error('记录消息异常:', error)
  }
}