import {Socket} from "phoenix"

let lobby,
    notification,
    room,
    chatInputEl,
    messagesEl,
    onlineEl

class Chat {
  constructor(el, id) {
    this.id = id

    chatInputEl = el.querySelector(".chat__text-field")
    messagesEl = el.querySelector(".chat__messages")
    onlineEl = el.querySelector(".chat__stats")
  }

  start() {
    this.socket = new Socket("/socket", {params: {id: this.id}})
    this.socket.connect()

    joinLobby(this.socket)
    joinNotification(this.socket)
  }
}

function clearChat() {
  messagesEl.innerHTML = ""
}

function joinLobby(socket) {
  lobby = socket.channel("lobby", {})
  lobby.join()

  systemMessage("Finding a stranger to chat with...")

  lobby.on("join_room", resp => {
    joinRoom(socket, resp.name)
    lobby.leave()
    lobby = undefined
  })
}

function joinNotification(socket) {
  notification = socket.channel("notification", {})
  notification.join()
    .receive("ok", resp => {
      updateOnline(resp.online)
    })

  notification.on("stats", resp => {
    updateOnline(resp.online)
  })
}

function joinRoom(socket, name) {
  systemMessage("You're now chatting with a stranger")
  strangerMessage("Hello stranger", false)
  strangerMessage("Hello stranger", true)

  room = socket.channel(`room:${name}`, {})
  room.join()

  chatInputEl.addEventListener("keypress", ev => {
    if(ev.keyCode === 13) {
      room.push("message", {body: chatInputEl.value})
      chatInputEl.value = ""
    }
  })

  room.on("message", resp => {
    if(resp.sender === socket.params.id) {
      strangerMessage(resp.body, false)
    } else {
      strangerMessage(resp.body, true)
    }
  })

  room.onClose(resp => {
    room = undefined
    chatInputEl.removeEventListener("keypress")
    clearChat()
    systemMessage("Stranger left the chat")
    joinLobby(socket)
  })
}

function newMessage(message, messageClass) {
  messagesEl.innerHTML += `<div class="message ${messageClass}">
<time class="message__time">${new Date().toLocaleTimeString()}</time>
<p class="message__content">${message}</p>
</div>`
  messagesEl.scrollTop = messagesEl.scrollHeight
}

function strangerMessage(message, received) {
  if(received) {
    newMessage(message, "message--received")
  } else {
    newMessage(message, "message--sent")
  }
}

function systemMessage(message) {
  newMessage(message, "message--system")
}

function updateOnline(count) {
  let noun = "stranger"

  if(count !== 1) {
    noun += "s"
  }

  onlineEl.innerHTML = `${count} ${noun} online`
}

export default Chat
