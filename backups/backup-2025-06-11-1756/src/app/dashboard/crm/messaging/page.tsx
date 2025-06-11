'use client'

import { useState, useEffect } from 'react'

interface Message {
  id: string
  from: string
  to: string
  subject: string
  body: string
  timestamp: string
  read: boolean
}

export default function MessagingPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  // Mock data for development
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        from: 'john@example.com',
        to: 'me@company.com',
        subject: 'Project Update Required',
        body: 'Hello, I need an update on the current project status. Could you please provide the latest information?',
        timestamp: '2024-01-15T10:30:00Z',
        read: false
      },
      {
        id: '2',
        from: 'jane@example.com',
        to: 'me@company.com',
        subject: 'Meeting Confirmation',
        body: 'Just confirming our meeting scheduled for tomorrow at 2 PM. Looking forward to discussing the proposal.',
        timestamp: '2024-01-14T14:15:00Z',
        read: true
      },
      {
        id: '3',
        from: 'support@client.com',
        to: 'me@company.com',
        subject: 'Support Request #1234',
        body: 'We are experiencing some issues with the integration. Can you please check the API endpoints?',
        timestamp: '2024-01-13T09:45:00Z',
        read: false
      }
    ]

    // Simulate loading
    setTimeout(() => {
      setMessages(mockMessages)
      setLoading(false)
    }, 1000)
  }, [])

  const markAsRead = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    )
  }

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message)
    if (!message.read) {
      markAsRead(message.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="mt-2 text-gray-600">
                Manage your communications and messages
              </p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200">
              Compose Message
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
                <p className="text-sm text-gray-500">
                  {messages.filter(m => !m.read).length} unread messages
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {messages.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No messages yet.
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition duration-200 ${
                        !message.read ? 'bg-blue-50' : ''
                      } ${
                        selectedMessage?.id === message.id ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className={`text-sm font-medium text-gray-900 truncate ${
                              !message.read ? 'font-semibold' : ''
                            }`}>
                              {message.from}
                            </p>
                            {!message.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <p className={`text-sm text-gray-700 truncate ${
                            !message.read ? 'font-medium' : ''
                          }`}>
                            {message.subject}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(message.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Message Details */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {selectedMessage.subject}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>From: {selectedMessage.from}</span>
                        <span>To: {selectedMessage.to}</span>
                        <span>
                          {new Date(selectedMessage.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedMessage.body}
                    </p>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200">
                      Reply
                    </button>
                    <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200">
                      Forward
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No message selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a message from the list to view its contents.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
