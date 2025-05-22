# FastAPI WebSocket 실시간 채팅 애플리케이션

## 1. 문제 정의

현대 웹 애플리케이션에서 실시간 통신은 사용자 경험을 크게 향상시키는 핵심 요소입니다. 특히 채팅 애플리케이션의 경우, 사용자들이 지연 없이 즉각적으로 메시지를 주고받을 수 있어야 합니다. 기존의 HTTP 요청/응답 모델은 이러한 실시간 통신에 최적화되어 있지 않아 폴링(polling)과 같은 비효율적인 방식을 사용해야 했습니다.

이 프로젝트는 WebSocket 프로토콜을 활용하여 클라이언트와 서버 간의 양방향 실시간 통신이 가능한 채팅 애플리케이션을 개발하는 것을 목표로 합니다. 사용자들이 다양한 주제의 채팅방에 참여하여 실시간으로 대화할 수 있는 플랫폼을 제공함으로써, 효율적인 커뮤니케이션 환경을 구축하고자 합니다.

## 2. 요구사항 분석

### 2.1 기능적 요구사항

1. **채팅방 목록 조회**
   - 사용자는 현재 개설된 채팅방 목록을 확인할 수 있어야 함
   - 각 채팅방의 이름과 현재 참여자 수가 표시되어야 함

2. **채팅방 참여**
   - 사용자는 원하는 채팅방을 선택하여 참여할 수 있어야 함
   - 채팅방 입장 시 사용자 이름(닉네임)을 입력해야 함

3. **실시간 메시지 전송/수신**
   - 사용자는 채팅방에서 실시간으로 메시지를 전송할 수 있어야 함
   - 다른 사용자가 보낸 메시지를 실시간으로 수신할 수 있어야 함

4. **사용자 참여/퇴장 알림**
   - 채팅방에 새로운 사용자가 참여하거나 퇴장할 때 시스템 메시지로 알림이 표시되어야 함

5. **채팅방 퇴장**
   - 사용자는 언제든지 채팅방을 퇴장할 수 있어야 함

### 2.2 비기능적 요구사항

1. **실시간성**
   - 메시지 전송과 수신이 지연 없이 실시간으로 이루어져야 함

2. **확장성**
   - 다수의 사용자와 채팅방을 효율적으로 지원할 수 있어야 함

3. **사용성**
   - 직관적인 UI/UX를 제공하여 사용자가 쉽게 애플리케이션을 이용할 수 있어야 함
   - 모바일 환경에서도 적절히 표시되는 반응형 디자인

4. **안정성**
   - WebSocket 연결이 끊어졌을 때 적절히 처리되어야 함
   - 예외 상황에 대한 적절한 오류 처리

5. **배포 용이성**
   - 손쉬운 배포와 외부 접근이 가능해야 함

## 3. 기술 스택 및 아키텍처

### 3.1 기술 스택

**백엔드:**
- **FastAPI**: 고성능 Python 웹 프레임워크
- **WebSockets**: 실시간 양방향 통신 프로토콜
- **Uvicorn**: ASGI 서버
- **Jinja2**: 템플릿 엔진
- **Pyngrok**: 로컬 서버를 인터넷에 노출시키는 도구

**프론트엔드:**
- **React.js**: 사용자 인터페이스 구축을 위한 JavaScript 라이브러리
- **CSS3**: 스타일링
- **HTML5 WebSocket API**: 클라이언트 측 WebSocket 통신

### 3.2 아키텍처

이 프로젝트는 클라이언트-서버 아키텍처를 기반으로 하며, WebSocket을 통한 실시간 통신을 구현했습니다.

```
[클라이언트(React)] <--WebSocket--> [서버(FastAPI)] <--메모리 저장소--> [채팅방 & 사용자 데이터]
```

**주요 컴포넌트:**

1. **프론트엔드 (React)**
   - RoomList 컴포넌트: 채팅방 목록 표시 및 참여 기능
   - ChatRoom 컴포넌트: 메시지 송수신 인터페이스

2. **백엔드 (FastAPI)**
   - HTTP API 엔드포인트: 채팅방 목록 제공
   - WebSocket 엔드포인트: 실시간 메시지 처리
   - ConnectionManager: WebSocket 연결 관리

3. **데이터 관리**
   - 인메모리 데이터 구조로 채팅방 및 사용자 정보 관리
   - 채팅 내역은 별도 저장하지 않음 (휘발성)

## 4. 핵심 알고리즘 및 처리 메커니즘

### 4.1 WebSocket 연결 및 메시지 처리

