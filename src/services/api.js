// API服务文件
import supabase from './supabaseClient'

// 发送消息到AI接口
export const sendMessageToAI = async (message) => {
  try {
    // 开发环境使用模拟数据，生产环境使用真实AI服务
    if (import.meta.env.DEV) { 
      console.log('开发环境: 使用模拟数据响应消息:', message);
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟AI回复
      const mockReply = `你好！这是模拟的AI回复。你发送的消息是："${message}"\n\n在生产环境部署时，这个回复将由真实的AI服务生成。`;
      
      // 尝试记录到Supabase，但不影响主流程
      try {
        await logMessage(message, mockReply);
      } catch (err) {
        console.warn('记录消息失败，但不影响回复:', err);
      }
      
      return { reply: mockReply };
    }
    
    // 生产环境: 确定正确的Netlify Functions API端点
    const apiEndpoint = '/.netlify/functions/chat';
    
    console.log('生产环境: 发送请求到Netlify Functions:', apiEndpoint);
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    })

    if (!response.ok) {
      console.error(`API请求失败: ${response.status} ${response.statusText}`);
      // 尝试获取更详细的错误信息
      let errorDetails = '未知错误';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || `请求失败，状态码: ${response.status}`;
      } catch (e) {
        // 如果无法解析JSON响应，使用默认错误信息
      }
      throw new Error(`API请求失败: ${errorDetails}`)
    }

    const result = await response.json();
    
    // 验证响应格式
    if (!result.reply) {
      throw new Error('AI服务返回格式错误，缺少回复内容');
    }
    
    console.log('成功接收AI回复:', result.reply);
    
    // 记录用户消息和AI响应到Supabase
    try {
      await logMessage(message, result.reply);
    } catch (err) {
      console.warn('记录消息失败，但不影响回复:', err);
    }
    
    return result;
  } catch (error) {
    console.error('API调用错误:', error);
    // 可以添加错误重试逻辑或其他错误处理
    throw error;
  }
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