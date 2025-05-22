import React, { useState, useEffect } from 'react';
import '../styles/RoomList.css';

const RoomList = ({ onJoinRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [username, setUsername] = useState('');
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  
  // 컴포넌트 마운트 시 채팅방 목록 가져오기
  useEffect(() => {
    fetch('/api/rooms')
      .then(response => response.json())
      .then(data => setRooms(data.rooms))
      .catch(error => console.error('Error fetching rooms:', error));
  }, []);
  
  // 채팅방 참여 버튼 클릭 핸들러
  const handleJoinClick = (roomId) => {
    setSelectedRoom(roomId);
    setShowUsernameForm(true);
  };
  
  // 사용자명 입력 후 참여 핸들러
  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim() && selectedRoom) {
      onJoinRoom(selectedRoom, username);
    }
  };
  
  return (
    <div className="room-list">
      <h2>채팅방 목록</h2>
      {rooms.map(room => (
        <div key={room.id} className="room-item">
          <div className="room-info">
            <div className="room-name">{room.name}</div>
            <div className="room-users">참여자: {room.users_count}명</div>
          </div>
          <button 
            className="join-btn" 
            onClick={() => handleJoinClick(room.id)}
          >
            참여
          </button>
        </div>
      ))}
      
      {showUsernameForm && (
        <form className="username-form" onSubmit={handleJoin}>
          <input
            type="text"
            className="username-input"
            placeholder="대화명을 입력하세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button type="submit" className="submit-btn">참여하기</button>
        </form>
      )}
    </div>
  );
};

export default RoomList;