WebSocket 통신의 핵심은 ConnectionManager 클래스에 구현되어 있습니다. 이 클래스는 다음과 같은 주요 기능을 담당합니다:

1. **연결 관리**: 새로운 WebSocket 연결이 생성될 때마다 해당 연결을 사용자 및 채팅방과 연결하여 관리합니다.
2. **연결 해제 처리**: 사용자가 채팅방을 나가거나 연결이 끊어질 때 관련 리소스를 정리합니다.
3. **메시지 브로드캐스팅**: 특정 채팅방에 있는 모든 사용자에게 메시지를 전송합니다.

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, room_id: str, username: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][username] = websocket
        CHAT_ROOMS[room_id]["users"].add(username)
        CHAT_ROOMS[room_id]["connections"][username] = websocket
        
    def disconnect(self, room_id: str, username: str):
        if room_id in self.active_connections and username in self.active_connections[room_id]:
            del self.active_connections[room_id][username]
            CHAT_ROOMS[room_id]["users"].remove(username)
            del CHAT_ROOMS[room_id]["connections"][username]
            
    async def broadcast(self, message: str, room_id: str, sender: str):
        if room_id in self.active_connections:
            for username, connection in self.active_connections[room_id].items():
                await connection.send_text(json.dumps({
                    "sender": sender,
                    "message": message,
                    "room_id": room_id
                }))
```

### 4.2 WebSocket 엔드포인트 처리

사용자가 채팅방에 참여할 때 WebSocket 연결이 설정되며, 이 연결을 통해 메시지를 송수신합니다. 이 과정은 다음과 같은 단계로 처리됩니다:

1. **연결 요청 검증**: 채팅방 존재 여부 확인
2. **연결 성립**: 사용자를 채팅방에 추가하고 WebSocket 연결 수락
3. **입장 알림**: 채팅방 사용자들에게 새로운 참여자 알림
4. **메시지 처리**: 실시간으로 메시지를 수신하여 브로드캐스팅
5. **연결 해제 처리**: 사용자 퇴장 시 관련 처리 및 알림

```python
@app.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str):
    # 존재하는 방인지 확인
    if room_id not in CHAT_ROOMS:
        await websocket.close(code=1000, reason="Room does not exist")
        return
    
    await manager.connect(websocket, room_id, username)
    
    # 새 사용자가 입장했음을 알림
    join_message = f"{username}님이 입장했습니다."
    await manager.broadcast(join_message, room_id, "시스템")
    
    try:
        while True:
            # 클라이언트로부터 메시지 수신
            data = await websocket.receive_text()
            # 모든 클라이언트에게 메시지 브로드캐스트
            await manager.broadcast(data, room_id, username)
    except WebSocketDisconnect:
        manager.disconnect(room_id, username)
        # 사용자가 퇴장했음을 알림
        leave_message = f"{username}님이 퇴장했습니다."
        await manager.broadcast(leave_message, room_id, "시스템")
