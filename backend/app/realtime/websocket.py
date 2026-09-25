import asyncio
import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> set of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # We can also store user roles or allowed topics here if needed.
        self.user_roles: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        self.user_roles[user_id] = role
        logger.info(f"User {user_id} ({role}) connected to WebSocket. Total clients: {self.get_total_clients()}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.user_roles.pop(user_id, None)
        logger.info(f"User {user_id} disconnected. Total clients: {self.get_total_clients()}")

    def get_total_clients(self) -> int:
        return sum(len(conns) for conns in self.active_connections.values())

    async def broadcast_message(self, channel: str, message: dict):
        """
        Broadcasts a message to appropriate clients.
        For Phase 8, all authenticated users (ADMIN, OPERATOR, VIEWER) are authorized 
        to view events, alerts, and camera health data.
        """
        # Convert to string once
        msg_str = json.dumps(message)
        
        # For each connected user, check permissions if needed, then send
        for user_id, conns in list(self.active_connections.items()):
            role = self.user_roles.get(user_id, "VIEWER")
            
            # (Optional) Here we could filter based on role and channel,
            # but currently everyone can view these topics.
            
            for ws in list(conns):
                try:
                    await ws.send_text(msg_str)
                except Exception as e:
                    logger.debug(f"Failed to send to {user_id}: {e}")
                    self.disconnect(ws, user_id)

manager = ConnectionManager()
