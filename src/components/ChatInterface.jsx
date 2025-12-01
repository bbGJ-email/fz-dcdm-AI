import { useState } from 'react'
import { sendMessageToAI } from '../services/api'

function ChatInterface() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: '你好！我是AI助手，有什么可以帮助你的吗？' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    // 添加用户消息
    const userMessage = { role: 'user', content: inputValue }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // 调用API发送消息给AI
      const response = await sendMessageToAI(inputValue)
      
      // 添加AI回复
      const aiMessage = { role: 'ai', content: response.reply }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage = { 
        role: 'ai', 
        content: '抱歉，我暂时无法回复。请稍后再试。' 
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="message ai-message">
            正在思考中...
          </div>
        )}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          发送
        </button>
      </div>
    </div>
  )
}

export default ChatInterface