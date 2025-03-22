const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');



const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Ở đầu file index.js, thêm:
const path = require('path');

// Thay thế route hiện tại:
app.get('/', (req, res) => {
    // Đọc nội dung HTML
    const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gà Chạy Choảng Nhau</title>
    <style>
        :root {
            --primary-color: #5D5CDE;
            --secondary-color: #ff7700;
            --text-light: #ffffff;
            --text-dark: #333333;
            --bg-light: #ffffff;
            --bg-dark: #181818;
            --success-color: #4CAF50;
            --danger-color: #f44336;
            --warning-color: #ff9800;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Arial', sans-serif;
        }

        body {
            background-color: var(--bg-light);
            color: var(--text-dark);
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        body.dark {
            background-color: var(--bg-dark);
            color: var(--text-light);
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        h1 {
            text-align: center;
            margin-bottom: 20px;
            color: var(--primary-color);
        }

        .game-container {
            position: relative;
            display: none;
        }

        canvas {
            display: block;
            margin: 0 auto;
            border: 3px solid var(--primary-color);
            border-radius: 5px;
            background-color: #87CEEB;
        }

        .controls {
            margin-top: 20px;
            display: flex;
            justify-content: space-around;
        }

        .button {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            background-color: var(--primary-color);
            color: white;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .button:hover {
            background-color: #4949B3;
        }

        .button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }

        .lobby-container {
            text-align: center;
        }

        input {
            padding: 10px;
            border: 2px solid var(--primary-color);
            border-radius: 5px;
            font-size: 16px;
            margin-right: 10px;
            width: 200px;
        }

        .room-list {
            margin-top: 20px;
            border: 2px solid var(--primary-color);
            border-radius: 5px;
            padding: 10px;
            max-height: 300px;
            overflow-y: auto;
        }

        .room-item {
            padding: 10px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .room-item:last-child {
            border-bottom: none;
        }

        .room-players {
            color: var(--secondary-color);
            font-weight: bold;
        }

        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 50px;
        }

        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid var(--primary-color);
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .player-info {
            margin-top: 10px;
            font-size: 18px;
            font-weight: bold;
        }

        .room-info {
            margin-top: 10px;
            font-size: 16px;
        }

        .countdown {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 72px;
            color: white;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            z-index: 2;
            display: none;
        }

        .leaderboard {
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: rgba(255, 255, 255, 0.8);
            padding: 10px;
            border-radius: 5px;
            z-index: 1;
        }

        .leaderboard h3 {
            margin-top: 0;
            margin-bottom: 5px;
        }

        .leaderboard-list {
            list-style-type: none;
            padding: 0;
        }

        .leaderboard-item {
            margin-bottom: 5px;
        }

        .game-end {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 3;
            display: none;
        }

        .winners {
            margin-top: 20px;
        }

        .winner {
            margin-bottom: 10px;
            font-size: 18px;
        }

        .first {
            color: gold;
            font-size: 24px;
        }

        .second {
            color: silver;
            font-size: 20px;
        }

        .third {
            color: #cd7f32;
            font-size: 18px;
        }

        .instructions {
            margin: 20px 0;
            padding: 15px;
            background-color: rgba(93, 92, 222, 0.1);
            border-radius: 5px;
            text-align: left;
        }

        .instructions ul {
            margin-left: 20px;
        }

        .instructions li {
            margin-bottom: 5px;
        }

        .dark .instructions {
            background-color: rgba(93, 92, 222, 0.2);
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }

            canvas {
                width: 100%;
                height: auto;
            }

            input {
                width: 150px;
            }
        }

        .dark-mode-toggle {
            position: absolute;
            top: 20px;
            right: 20px;
            cursor: pointer;
            background: none;
            border: none;
            font-size: 20px;
        }
    </style>
</head>
<body>
    <button class="dark-mode-toggle" id="darkModeToggle">🌙</button>
    <div class="container">
        <h1>Gà Chạy Choảng Nhau</h1>
        
        <div class="lobby-container" id="lobby">
            <div class="instructions">
                <h3>Hướng dẫn chơi:</h3>
                <ul>
                    <li>Nhấn <strong>SPACE</strong> để nhảy và tránh chướng ngại vật</li>
                    <li>Nhấn <strong>E</strong> để ném trứng vào đối thủ</li>
                    <li>Ai về đích trước hoặc sống sót lâu nhất sẽ thắng</li>
                    <li>Cố gắng lọt vào top 3!</li>
                </ul>
            </div>
            <div>
                <input type="text" id="playerName" placeholder="Nhập tên của bạn" maxlength="15">
                <button class="button" id="createRoom">Tạo phòng</button>
                <button class="button" id="refreshRooms">Làm mới</button>
            </div>
            <div class="room-list" id="roomList">
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>

        <div class="game-container" id="gameContainer">
            <div class="countdown" id="countdown">3</div>
            <canvas id="gameCanvas" width="800" height="400"></canvas>
            <div class="room-info" id="roomInfo">Phòng: <span id="roomId">-</span> | Người chơi: <span id="playerCount">0</span>/10</div>
            <div class="player-info" id="playerInfo">Sẵn sàng!</div>
            <div class="controls">
                <button class="button" id="startGame">Bắt đầu</button>
                <button class="button" id="leaveRoom">Rời phòng</button>
            </div>
            <div class="game-end" id="gameEnd">
                <h2>Trận đấu kết thúc!</h2>
                <div class="winners" id="winners">
                    <div class="winner first">🥇 Hạng nhất: -</div>
                    <div class="winner second">🥈 Hạng nhì: -</div>
                    <div class="winner third">🥉 Hạng ba: -</div>
                </div>
                <button class="button" id="backToLobby" style="margin-top: 20px;">Trở về phòng chờ</button>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/socket.io-client@4.5.1/dist/socket.io.min.js"></script>
    <script>
        // Dark Mode Toggle
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark');
            document.getElementById('darkModeToggle').textContent = '☀️';
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            if (event.matches) {
                document.body.classList.add('dark');
                document.getElementById('darkModeToggle').textContent = '☀️';
            } else {
                document.body.classList.remove('dark');
                document.getElementById('darkModeToggle').textContent = '🌙';
            }
        });

        document.getElementById('darkModeToggle').addEventListener('click', () => {
            document.body.classList.toggle('dark');
            document.getElementById('darkModeToggle').textContent = 
                document.body.classList.contains('dark') ? '☀️' : '🌙';
        });

        // Game client code
        const socket = io('/');
        let clientId = null;
        let playerName = '';
        let currentRoom = null;
        let isHost = false;
        let gameStarted = false;
        let isCountingDown = false;
        
        // Game elements
        const gameCanvas = document.getElementById('gameCanvas');
        const ctx = gameCanvas.getContext('2d');
        const lobby = document.getElementById('lobby');
        const gameContainer = document.getElementById('gameContainer');
        const roomList = document.getElementById('roomList');
        const playerNameInput = document.getElementById('playerName');
        const createRoomBtn = document.getElementById('createRoom');
        const refreshRoomsBtn = document.getElementById('refreshRooms');
        const startGameBtn = document.getElementById('startGame');
        const leaveRoomBtn = document.getElementById('leaveRoom');
        const roomIdSpan = document.getElementById('roomId');
        const playerCountSpan = document.getElementById('playerCount');
        const playerInfoDiv = document.getElementById('playerInfo');
        const countdownDiv = document.getElementById('countdown');
        const gameEndDiv = document.getElementById('gameEnd');
        const winnersDiv = document.getElementById('winners');
        const backToLobbyBtn = document.getElementById('backToLobby');

        // Game assets
        const chickenImage = new Image();
        chickenImage.src = 'data:image/png;base64,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';

        const eggImage = new Image();
        eggImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAArElEQVQ4T+3UMQrCQBCF4X+ewYvoLWy9gJ5GPImxt7HzBDbewBPYeQBLC0GEwLIbstEttsib5s3HZGeG8ONRJW/vBjbADBBwAbbAw0tTZRVLXRnoEtgAS+DssQqgvnON0bRSoM5bgHPfIIHal9CxbwkwBGt7GWbCWtthpPKmDuNCLBfmYakwF0uBQzAP+1ZYCvOwPVDVh9KfJVo2BkZd37WBdUQu+r+wBBf9j18JeALwhCgVA17LTAAAAABJRU5ErkJggg==';

        const obstacleImage = new Image();
        obstacleImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAvElEQVRYR+2XsQ3CQAxF7RMwAA0tHQMgGIAJGIESLRtQMQINAzABLUOAAKlHpEiRL7ElfzrJ5dXn8/fpbMdJmviZTOxXCkCZQGUClsC3dkCJe+8FP+UNrllgbNxC+AD2gV3eA8fALBbAI7D1kSN5PwLXIROwrM/eiFdgngJgQ71j+QLuKQDadAfuS0eLlIhHwAr4tCpxCYBtcLUzlQCoPZBi0AXt60HXdUHhLdV6VfoHpRR0a8cCSP6TVoY/S0WNICURoicAAAAASUVORK5CYII=';

        const itemImage = new Image();
        itemImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAvElEQVQ4T+3TMQrCQBCF4X+ewYvoLWy9gJ5GPImxt7HzBDbewBPYeQBLC0GEwLIbstEttsib5s3HZGeG8ONRJW/vBjbADBBwAbbAw0tTZRVLXRnoEtgAS+DssQqgvnON0bRSoM5bgHPfIIHal9CxbwkwBGt7GWbCWtthpPKmDuNCLBfmYakwF0uBQzAP+1ZYCvOwPVDVh9KfJVo2BkZd37WBdUQu+r+wBBf9j18JeALwhCgVA17LTAAAAABJRU5ErkJggg==';

        const finishImage = new Image();
        finishImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAA2ElEQVRoQ+3ZwQrCMBCE4WlP6kG9iE/qY3jxAbx58qBeRKhUKLipmybdSbOHQiksmf8jkNIaA15eQZxfAjGxEqEFAmKxrm/hh2XZZWZmcyRwPcU2s7GH8IQIxJuIJxEqZGY7AOmfPQCxRDyQWyJURoDEUvFAYqlQmRbGlQ2bCJsKlWlh2FTYRNhUqEwL48qGTYRNhcq0MGwqbCJsKlSmhXFlwybCpkJlWpjtACRvUwRCZQSIx0RKKX1jlwcilkYo4oGEEqEgL8QrEj45EWKxk8qTCA14QawUGf8nQlVRKA+zcZEAAAAASUVORK5CYII=';

        // Game objects and state
        let gameLoop = null;
        let players = {};
        let obstacles = [];
        let items = [];
        let eggs = [];
        let gameWidth = gameCanvas.width;
        let gameHeight = gameCanvas.height;
        let groundY = gameHeight - 50;
        let finishLineX = 5000;
        let cameraX = 0;
        let gameSpeed = 5;
        let gravity = 0.5;
        let jumpForce = -12;
        let lastEggTime = 0;
        let eggCooldown = 1000; // 1 second cooldown
        let winners = [];

        // Key states
        const keys = {
            space: false,
            e: false
        };

        // Sound effects
        const jumpSound = new Audio('data:audio/wav;base64,UklGRm4JAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YUoJAACAgICAgICAgICAgICAgICAgICAgICBgH+AgICBgYGAf4B/f4GBgYF/f3+AgICBgH9/f4GBgYF/f3+AgICBgYB/fn+AgYKBgH5+f4GCgYB+fn+BgoKBf35+gIGCgYB+fn+BgoKBf35+gIGCgYB+fn+BgoKBf35+gIGCgYF+fn+BgoKBf35+gIGCgYB+fn+BgoKBgH5+f4GCgYB+fn+BgoKBgH5+f4CBgYGAfn5/gYKCgX9+f4CBgYGAfn6AgYKBgH5+f4GCgoF/fn+AgYGBgH5+f4GCgoF/fn+AgYGBgH5+f4GCgoF/fn+AgYGBgH5+f4GCgoF/fn+AgYGBgH5+f4GCgoF/fn+AgYGBgH5+f4GCgoF/fn+AgYGAgH5+f4GCgoF/fn+AgYGAgH5+f4KCgoF/fn+AgYGAgH5+f4KCgoF/fn+AgYGAgH5+f4KCgoF/fn+AgYGAgH5+f4KCgoF/fn+AgYGAgH5+f4KCgoF/fn+AgYGAgH5+f4KCgoF/fn+AgYGAgH5+f4KCgoF/fn+AgICAgH5+f4KCgoF/fn+AgICAgH5+f4KCgoF/fn+AgICAgH5+f4KCgoF/fn+AgICAgH5+f4KCgoF/fn+AgICAgH5+f4KCgoF/fn+AgICAgH5+f4KCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH5+gIKCgoF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/fn+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgH9/gIGBgYF/f3+AgICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIB/gICBgYGAf39/gICAgIF/gICAgYGAgH9/gICAgIF/gICAgYGAgH9/gICAgIF/gICAgYGAgH9/gICAgIF/gICAgICAgA==');
        const eggSound = new Audio('data:audio/wav;base64,UklGRjwEAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YRgEAACnqqinl5STjoV+e3RmXlZKQTozLigkKSoxMzc5PDk1MC0oJSAcGhYRDgsGAwAAAgEHCQ0SFRseJCksMzs/RUlPU1lbXl9gXltXU05HQTs0LCUeGBEMCQgKDBIYHiQqMDc9Q0hNUVRXV1dYVVJPTEhEQT06NzQzMjIyMjMzMzQzMjAuKyglIR0YEw4JBAAAAAADCAsSFh0gJCcqLjE0ODo8PT8/Pz48Ojo3NTMvLConJCIfHBkWFBMREA8ODg0MDAwMDA0NDQ0ODg4PDw8PDxAPDxAQDxAPDw8PDw8ODg4ODg0NDQ0MDQ4PDxAREhMUFRcYGRobGxsbGhoZGBgWFRQSEA8ODQsKCQcGBQQDAgIBAAACBAcJDA4RExUWGBkbHB0dHRwbGxsaGRgYFxYWFRQUFBQTFBQUFBUVFhYWFhYXFhYXFhYWFhYVFRUUFBQTExMSEhERERAQDw8ODg0NDAsLCgoJCAcGBQUDAwIBAQAAAAEBAQICAwMEBAUFBQYGBgcHCAgJCQoKCwsMDA0NDg4PDxAQEBERERISEhMTExQUFBQVFRUVFhYWFhYXFxcXGBgYGBgYGRkZGRkZGRkaGhoaGhoaGhoaGhoaGhoaGhoaGhkZGRkZGRkZGRgYGBgYGBcXFxcXFhYWFhYVFRUVFBQUFBMTExMSEhIRERERERAPDw8ODg4NDQwMCwsLCgoJCQgIBwcGBgUFBAQDAwICAgAAAAAAAAAAAAAAAQEBAgICAwMEBAQFBQUGBgYHBwcICAgJCQkKCgoLCwsMDAwNDQ0ODg4ODw8PEBAQEBAREBEREhISEhISExMTExMTExMTExQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBMTExMTExMTEhISEhISEhIRERERERERERARDw8PDw8PDg4ODg0NDQ0MDAwMCwsLCwoKCgkJCQgICAcHBwYGBgUFBQQEBAMDAwICAgEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQICAgIDAwMDBAQEBAQFBQUFBQYGBgYGBgcHBwcHBwgICAcHBwgICAcHBwcHBwcHBwcGBgYGBgYGBgUFBQUFBQUEBAQEBAQDAwMDAwIDAgICAgIBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAgIGBwwNERMXGBsdHh8gICAgIB8eHh0bGhgWFRMRDw4LCggGBAMBAAAAAQEDBAYICgsNDxARExMVFRYXFxgYGBgYGBgXFxcWFhUUFBMSERAQDg0MCwkIBwUEAgIAAAAAAAAAAAABAQICAwMEBAUFBgYHBwcICAgJCQkJCQkJCAgICAcHBgYGBQUEBAMDAgIBAQEAAAAA');
        const hitSound = new Audio('data:audio/wav;base64,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');
        const gameOverSound = new Audio('data:audio/wav;base64,UklGRs4MAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YaoMAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAf3hxeH+AfXR1gYuQiHJqcHmDioJtZm11foOFfXBpbnuJjoZ9c293goeIgn10cnaBjpOPg3dvcXiDiIN9dG9yeoeLi4N4cG92fYSKioR9dXN5foSIf3x3dXd8g4eDfXl1eH+Fg39wZ2x6kqOkkHNeV2BwfYB0Uzg9Ums8Gg0JECxTY2tcRzY2QlNcUzgcDxEdKi4uKCEgJC46PTo0Li4wNjs8ODEqKS02PkA9NzEwNDo+PTcwLjA1Oz88NjEuMDY8Pz02MC4wNjw/PjcyLzI3PD89NjEuMDU7Pj02Mi8xNjo9PzgyLjAxNzs9OjQvLjI3Oz07NTAvMTY6PTw1MS8xNjo9OzYxLzE2Ojw8NjEvMDU6PDw2MS8wNTk8PDcyMDA0OTs8NzIwMDQ4Ozw3MjAwNDk7PDcyMDE1OTw8NzIwMTU6PDw2MS8wNDk8PDcyMDE1Ojw7NTAvMDU6PDw3MjAxNTo8OzYwLzA1OTs7NjEvMDU5Ozw3MjAxNTo7OzYxLzA1OTs7NjEvMDU5Ozw3MjAxNTo7OzYxLzA0ODs7NjEvMDQ5Ozw3MjE0ODo7OzYxLzA1OTs7NTAvLzQ5Oz02MS8wNTk7PDcyMTQ5Ozs2MS8wNDk7OzYxLzA0OTs7NjEvMDU5Ozw3MjE1OTs7NjAvLzQ4Ozw3MjE1OTs7NjAvLzQ4Ojw2MS8wNDk7PDcyMTU5Ozw2MS8wNDk6OzYwLzA0OTs8NzIxNTk7OzYwLy80OTo7NjEvMDQ5Ozw3MjE1OTs7NjAvLzQ5Ozs2MS8wNDk7OzYxLzA1OTs8NzIxNTk7OzUwLy80OTs8NzIxNTk7OzYwLy80OTo7NjAvMDQ5Ozw3MjU5Ozs1MC8vNDk7PDcyMTU5Ozs2MC8vNDk6OzYwLzA0OTs8NzI1OTs7NTAvLzQ5Ozw3MjU5Ozs2MC8vNDk6OzUwLy80OTs8NzI1OTs7NTAvLzQ5Ozw3MjU5Ozs1MC8vNDk6OzYwLzA0OTs8NzI1Ojs7NTAvLzQ5Ozw3MjU5Ozs1MC8vNDk6OzUwLy80OTs8NzI1Ojs7NTAvLzQ5Ozs2MDAzOTo7NTAvLzQ5Ozw3MjU5Ozs1MC8vNDk6OzUwLy80OTs8NzI1Ojs7NTAvLzQ5Ozs1MC8vNDk6OzUwLy80OTs8NzI1Ojs7NTAvLzQ5Ozs1MC8vNDk6OzUwLy80OTs8NzI1Ojs7NTAvLzQ5Ozs1MC8vNDk6OzUwLy80OTs8NzI1Ojs7NTAvLzQ5Ozs1MC8vNDk6OzUwLy80OTs8NzI1Ojs7NTAvLzQ5Ozs1MC8vNDk6OzUwLy80OTs8NzI1Ojs7NTAvLzQ5Ozs1MC8vNDk6OzUwLy80OTs8NjE0OTs6OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1MC8vNDk7OzUwLy80OTs7NTAvLzQ5Ozw2MTQ5Ozs7NTAvLzQ5Ozs1MC8vNDk7OzUwLy80OTs8NjE0OTs7OzUwLy80OTs7NTAvLzQ5Ozs1MC8vNDk7PDYxNDk7Ozs1');

        // Initialize socket events
        socket.on('connect', () => {
            clientId = socket.id;
            console.log('Connected to server with ID:', clientId);
            refreshRoomList();
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        socket.on('roomsList', (rooms) => {
            displayRoomsList(rooms);
        });

        socket.on('roomJoined', (data) => {
            currentRoom = data.roomId;
            isHost = data.isHost;
            playerCountSpan.textContent = data.playerCount + '/10';
            roomIdSpan.textContent = currentRoom;
            
            // Show start game button only to host
            startGameBtn.style.display = isHost ? 'block' : 'none';
            
            // Show game container, hide lobby
            lobby.style.display = 'none';
            gameContainer.style.display = 'block';
            gameEndDiv.style.display = 'none';
            
            console.log(`Joined room ${currentRoom} as ${isHost ? 'host' : 'player'}`);
        });

        socket.on('playerJoined', (data) => {
            playerCountSpan.textContent = data.playerCount + '/10';
        });

        socket.on('playerLeft', (data) => {
            playerCountSpan.textContent = data.playerCount + '/10';
        });

        socket.on('gameStarting', () => {
            startCountdown();
        });

        socket.on('gameStarted', (gameData) => {
            gameStarted = true;
            obstacles = gameData.obstacles;
            items = gameData.items;
            finishLineX = gameData.finishLineX;
            resetGame();
            startGameLoop();
        });

        socket.on('gameState', (state) => {
            players = state.players;
            eggs = state.eggs;
        });

        socket.on('playerJump', (playerId) => {
            // Play jump sound if the jump is for local player
            if (playerId === clientId) {
                jumpSound.currentTime = 0;
                jumpSound.play().catch(err => console.log('Audio play error:', err));
            }
        });

        socket.on('playerThrowEgg', (playerId) => {
            // Play egg sound
            eggSound.currentTime = 0;
            eggSound.play().catch(err => console.log('Audio play error:', err));
        });

        socket.on('playerHit', (playerId) => {
            // Play hit sound
            hitSound.currentTime = 0;
            hitSound.play().catch(err => console.log('Audio play error:', err));
        });

        socket.on('gameOver', (finalWinners) => {
            gameStarted = false;
            stopGameLoop();
            winners = finalWinners;
            showGameOver();
            gameOverSound.play().catch(err => console.log('Audio play error:', err));
        });

        // UI Event Listeners
        createRoomBtn.addEventListener('click', () => {
            playerName = playerNameInput.value.trim() || 'Player' + Math.floor(Math.random() * 1000);
            socket.emit('createRoom', { playerName });
        });

        refreshRoomsBtn.addEventListener('click', () => {
            refreshRoomList();
        });

        startGameBtn.addEventListener('click', () => {
            if (isHost) {
                socket.emit('startGame', { roomId: currentRoom });
            }
        });

        leaveRoomBtn.addEventListener('click', () => {
            socket.emit('leaveRoom', { roomId: currentRoom });
            currentRoom = null;
            isHost = false;
            gameStarted = false;
            stopGameLoop();
            
            // Show lobby, hide game container
            lobby.style.display = 'block';
            gameContainer.style.display = 'none';
            
            refreshRoomList();
        });

        backToLobbyBtn.addEventListener('click', () => {
            gameEndDiv.style.display = 'none';
            leaveRoomBtn.click();
        });

        // Key event listeners
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                keys.space = true;
                if (gameStarted && !players[clientId].jumping) {
                    socket.emit('playerJump', { roomId: currentRoom });
                }
            } else if (e.code === 'KeyE') {
                keys.e = true;
                if (gameStarted && Date.now() - lastEggTime > eggCooldown) {
                    socket.emit('playerThrowEgg', { roomId: currentRoom });
                    lastEggTime = Date.now();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                keys.space = false;
            } else if (e.code === 'KeyE') {
                keys.e = false;
            }
        });

        // Game functions
        function refreshRoomList() {
            roomList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
            socket.emit('getRooms');
        }

        function displayRoomsList(rooms) {
            if (rooms.length === 0) {
                roomList.innerHTML = '<div style="text-align: center; padding: 20px;">Không có phòng nào. Hãy tạo phòng mới!</div>';
                return;
            }
            
            roomList.innerHTML = '';
            rooms.forEach(room => {
                const roomItem = document.createElement('div');
                roomItem.className = 'room-item';
                roomItem.innerHTML = `
                    <div>Phòng: ${room.id}</div>
                    <div class="room-players">${room.playerCount}/10 người chơi</div>
                    <button class="button" ${room.playerCount >= 10 ? 'disabled' : ''}>Tham gia</button>
                `;
                
                const joinButton = roomItem.querySelector('button');
                if (room.playerCount < 10) {
                    joinButton.addEventListener('click', () => {
                        playerName = playerNameInput.value.trim() || 'Player' + Math.floor(Math.random() * 1000);
                        socket.emit('joinRoom', { roomId: room.id, playerName });
                    });
                }
                
                roomList.appendChild(roomItem);
            });
        }

        function startCountdown() {
            let count = 3;
            countdownDiv.textContent = count;
            countdownDiv.style.display = 'block';
            isCountingDown = true;
            
            const countdown = setInterval(() => {
                count--;
                if (count > 0) {
                    countdownDiv.textContent = count;
                } else {
                    countdownDiv.textContent = 'GO!';
                    setTimeout(() => {
                        countdownDiv.style.display = 'none';
                        isCountingDown = false;
                    }, 1000);
                    clearInterval(countdown);
                }
            }, 1000);
        }

        function resetGame() {
            cameraX = 0;
        }

        function startGameLoop() {
            if (gameLoop) return;
            gameLoop = setInterval(updateGame, 1000 / 60); // 60 FPS
        }

        function stopGameLoop() {
            if (gameLoop) {
                clearInterval(gameLoop);
                gameLoop = null;
            }
        }

        function updateGame() {
            // Update camera to follow local player
            if (players[clientId]) {
                cameraX = players[clientId].x - gameWidth / 3;
            }
            
            // Clear canvas
            ctx.clearRect(0, 0, gameWidth, gameHeight);
            
            // Draw background (sky)
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(0, 0, gameWidth, gameHeight);
            
            // Draw ground
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, groundY, gameWidth, gameHeight - groundY);
            ctx.fillStyle = '#7CFC00';
            ctx.fillRect(0, groundY, gameWidth, 10);
            
            // Draw finish line
            const finishLineScreenX = finishLineX - cameraX;
            if (finishLineScreenX >= -50 && finishLineScreenX <= gameWidth + 50) {
                ctx.drawImage(finishImage, finishLineScreenX - 20, groundY - 50, 40, 50);
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(finishLineScreenX, 0, 5, groundY);
                ctx.font = '20px Arial';
                ctx.fillStyle = '#FF0000';
                ctx.fillText('FINISH', finishLineScreenX - 30, groundY - 60);
            }
            
            // Draw obstacles
            obstacles.forEach(obstacle => {
                const obstacleScreenX = obstacle.x - cameraX;
                if (obstacleScreenX >= -50 && obstacleScreenX <= gameWidth + 50) {
                    ctx.drawImage(obstacleImage, obstacleScreenX - 20, groundY - obstacle.height, obstacle.width, obstacle.height);
                }
            });
            
            // Draw items
            items.forEach(item => {
                const itemScreenX = item.x - cameraX;
                if (itemScreenX >= -20 && itemScreenX <= gameWidth + 20 && !item.collected) {
                    ctx.drawImage(itemImage, itemScreenX - 10, item.y - 10, 20, 20);
                }
            });
            
            // Draw eggs
            eggs.forEach(egg => {
                const eggScreenX = egg.x - cameraX;
                if (eggScreenX >= -20 && eggScreenX <= gameWidth + 20) {
                    ctx.drawImage(eggImage, eggScreenX - 10, egg.y - 10, 20, 20);
                }
            });
            
            // Draw players
            const playersList = Object.entries(players).sort((a, b) => a[1].x - b[1].x);
            playersList.forEach(([id, player]) => {
                const playerScreenX = player.x - cameraX;
                if (playerScreenX >= -40 && playerScreenX <= gameWidth + 40 && !player.dead) {
                    // Draw player (chicken)
                    ctx.drawImage(chickenImage, playerScreenX - 20, player.y - 40, 40, 40);
                    
                    // Draw player name
                    ctx.font = '12px Arial';
                    ctx.fillStyle = id === clientId ? '#FF0000' : '#000000';
                    ctx.textAlign = 'center';
                    ctx.fillText(player.name, playerScreenX, player.y - 45);
                }
            });
            
            // Draw race progress at the top
            drawRaceProgress();
        }

        function drawRaceProgress() {
            // Draw progress bar background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(10, 10, gameWidth - 20, 20);
            
            // Draw player positions on progress bar
            Object.entries(players).forEach(([id, player]) => {
                if (!player.dead) {
                    const progressRatio = Math.min(player.x / finishLineX, 1);
                    const progressX = 10 + (gameWidth - 20) * progressRatio;
                    
                    // Draw player marker
                    ctx.fillStyle = id === clientId ? '#FF0000' : '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(progressX, 20, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            // Draw finish line marker
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(gameWidth - 20, 10, 2, 20);
        }

        function showGameOver() {
            gameEndDiv.style.display = 'block';
            
            // Display winners
            const winnersContainer = document.getElementById('winners');
            winnersContainer.innerHTML = '';
            
            if (winners.length > 0) {
                // First place
                const first = document.createElement('div');
                first.className = 'winner first';
                first.textContent = `🥇 Hạng nhất: ${winners[0].name}`;
                winnersContainer.appendChild(first);
                
                // Second place
                const second = document.createElement('div');
                second.className = 'winner second';
                second.textContent = winners.length > 1 ? `🥈 Hạng nhì: ${winners[1].name}` : '🥈 Hạng nhì: -';
                winnersContainer.appendChild(second);
                
                // Third place
                const third = document.createElement('div');
                third.className = 'winner third';
                third.textContent = winners.length > 2 ? `🥉 Hạng ba: ${winners[2].name}` : '🥉 Hạng ba: -';
                winnersContainer.appendChild(third);
            } else {
                winnersContainer.innerHTML = '<div>Không có người chiến thắng!</div>';
            }
        }

        // Mobile controls for touch devices
        gameCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameStarted && players[clientId] && !players[clientId].jumping) {
                socket.emit('playerJump', { roomId: currentRoom });
            }
        });

        document.getElementById('gameContainer').addEventListener('click', (e) => {
            if (!e.target.matches('button') && gameStarted && Date.now() - lastEggTime > eggCooldown) {
                socket.emit('playerThrowEgg', { roomId: currentRoom });
                lastEggTime = Date.now();
            }
        });
    </script>
