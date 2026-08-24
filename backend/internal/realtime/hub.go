package realtime

import (
	"encoding/json"
	"sync"
)

type Event struct {
	Type    string `json:"type"`
	Room    string `json:"room"`
	User    string `json:"user,omitempty"`
	Message string `json:"message,omitempty"`
	Online  int    `json:"online,omitempty"`
}

type Client struct {
	Room string
	User string
	Send chan []byte
}

type Hub struct {
	mu    sync.RWMutex
	rooms map[string]map[*Client]struct{}
}

func NewHub() *Hub { return &Hub{rooms: make(map[string]map[*Client]struct{})} }

func (h *Hub) Join(client *Client) {
	h.mu.Lock()
	if h.rooms[client.Room] == nil {
		h.rooms[client.Room] = make(map[*Client]struct{})
	}
	h.rooms[client.Room][client] = struct{}{}
	online := len(h.rooms[client.Room])
	h.mu.Unlock()
	h.Broadcast(Event{Type: "presence", Room: client.Room, User: client.User, Online: online})
}

func (h *Hub) Leave(client *Client) {
	h.mu.Lock()
	delete(h.rooms[client.Room], client)
	online := len(h.rooms[client.Room])
	if online == 0 {
		delete(h.rooms, client.Room)
	}
	h.mu.Unlock()
	h.Broadcast(Event{Type: "presence", Room: client.Room, User: client.User, Online: online})
}

func (h *Hub) Broadcast(event Event) {
	payload, _ := json.Marshal(event)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.rooms[event.Room] {
		select {
		case client.Send <- payload:
		default:
		}
	}
}

func (h *Hub) Online(room string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms[room])
}