```

### 4.3 프론트엔드 WebSocket 관리

React 프론트엔드에서는 채팅방에 입장할 때 WebSocket 연결을 설정하고, 메시지 송수신을 처리합니다:

1. **연결 설정**: 채팅방 입장 시 WebSocket 객체 생성 및 이벤트 핸들러 등록
2. **메시지 수신**: `onmessage` 이벤트 핸들러를 통해 실시간 메시지 처리
3. **메시지 전송**: WebSocket의 `send` 메서드를 통해 서버로 메시지 전송
4. **연결 종료**: 채팅방 퇴장 시 WebSocket 연결 종료

```javascript
// ChatRoom.js의 일부
useEffect(() => {
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${host}/ws/${roomId}/${username}`);
    
    socket.onopen = () => {
        console.log("WebSocket connected");
    };
    
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(msgs => [...msgs, data]);
    };
    
    socket.onclose = () => {
        console.log("WebSocket disconnected");
    };
    
    setWebSocket(socket);
    
    return () => {
        socket.close();
    };
}, [roomId, username]);
```

## 5. 구현 과정 및 주요 코드 설명

### 5.1 백엔드 구현

백엔드는 FastAPI를 사용하여 구현했으며, 주요 코드는 다음과 같습니다:

#### 5.1.1 FastAPI 앱 설정 및 CORS 설정

```python
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 및 템플릿 설정
app.mount("/static", StaticFiles(directory="./www/static"), name="static")
templates = Jinja2Templates(directory="./www")
```

CORS 미들웨어를 설정하여 다른 출처(origin)에서의 요청도 처리할 수 있도록 했습니다. 또한 React로 빌드된 정적 파일을 제공하기 위한 설정도 추가했습니다.

#### 5.1.2 채팅방 데이터 구조

```python
CHAT_ROOMS = {
    "room1": {"name": "일반 대화", "users": set(), "connections": {}},
    "room2": {"name": "기술 토론", "users": set(), "connections": {}},
    "room3": {"name": "취미 공유", "users": set(), "connections": {}},
    "room4": {"name": "음악 & 영화", "users": set(), "connections": {}}
}
```

채팅방 정보는 인메모리 딕셔너리로 관리하며, 각 채팅방마다 이름, 참여자 집합, WebSocket 연결을 저장합니다.

#### 5.1.3 API 엔드포인트

```python
@app.get("/api/rooms")
async def get_rooms():
    rooms = [
        {"id": room_id, "name": room_info["name"], "users_count": len(room_info["users"])}
        for room_id, room_info in CHAT_ROOMS.items()
    ]
    return {"rooms": rooms}
```

채팅방 목록을 반환하는 API 엔드포인트로, 각 채팅방의 ID, 이름, 참여자 수를 제공합니다.

### 5.2 프론트엔드 구현

프론트엔드는 React.js를 사용하여 구현했으며, 주요 컴포넌트는 다음과 같습니다:

#### 5.2.1 RoomList 컴포넌트

채팅방 목록을 표시하고, 사용자가 채팅방에 참여할 수 있는 인터페이스를 제공합니다.

```javascript
const RoomList = ({ onJoinRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [username, setUsername] = useState("");
  const [showUsernameForm, setShowUsernameForm] = useState(false);

  useEffect(() => {
    fetch("/api/rooms")
      .then(response => response.json())
      .then(data => setRooms(data.rooms))
      .catch(error => console.error("Error fetching rooms:", error));
  }, []);

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
            onClick={() => {
              setSelectedRoom(room.id);
              setShowUsernameForm(true);
            }}
          >
            참여
          </button>
        </div>
      ))}
      
      {showUsernameForm && (
        <form
          className="username-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (username.trim() && selectedRoom) {
              onJoinRoom(selectedRoom, username);
            }
          }}
        >
          <input
            type="text"
            className="username-input"
            placeholder="대화명을 입력하세요"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button type="submit" className="submit-btn">
            참여하기
          </button>
        </form>
      )}
    </div>
  );
};
```

#### 5.2.2 ChatRoom 컴포넌트

채팅 인터페이스를 제공하며, WebSocket을 통한 메시지 송수신을 담당합니다.

```javascript
const ChatRoom = ({ roomId, username, roomName, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [webSocket, setWebSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${host}/ws/${roomId}/${username}`);
    
    socket.onopen = () => {
      console.log("WebSocket connected");
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(msgs => [...msgs, data]);
    };
    
    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    setWebSocket(socket);
    
    return () => {
      socket.close();
    };
  }, [roomId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>{roomName}</h2>
        <button className="back-btn" onClick={onLeave}>
          나가기
        </button>
      </div>
      <div className="messages">
        {messages.map((msg, index) => {
          const messageClass = 
            msg.sender === "시스템"
              ? "message system"
              : msg.sender === username
              ? "message sent"
              : "message received";
              
          return (
            <div key={index} className={messageClass}>
              {msg.sender !== "시스템" && (
                <div className="sender">{msg.sender}</div>
              )}
              <div>{msg.message}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="message-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (messageInput.trim() && webSocket) {
            webSocket.send(messageInput);
            setMessageInput("");
          }
        }}
      >
        <input
          type="text"
          className="message-input"
          placeholder="메시지를 입력하세요..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
        />
        <button type="submit" className="send-btn">
          전송
        </button>
      </form>
    </div>
  );
};
```

### 5.3 외부 접근을 위한 ngrok 설정

로컬 환경에서 개발된 애플리케이션을 외부에서 접근할 수 있도록 ngrok를 활용했습니다:

```python
# ngrok_setup.py
import subprocess
import time
from pyngrok import ngrok
import os

def setup_ngrok(auth_token):
    ngrok.set_auth_token(auth_token)
    
    # ngrok 터널 생성
    http_tunnel = ngrok.connect(3000)
    public_url = http_tunnel.public_url
    print(f"\n* ngrok 터널이 생성되었습니다: {public_url}")
    print("* 이 URL을 통해 외부에서 채팅 애플리케이션에 접속할 수 있습니다.\n")
    
    return public_url
