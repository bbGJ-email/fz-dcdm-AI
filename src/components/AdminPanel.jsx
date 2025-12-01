import { useState, useEffect } from 'react'
import { getAIConfig, saveAIConfig } from '../services/api'
import supabase from '../services/supabaseClient'

function AdminPanel() {
  const [config, setConfig] = useState({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('config') // 'config' 或 'history'
  const [messageHistory, setMessageHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await getAIConfig()
        setConfig(data)
      } catch (error) {
        console.error('加载配置失败:', error)
      }
    }
    loadConfig()
  }, [])

  // 加载消息历史
  const loadMessageHistory = async () => {
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) {
        console.error('加载消息历史失败:', error)
        setMessage('加载历史记录失败')
      } else {
        setMessageHistory(data)
      }
    } catch (error) {
      console.error('加载消息历史异常:', error)
      setMessage('加载历史记录异常')
    } finally {
      setHistoryLoading(false)
    }
  }

  // 切换到历史记录标签时加载数据
  useEffect(() => {
    if (activeTab === 'history') {
      loadMessageHistory()
    }
  }, [activeTab])

  // 处理输入变化
  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  // 保存配置
  const handleSave = async () => {
    setIsLoading(true)
    setMessage('')
    try {
      await saveAIConfig(config)
      setMessage('配置保存成功！')
    } catch (error) {
      console.error('保存配置失败:', error)
      setMessage('保存失败，请重试。')
    } finally {
      setIsLoading(false)
    }
  }

  // 清空消息历史
  const handleClearHistory = async () => {
    if (!window.confirm('确定要清空所有消息历史吗？此操作不可撤销。')) {
      return
    }
    
    setHistoryLoading(true)
    try {
      const { error } = await supabase
        .from('user_messages')
        .delete()
      
      if (error) {
        console.error('清空历史记录失败:', error)
        setMessage('清空失败，请重试')
      } else {
        setMessageHistory([])
        setMessage('历史记录已清空')
      }
    } catch (error) {
      console.error('清空历史记录异常:', error)
      setMessage('清空异常，请重试')
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="admin-panel">
      <h2>AI管理后台</h2>
      
      {/* 标签切换 */}
      <div className="admin-tabs">
        <button 
          className={activeTab === 'config' ? 'active' : ''}
          onClick={() => setActiveTab('config')}
        >
          AI配置
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          消息历史
        </button>
      </div>
      
      {message && (
        <div className={`status-message ${message.includes('成功') || message.includes('已清空') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* 配置表单 */}
      {activeTab === 'config' && (
        <form className="config-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div>
            <label htmlFor="model">AI模型</label>
            <select
              id="model"
              name="model"
              value={config.model}
              onChange={handleInputChange}
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>

          <div>
            <label htmlFor="temperature">温度参数 (0-2) - 控制输出的随机性</label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              value={config.temperature}
              onChange={handleInputChange}
              min="0"
              max="2"
              step="0.1"
            />
          </div>

          <div>
            <label htmlFor="top_p">Top P (0-1) - 控制采样范围</label>
            <input
              type="number"
              id="top_p"
              name="top_p"
              value={config.top_p}
              onChange={handleInputChange}
              min="0"
              max="1"
              step="0.1"
            />
          </div>

          <div>
            <label htmlFor="max_tokens">最大令牌数</label>
            <input
              type="number"
              id="max_tokens"
              name="max_tokens"
              value={config.max_tokens}
              onChange={handleInputChange}
              min="100"
              max="4000"
              step="100"
            />
          </div>

          <div>
            <label htmlFor="frequency_penalty">频率惩罚 (0-2) - 减少重复内容</label>
            <input
              type="number"
              id="frequency_penalty"
              name="frequency_penalty"
              value={config.frequency_penalty}
              onChange={handleInputChange}
              min="0"
              max="2"
              step="0.1"
            />
          </div>

          <div>
            <label htmlFor="presence_penalty">存在惩罚 (0-2) - 鼓励新话题</label>
            <input
              type="number"
              id="presence_penalty"
              name="presence_penalty"
              value={config.presence_penalty}
              onChange={handleInputChange}
              min="0"
              max="2"
              step="0.1"
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存配置'}
            </button>
          </div>
        </form>
      )}

      {/* 消息历史 */}
      {activeTab === 'history' && (
        <div className="history-section">
          <div className="history-header">
            <h3>最近的消息历史</h3>
            <button onClick={handleClearHistory} disabled={historyLoading}>
              {historyLoading ? '处理中...' : '清空历史'}
            </button>
          </div>
          
          {historyLoading ? (
            <div className="loading">加载中...</div>
          ) : messageHistory.length === 0 ? (
            <div className="no-data">暂无消息历史</div>
          ) : (
            <div className="history-list">
              {messageHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-time">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                  <div className="history-content">
                    <div className="user-query">
                      <strong>用户:</strong> {item.message}
                    </div>
                    <div className="ai-response">
                      <strong>AI:</strong> {item.ai_response}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPanel