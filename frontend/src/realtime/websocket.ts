import { useRealtimeStore } from '../stores/realtimeStore';
import { RealtimeEnvelope } from './realtimeTypes';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';

class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;
  private maxDelay = 30000;
  private pingInterval: any = null;
  private batchBuffer: RealtimeEnvelope[] = [];
  private batchTimer: any = null;
  private isIntentionalDisconnect = false;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;
    
    const token = useAuthStore.getState().token;
    if (!token) return;

    this.isIntentionalDisconnect = false;
    useRealtimeStore.getState().setStatus(this.reconnectAttempts === 0 ? 'Connected' : 'Reconnecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend URL
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws?token=${token}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      useRealtimeStore.getState().setStatus('Connected');
      this.startPing();
      this.catchUp();
    };

    this.ws.onmessage = (event) => {
      if (event.data === 'pong') return;
      
      try {
        const message: RealtimeEnvelope = JSON.parse(event.data);
        this.bufferMessage(message);
      } catch (err) {
        console.error('WebSocket message parsing error', err);
      }
    };

    this.ws.onclose = () => {
      this.cleanup();
      if (!this.isIntentionalDisconnect) {
        useRealtimeStore.getState().setStatus('Disconnected');
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Let onclose handle reconnect
    };
  }

  private bufferMessage(message: RealtimeEnvelope) {
    this.batchBuffer.push(message);
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
        this.batchTimer = null;
      }, 250); // 250ms batching window
    }
  }

  private processBatch() {
    const store = useRealtimeStore.getState();
    let hasNewCriticalAlert = false;

    for (const msg of this.batchBuffer) {
      if (msg.timestamp) {
        store.setLastSeenAt(msg.timestamp);
      }
      
      switch (msg.type) {
        case 'event.created':
          store.addEvent(msg.payload);
          break;
        case 'alert.created':
        case 'alert.updated':
          store.upsertAlert(msg.payload);
          if (msg.payload.status === 'new' && msg.payload.severity === 'critical') {
            hasNewCriticalAlert = true;
          }
          break;
        case 'camera.health_changed':
          store.updateCameraHealth(msg.payload);
          break;
      }
    }
    this.batchBuffer = [];

    if (hasNewCriticalAlert) {
      this.playCriticalAlertSound();
    }
  }

  private playCriticalAlertSound() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') return; // Don't try if autoplay is blocked
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (err) {
      console.warn("Could not play alert sound", err);
    }
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 20000);
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    
    const delay = Math.min(this.baseDelay * Math.pow(2, this.reconnectAttempts), this.maxDelay);
    this.reconnectAttempts++;
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private async catchUp() {
    const lastSeen = useRealtimeStore.getState().lastSeenAt;
    if (!lastSeen) return;

    try {
      // In a real app we might fetch from specific catch-up endpoints.
      // Here we just fetch recent items and merge.
      const [eventsRes, alertsRes] = await Promise.all([
        apiClient.get('/events', { params: { page_size: 50 } }),
        apiClient.get('/alerts', { params: { page_size: 50 } })
      ]);
      
      // Filter out events that are older than lastSeen
      const recentEvents = eventsRes.data.items.filter((e: any) => new Date(e.timestamp) > new Date(lastSeen));
      const recentAlerts = alertsRes.data.items.filter((a: any) => new Date(a.created_at) > new Date(lastSeen) || new Date(a.updated_at || a.created_at) > new Date(lastSeen));

      if (recentEvents.length > 0 || recentAlerts.length > 0) {
        useRealtimeStore.getState().mergeCatchUp(recentEvents, recentAlerts);
      }
    } catch (err) {
      console.error('Catch-up failed', err);
    }
  }

  private cleanup() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.batchTimer) clearTimeout(this.batchTimer);
    this.batchBuffer = [];
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useRealtimeStore.getState().reset();
  }
}

export const realtimeClient = new RealtimeClient();
