// API服务文件
import supabase from './supabaseClient'

// 发送消息到AI接口
export const sendMessageToAI = async (message) => {
  try {
    // 在生产环境中，调用Vercel Edge Function
    // 开发环境中，可以使用模拟数据或直接调用OpenAI API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    })

    if (!response.ok) {
      throw new Error('API请求失败')
    }

    const result = await response.json()
    
    // 记录用户消息和AI响应到Supabase
    await logMessage(message, result.reply)
    
    return result
  } catch (error) {
    console.error('API调用错误:', error)
    throw error
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