</body>
</html>
    `;
    res.send(htmlContent);
});

// Game settings
const MAX_PLAYERS_PER_ROOM = 10;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const GROUND_Y = GAME_HEIGHT - 50;
const FINISH_LINE_X = 5000;
const GAME_SPEED = 5;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const OBSTACLE_COUNT = 30;
const ITEM_COUNT = 20;

// Store rooms and game states
const rooms = {};

// Server tick rate (times per second)
const TICK_RATE = 30;

// Helper functions
function generateObstacles() {
    const obstacles = [];
    // Ensure no obstacles at the start
    const minX = 400;
    const maxX = FINISH_LINE_X - 200;
    
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
        const x = minX + Math.random() * (maxX - minX);
        const width = 30 + Math.random() * 20;
        const height = 30 + Math.random() * 50;
        obstacles.push({ x, width, height });
    }
    
    // Sort obstacles by x position
    return obstacles.sort((a, b) => a.x - b.x);
}

function generateItems() {
    const items = [];
    const minX = 300;
    const maxX = FINISH_LINE_X - 100;
    
    for (let i = 0; i < ITEM_COUNT; i++) {
        const x = minX + Math.random() * (maxX - minX);
        const y = GROUND_Y - 50 - Math.random() * 100;
        items.push({ x, y, collected: false });
    }
    
    return items;
}

function createNewPlayer(id, name) {
    return {
        id,
        name,
        x: 100,
        y: GROUND_Y,
        velocityY: 0,
        jumping: false,
        dead: false,
        score: 0,
        finished: false
    };
}

function createNewRoom(id, hostId) {
    return {
        id,
        hostId,
        players: {},
        playerCount: 0,
        gameStarted: false,
        obstacles: [],
        items: [],
        eggs: [],
        winners: [],
        lastUpdateTime: Date.now(),
        finishLineX: FINISH_LINE_X
    };
}

// Socket connection and game logic
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Get available rooms
    socket.on('getRooms', () => {
        const roomsList = Object.values(rooms).map(room => ({
            id: room.id,
            playerCount: room.playerCount,
            gameStarted: room.gameStarted
        }));
        
        socket.emit('roomsList', roomsList);
    });
    
    // Create a new room
    socket.on('createRoom', (data) => {
        const roomId = 'room_' + Date.now().toString().slice(-6);
        const playerName = data.playerName || 'Player';
        
        rooms[roomId] = createNewRoom(roomId, socket.id);
        rooms[roomId].players[socket.id] = createNewPlayer(socket.id, playerName);
        rooms[roomId].playerCount = 1;
        
        socket.join(roomId);
        socket.emit('roomJoined', { 
            roomId, 
            isHost: true,
            playerCount: rooms[roomId].playerCount
        });
        
        // Broadcast updated room list
        io.emit('roomsUpdated');
    });
    
    // Join an existing room
    socket.on('joinRoom', (data) => {
        const { roomId, playerName } = data;
        
        if (!rooms[roomId]) {
            socket.emit('error', { message: 'Room does not exist' });
            return;
        }
        
        if (rooms[roomId].gameStarted) {
            socket.emit('error', { message: 'Game already started' });
            return;
        }
        
        if (rooms[roomId].playerCount >= MAX_PLAYERS_PER_ROOM) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }
        
        rooms[roomId].players[socket.id] = createNewPlayer(socket.id, playerName || 'Player');
        rooms[roomId].playerCount++;
        
        socket.join(roomId);
        socket.emit('roomJoined', { 
            roomId, 
            isHost: socket.id === rooms[roomId].hostId,
            playerCount: rooms[roomId].playerCount
        });
        
        // Notify other players in the room
        socket.to(roomId).emit('playerJoined', { 
            playerCount: rooms[roomId].playerCount 
        });
        
        // Broadcast updated room list
        io.emit('roomsUpdated');
    });
    
    // Leave a room
    socket.on('leaveRoom', (data) => {
        const { roomId } = data;
        
        if (!rooms[roomId]) return;
        
        socket.leave(roomId);
        
        // Remove player from the room
        if (rooms[roomId].players[socket.id]) {
            delete rooms[roomId].players[socket.id];
            rooms[roomId].playerCount--;
            
            // If the host leaves, assign a new host or delete the room
            if (socket.id === rooms[roomId].hostId) {
                const remainingPlayers = Object.keys(rooms[roomId].players);
                
                if (remainingPlayers.length > 0) {
                    rooms[roomId].hostId = remainingPlayers[0];
                    // Notify new host
                    io.to(remainingPlayers[0]).emit('roomJoined', { 
                        roomId, 
                        isHost: true,
                        playerCount: rooms[roomId].playerCount
                    });
                } else {
                    // Delete empty room
                    delete rooms[roomId];
                    io.emit('roomsUpdated');
                    return;
                }
            }
            
            // Notify other players in the room
            socket.to(roomId).emit('playerLeft', { 
                playerCount: rooms[roomId].playerCount 
            });
            
            // Broadcast updated room list
            io.emit('roomsUpdated');
        }
    });
    
    // Start game
    socket.on('startGame', (data) => {
        const { roomId } = data;
        
        if (!rooms[roomId] || socket.id !== rooms[roomId].hostId) return;
        
        // Generate obstacles and items
        rooms[roomId].obstacles = generateObstacles();
        rooms[roomId].items = generateItems();
        rooms[roomId].gameStarted = true;
        rooms[roomId].eggs = [];
        rooms[roomId].winners = [];
        
        // Reset player positions
        Object.values(rooms[roomId].players).forEach(player => {
            player.x = 100;
            player.y = GROUND_Y;
            player.velocityY = 0;
            player.jumping = false;
            player.dead = false;
            player.score = 0;
            player.finished = false;
        });
        
        // Notify all players in the room
        io.to(roomId).emit('gameStarting');
        
        // Start the game after countdown
        setTimeout(() => {
            io.to(roomId).emit('gameStarted', {
                obstacles: rooms[roomId].obstacles,
                items: rooms[roomId].items,
                finishLineX: rooms[roomId].finishLineX
            });
            
            // Start game loop for this room
            startGameLoop(roomId);
        }, 4000);
    });
    
    // Player jump
    socket.on('playerJump', (data) => {
        const { roomId } = data;
        
        if (!rooms[roomId] || !rooms[roomId].gameStarted) return;
        
        const player = rooms[roomId].players[socket.id];
        if (player && !player.jumping && !player.dead) {
            player.velocityY = JUMP_FORCE;
            player.jumping = true;
            
            // Notify all players about the jump
            io.to(roomId).emit('playerJump', socket.id);
        }
    });
    
    // Player throw egg
    socket.on('playerThrowEgg', (data) => {
        const { roomId } = data;
        
        if (!rooms[roomId] || !rooms[roomId].gameStarted) return;
        
        const player = rooms[roomId].players[socket.id];
        if (player && !player.dead) {
            // Create new egg
            rooms[roomId].eggs.push({
                x: player.x + 30,
                y: player.y - 20,
                velocityX: 10,
                velocityY: -2,
                ownerId: socket.id
            });
            
            // Notify all players about the egg throw
            io.to(roomId).emit('playerThrowEgg', socket.id);
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Handle player leaving all rooms they're in
        Object.keys(rooms).forEach(roomId => {
            if (rooms[roomId].players[socket.id]) {
                // Remove player from the room
                delete rooms[roomId].players[socket.id];
                rooms[roomId].playerCount--;
                
                // If the host leaves, assign a new host or delete the room
                if (socket.id === rooms[roomId].hostId) {
                    const remainingPlayers = Object.keys(rooms[roomId].players);
                    
                    if (remainingPlayers.length > 0) {
                        rooms[roomId].hostId = remainingPlayers[0];
                        // Notify new host
                        io.to(remainingPlayers[0]).emit('roomJoined', { 
                            roomId, 
                            isHost: true,
                            playerCount: rooms[roomId].playerCount
                        });
                    } else {
                        // Delete empty room
                        delete rooms[roomId];
                        return;
                    }
                }
                
                // Notify other players in the room
                io.to(roomId).emit('playerLeft', { 
                    playerCount: rooms[roomId].playerCount 
                });
            }
        });
        
        // Clean up empty rooms
        Object.keys(rooms).forEach(roomId => {
            if (rooms[roomId].playerCount === 0) {
                delete rooms[roomId];
            }
        });
        
        // Broadcast updated room list
        io.emit('roomsUpdated');
    });
});

// Game loop for each room
function startGameLoop(roomId) {
    if (!rooms[roomId]) return;
    
    const gameLoopInterval = setInterval(() => {
        if (!rooms[roomId] || !rooms[roomId].gameStarted) {
            clearInterval(gameLoopInterval);
            return;
        }
        
        const room = rooms[roomId];
        const now = Date.now();
        const deltaTime = (now - room.lastUpdateTime) / (1000 / TICK_RATE);
        room.lastUpdateTime = now;
        
        // Update all players
        Object.values(room.players).forEach(player => {
            if (player.dead || player.finished) return;
            
            // Apply gravity
            if (player.jumping) {
                player.velocityY += GRAVITY * deltaTime;
                player.y += player.velocityY * deltaTime;
                
                // Check if player landed
                if (player.y >= GROUND_Y) {
                    player.y = GROUND_Y;
                    player.velocityY = 0;
                    player.jumping = false;
                }
            }
            
            // Move forward
            player.x += GAME_SPEED * deltaTime;
            
            // Check collision with obstacles
            room.obstacles.forEach(obstacle => {
                if (
                    player.x + 15 > obstacle.x - obstacle.width / 2 && 
                    player.x - 15 < obstacle.x + obstacle.width / 2 && 
                    player.y >= GROUND_Y - obstacle.height
                ) {
                    player.dead = true;
                }
            });
            
            // Check collision with items
            room.items.forEach(item => {
                if (
                    !item.collected && 
                    Math.abs(player.x - item.x) < 20 && 
                    Math.abs(player.y - item.y) < 20
                ) {
                    item.collected = true;
                    player.score += 10;
                }
            });
            
            // Check if player reached finish line
            if (player.x >= room.finishLineX && !player.finished) {
                player.finished = true;
                room.winners.push({ id: player.id, name: player.name });
                
                // Check if game is over
                checkGameOver(roomId);
            }
        });
        
        // Update eggs
        room.eggs.forEach((egg, index) => {
            egg.x += egg.velocityX * deltaTime;
            egg.y += egg.velocityY * deltaTime;
            egg.velocityY += GRAVITY * 0.5 * deltaTime;
            
            // Check if egg is out of bounds
            if (egg.x > FINISH_LINE_X || egg.y > GROUND_Y) {
                room.eggs.splice(index, 1);
                return;
            }
            
            // Check collision with players
            Object.values(room.players).forEach(player => {
                if (
                    player.id !== egg.ownerId && 
                    !player.dead && 
                    Math.abs(player.x - egg.x) < 20 && 
                    Math.abs(player.y - egg.y) < 20
                ) {
                    // Hit player with egg
                    room.eggs.splice(index, 1);
                    player.velocityY = -8; // Knock them up a bit
                    player.jumping = true;
                    
                    // Notify all players about the hit
                    io.to(roomId).emit('playerHit', player.id);
                }
            });
        });
        
        // Send game state to all players
        io.to(roomId).emit('gameState', {
            players: room.players,
            eggs: room.eggs
        });
        
        // Check if all players are dead or finished
        let allPlayersDeadOrFinished = true;
        Object.values(room.players).forEach(player => {
            if (!player.dead && !player.finished) {
                allPlayersDeadOrFinished = false;
            }
        });
        
        if (allPlayersDeadOrFinished) {
            checkGameOver(roomId);
        }
        
    }, 1000 / TICK_RATE);
}

function checkGameOver(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    
    // Check if the game should end
    let activePlayers = 0;
    Object.values(room.players).forEach(player => {
        if (!player.dead && !player.finished) {
            activePlayers++;
        }
    });
    
    // If no active players or at least one winner, end the game
    if (activePlayers === 0 || room.winners.length > 0) {
        // Make sure we have all potential winners
        Object.values(room.players).forEach(player => {
            if (player.finished && !room.winners.some(w => w.id === player.id)) {
                room.winners.push({ id: player.id, name: player.name });
            }
        });
        
        // Add players who didn't finish but didn't die
        Object.values(room.players).forEach(player => {
            if (!player.dead && !player.finished) {
                player.finished = true;
                room.winners.push({ id: player.id, name: player.name });
            }
        });
        
        // Sort winners by who finished first
        room.gameStarted = false;
        
        // Send game over event with winners
        io.to(roomId).emit('gameOver', room.winners);
    }
}

// Set up Express routes
app.get('/', (req, res) => {
    res.send('Chicken Race Game Server is running!');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
