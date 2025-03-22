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
