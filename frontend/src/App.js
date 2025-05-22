import React, { useState } from 'react';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import './styles/App.css';

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [username, setUsername] = useState('');
  const [roomData, setRoomData] = useState({});
  
  // 채팅방 목록에서 방 선택 시 처리
  const handleJoinRoom = (roomId, name) => {
    // 채팅방 정보 가져오기
    fetch('/api/rooms')
      .then(response => response.json())
      .then(data => {
        const room = data.rooms.find(r => r.id === roomId);
        if (room) {
          setRoomData({ id: roomId, name: room.name });
          setCurrentRoom(roomId);
          setUsername(name);
        }
      })
      .catch(error => console.error('Error fetching room data:', error));
  };
  
  // 채팅방에서 나가기
  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setUsername('');
  };
  
  return (
    <div className="container">
      <div className="header">
        <h1>실시간 채팅 서비스</h1>
      </div>
      
      {!currentRoom ? (
        <RoomList onJoinRoom={handleJoinRoom} />
      ) : (
        <ChatRoom 
          roomId={currentRoom}
          username={username}
          roomName={roomData.name}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;
