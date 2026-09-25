import { create } from 'zustand';
import { ConnectionStatus, EventRealtimePayload, AlertRealtimePayload, CameraHealthPayload } from '../realtime/realtimeTypes';

interface RealtimeState {
  status: ConnectionStatus;
  lastSeenAt: string | null;
  liveEvents: EventRealtimePayload[];
  liveAlerts: Record<string, AlertRealtimePayload>;
  cameraHealth: Record<string, CameraHealthPayload>;
  setStatus: (status: ConnectionStatus) => void;
  setLastSeenAt: (timestamp: string) => void;
  addEvent: (event: EventRealtimePayload) => void;
  upsertAlert: (alert: AlertRealtimePayload) => void;
  updateCameraHealth: (health: CameraHealthPayload) => void;
  mergeCatchUp: (events: any[], alerts: any[]) => void;
  reset: () => void;
}

const MAX_LIVE_EVENTS = 200;

export const useRealtimeStore = create<RealtimeState>((set) => ({
  status: 'Disconnected',
  lastSeenAt: null,
  liveEvents: [],
  liveAlerts: {},
  cameraHealth: {},
  
  setStatus: (status) => set({ status }),
  
  setLastSeenAt: (timestamp) => set((state) => {
    if (!state.lastSeenAt || new Date(timestamp) > new Date(state.lastSeenAt)) {
      return { lastSeenAt: timestamp };
    }
    return {};
  }),
  
  addEvent: (event) => set((state) => {
    // Deduplicate by internal_id
    if (state.liveEvents.some(e => e.internal_id === event.internal_id)) return {};
    
    const newEvents = [event, ...state.liveEvents].slice(0, MAX_LIVE_EVENTS);
    return { liveEvents: newEvents };
  }),
  
  upsertAlert: (alert) => set((state) => {
    return {
      liveAlerts: { ...state.liveAlerts, [alert.alert_id]: alert }
    };
  }),
  
  updateCameraHealth: (health) => set((state) => {
    return {
      cameraHealth: { ...state.cameraHealth, [health.camera_id]: health }
    };
  }),

  mergeCatchUp: (events, alerts) => set((state) => {
    // Basic merge strategy
    // We only merge if not already in state
    const mergedEvents = [...state.liveEvents];
    for (const e of events) {
      if (!mergedEvents.some(existing => existing.internal_id === e.id)) {
        mergedEvents.push({
          event_id: e.event_id,
          internal_id: e.id,
          camera_id: e.camera_id,
          timestamp: e.timestamp,
          event_type: e.event_type,
          vehicle_number: e.vehicle_number,
          vehicle_type: e.vehicle_type,
          confidence: e.confidence,
        });
      }
    }
    mergedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const mergedAlerts = { ...state.liveAlerts };
    for (const a of alerts) {
      if (!mergedAlerts[a.id]) {
        mergedAlerts[a.id] = {
          alert_id: a.id,
          camera_id: a.camera_id,
          matched_identifier: a.matched_identifier,
          severity: a.severity,
          status: a.status,
        };
      }
    }
    
    return {
      liveEvents: mergedEvents.slice(0, MAX_LIVE_EVENTS),
      liveAlerts: mergedAlerts,
    };
  }),
  
  reset: () => set({
    status: 'Disconnected',
    lastSeenAt: null,
    liveEvents: [],
    liveAlerts: {},
    cameraHealth: {}
  })
}));
