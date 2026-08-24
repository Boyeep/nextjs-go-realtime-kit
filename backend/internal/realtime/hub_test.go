package realtime

import "testing"

func TestHubScopesBroadcastsToRoom(t *testing.T) {
	hub := NewHub()
	one := &Client{Room: "alpha", User: "Ada", Send: make(chan []byte, 4)}
	two := &Client{Room: "beta", User: "Lin", Send: make(chan []byte, 4)}
	hub.Join(one)
	hub.Join(two)
	<-one.Send
	<-two.Send
	hub.Broadcast(Event{Type: "message", Room: "alpha", Message: "hello"})
	select {
	case <-one.Send:
	default:
		t.Fatal("room member did not receive event")
	}
	select {
	case <-two.Send:
		t.Fatal("event leaked into another room")
	default:
	}
}