```

이 스크립트는 사용자가 제공한 ngrok 인증 토큰을 사용하여 로컬 서버(포트 3000)를 인터넷에 노출시키는 터널을 생성합니다.

## 6. 해결 과정에서 발생한 문제점과 해결 방법

### 6.1 WebSocket 연결 관리 문제

**문제**: WebSocket 연결이 종료된 후에도 사용자가 채팅방에 남아있는 문제가 발생했습니다.

**해결**: `WebSocketDisconnect` 예외를 적절히 처리하고 `disconnect` 메서드에서 관련 데이터 구조를 모두 정리하도록 했습니다.

```python
try:
    while True:
        data = await websocket.receive_text()
        await manager.broadcast(data, room_id, username)
except WebSocketDisconnect:
    manager.disconnect(room_id, username)
    leave_message = f"{username}님이 퇴장했습니다."
    await manager.broadcast(leave_message, room_id, "시스템")
```

### 6.2 프론트엔드와 백엔드 통합 문제

**문제**: 개발 환경에서는 프론트엔드와 백엔드가 서로 다른 포트에서 실행되어 CORS 문제가 발생했습니다.

**해결**: 
1. 백엔드에 CORS 미들웨어를 적용하여 프론트엔드의 요청을 허용했습니다.
2. 빌드된 프론트엔드 파일을 백엔드에서 제공하도록 설정하여 동일 출처에서 동작하도록 했습니다.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="./www/static"), name="static")
```

### 6.3 WebSocket URL 구성 문제

**문제**: HTTPS/WSS 프로토콜을 사용할 때 WebSocket 연결이 실패하는 문제가 있었습니다.

**해결**: 현재 페이지의 프로토콜을 확인하여 적절한 WebSocket 프로토콜(ws 또는 wss)을 사용하도록 코드를 수정했습니다.

```javascript
const host = window.location.host;
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(`${protocol}//${host}/ws/${roomId}/${username}`);
```

### 6.4 메시지 스크롤 관리 문제

**문제**: 새로운 메시지가 추가될 때 스크롤이 자동으로 내려가지 않아 사용자 경험이 저하되었습니다.

**해결**: React의 `useEffect`와 `useRef`를 활용하여 새 메시지가 추가될 때마다 스크롤을 자동으로 아래로 이동하도록 구현했습니다.

```javascript
const messagesEndRef = useRef(null);

useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

// JSX 부분
<div className="messages">
    {/* 메시지 목록 */}
    <div ref={messagesEndRef} />
</div>
```

## 7. 습득한 기술 및 인사이트

### 7.1 비동기 통신의 이해

이 프로젝트를 통해 동기식 HTTP 통신과 비동기식 WebSocket 통신의 차이점과 각각의 장단점을 깊이 이해할 수 있었습니다. 특히 실시간 애플리케이션에서 WebSocket의 효율성과 성능 이점을 경험했습니다.

### 7.2 FastAPI의 비동기 처리

FastAPI의 비동기 처리 방식과 `async/await` 패턴을 실제 프로젝트에 적용함으로써, 효율적인 I/O 바운드 작업 처리 방법을 습득했습니다. 이는 다수의 동시 연결을 처리해야 하는 채팅 애플리케이션에서 매우 중요한 부분이었습니다.

### 7.3 React의 상태 관리

복잡한 UI 상태를 관리하고 WebSocket을 통한 실시간 데이터 업데이트를 처리하는 과정에서 React의 상태 관리와 사이드 이펙트 처리에 대한 이해도가 크게 향상되었습니다.

### 7.4 전체 애플리케이션 아키텍처 설계

프론트엔드와 백엔드를 포함한 전체 애플리케이션 아키텍처를 설계하고 구현하면서, 모듈화된 코드 작성과 각 컴포넌트 간의 효율적인 통신 방법에 대한 인사이트를 얻었습니다.

## 8. 결론 및 향후 개선 방향

### 8.1 결론

이 프로젝트는 FastAPI와 WebSocket을 활용한 실시간 채팅 애플리케이션의 기본적인 기능을 성공적으로 구현했습니다. WebSocket의 양방향 통신을 통해 HTTP 요청/응답 모델의 한계를 극복하고, 사용자에게 지연 없는 실시간 채팅 경험을 제공할 수 있었습니다.

프로젝트를 통해 비동기 통신, 상태 관리, 그리고 프론트엔드와 백엔드의 통합에 관한 다양한 기술적 도전과제를 해결하며 실질적인 경험을 쌓았습니다.