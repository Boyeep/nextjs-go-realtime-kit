package realtime

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/coder/websocket"
)

type Handler struct{ Hub *Hub }

func (h Handler) Connect(w http.ResponseWriter, r *http.Request) {
	room := strings.TrimSpace(r.PathValue("room"))
	user := strings.TrimSpace(r.URL.Query().Get("user"))
	if room == "" || user == "" {
		http.Error(w, "room and user are required", http.StatusBadRequest)
		return
	}
	connection, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
	if err != nil {
		return
	}
	defer connection.CloseNow()
	client := &Client{Room: room, User: user, Send: make(chan []byte, 32)}
	h.Hub.Join(client)
	defer h.Hub.Leave(client)
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	go func() {
		for payload := range client.Send {
			writeCtx, stop := context.WithTimeout(ctx, 5*time.Second)
			err := connection.Write(writeCtx, websocket.MessageText, payload)
			stop()
			if err != nil {
				cancel()
				return
			}
		}
	}()
	for {
		_, payload, err := connection.Read(ctx)
		if err != nil {
			return
		}
		event := Event{Type: "message", Room: room, User: user, Message: string(payload)}
		if strings.HasPrefix(event.Message, "typing:") {
			event.Type = "typing"
			event.Message = strings.TrimPrefix(event.Message, "typing:")
		}
		h.Hub.Broadcast(event)
	}
}

func (h Handler) Room(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"room":   r.PathValue("room"),
		"online": h.Hub.Online(r.PathValue("room")),
	})
}
