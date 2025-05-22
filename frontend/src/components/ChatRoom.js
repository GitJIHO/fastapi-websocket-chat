import React, { useState, useEffect, useRef } from 'react';
import '../styles/ChatRoom.css';

const ChatRoom = ({ roomId, username, roomName, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  
  // 웹소켓 연결 설정
  useEffect(() => {
    // 현재 URL에서 호스트 추출
    const currentHost = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // 웹소켓 연결
    const socket = new WebSocket(`${protocol}//${currentHost}/ws/${roomId}/${username}`);
    
    // 웹소켓 이벤트 리스너
    socket.onopen = () => {
      console.log('WebSocket connected');
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    setWs(socket);
    
    // 컴포넌트 언마운트 시 웹소켓 연결 종료
    return () => {
      socket.close();
    };
  }, [roomId, username]);
  
  // 새 메시지가 추가될 때마다 스크롤 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // 메시지 전송 핸들러
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() && ws) {
      ws.send(messageInput);
      setMessageInput('');
    }
  };
  
  // 메시지 유형에 따른 CSS 클래스 결정
  const getMessageClass = (sender) => {
    if (sender === '시스템') return 'message system';
    return sender === username ? 'message sent' : 'message received';
  };
  
  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>{roomName}</h2>
        <button className="back-btn" onClick={onLeave}>나가기</button>
      </div>
      
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={getMessageClass(msg.sender)}>
            {msg.sender !== '시스템' && <div className="sender">{msg.sender}</div>}
            <div>{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="message-input"
          placeholder="메시지를 입력하세요..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
        />
        <button type="submit" className="send-btn">전송</button>
      </form>
    </div>
  );
};

export default ChatRoom;
