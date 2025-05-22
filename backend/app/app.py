from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Set
import json
import uvicorn

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

# 채팅방 목록 (시스템에서 제공하는 4개의 채팅방)
CHAT_ROOMS = {
    "room1": {"name": "일반 대화", "users": set(), "connections": {}},
    "room2": {"name": "기술 토론", "users": set(), "connections": {}},
    "room3": {"name": "취미 공유", "users": set(), "connections": {}},
    "room4": {"name": "음악 & 영화", "users": set(), "connections": {}}
}

# 루트 경로 처리
@app.get("/")
async def get_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# 채팅방 목록 API
@app.get("/api/rooms")
async def get_rooms():
    rooms = [
        {"id": room_id, "name": room_info["name"], "users_count": len(room_info["users"])}
        for room_id, room_info in CHAT_ROOMS.items()
    ]
    return {"rooms": rooms}

# 웹소켓 연결 관리자
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

manager = ConnectionManager()

# 웹소켓 엔드포인트
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
