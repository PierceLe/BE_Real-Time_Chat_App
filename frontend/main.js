'use strict';

const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const messageArea = document.querySelector('#messageArea');
const connectingElement = document.querySelector('.connecting');

let stompClient = null;
let username = null;

// Avatar Colors
const colors = ['#2196F3', '#32c787', '#00BCD4', '#ff5652', '#ffc107', '#ff85af', '#FF9800', '#39bbb0'];

// Connect to WebSocket
function connect(event) {
    event.preventDefault();
    username = document.querySelector('#name').value.trim();

    if (username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('http://localhost:8080/api/v1/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
}

// Handle Connection Success
function onConnected() {
    stompClient.subscribe('/topic/public', onMessageReceived);
    stompClient.send('/app/chat.addUser', {}, JSON.stringify({ sender: username, type: 'JOIN' }));
    connectingElement.classList.add('hidden');
}

// Handle Connection Error
function onError() {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please try again!';
    connectingElement.style.color = 'red';
}

// Send Chat Message
function sendMessage(event) {
    event.preventDefault();
    const messageContent = messageInput.value.trim();

    if (messageContent && stompClient) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT',
        };

        stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
}

// Handle Incoming Messages
function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    const messageElement = document.createElement('li');

    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = `${message.sender} joined the chat!`;
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = `${message.sender} left the chat!`;
    } else {
        messageElement.classList.add('chat-message');

        const avatarElement = document.createElement('i');
        avatarElement.textContent = message.sender[0].toUpperCase();
        avatarElement.style.backgroundColor = getAvatarColor(message.sender);
        messageElement.appendChild(avatarElement);

        const usernameElement = document.createElement('span');
        usernameElement.textContent = message.sender;
        messageElement.appendChild(usernameElement);
    }

    const textElement = document.createElement('p');
    textElement.textContent = message.content;
    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

// Generate Avatar Color
function getAvatarColor(sender) {
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
        hash = 31 * hash + sender.charCodeAt(i);
    }
    return colors[Math.abs(hash % colors.length)];
}

// Event Listeners
usernameForm.addEventListener('submit', connect);
messageForm.addEventListener('submit', sendMessage);