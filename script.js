class OthelloGame {
    constructor() {
        this.board = Array(8).fill().map(() => Array(8).fill(0));
        this.currentPlayer = 1; // 1: 黒(プレイヤー), -1: 白(AI)
        this.gameOver = false;
        
        this.initializeBoard();
        this.createBoardUI();
        this.updateScore();
        this.showValidMoves();
        
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }

    initializeBoard() {
        // 初期配置
        this.board[3][3] = -1; // 白
        this.board[3][4] = 1;  // 黒
        this.board[4][3] = 1;  // 黒
        this.board[4][4] = -1; // 白
    }

    createBoardUI() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                
                boardElement.appendChild(cell);
            }
        }
        
        this.updateBoardUI();
    }

    updateBoardUI() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.board[row][col];
            
            cell.innerHTML = '';
            cell.classList.remove('valid-move');
            
            if (value !== 0) {
                const piece = document.createElement('div');
                piece.className = `piece ${value === 1 ? 'black' : 'white'}`;
                cell.appendChild(piece);
            }
        });
    }

    showValidMoves() {
        if (this.gameOver) return;
        
        const validMoves = this.getValidMoves(this.currentPlayer);
        
        validMoves.forEach(([row, col]) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('valid-move');
            }
        });
    }

    getValidMoves(player) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(row, col, player)) {
                    moves.push([row, col]);
                }
            }
        }
        
        return moves;
    }

    isValidMove(row, col, player) {
        if (this.board[row][col] !== 0) return false;
        
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dx, dy] of directions) {
            if (this.checkDirection(row, col, dx, dy, player)) {
                return true;
            }
        }
        
        return false;
    }

    checkDirection(row, col, dx, dy, player) {
        let x = row + dx;
        let y = col + dy;
        let hasOpponent = false;
        
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            if (this.board[x][y] === 0) return false;
            if (this.board[x][y] === player) return hasOpponent;
            hasOpponent = true;
            x += dx;
            y += dy;
        }
        
        return false;
    }

    makeMove(row, col, player) {
        if (!this.isValidMove(row, col, player)) return false;
        
        this.board[row][col] = player;
        
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dx, dy] of directions) {
            this.flipPieces(row, col, dx, dy, player);
        }
        
        return true;
    }

    flipPieces(row, col, dx, dy, player) {
        if (!this.checkDirection(row, col, dx, dy, player)) return;
        
        let x = row + dx;
        let y = col + dy;
        
        while (x >= 0 && x < 8 && y >= 0 && y < 8 && this.board[x][y] === -player) {
            this.board[x][y] = player;
            x += dx;
            y += dy;
        }
    }

    handleCellClick(row, col) {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        if (this.makeMove(row, col, 1)) {
            this.updateBoardUI();
            this.updateScore();
            
            if (this.checkGameOver()) {
                this.endGame();
                return;
            }
            
            this.currentPlayer = -1;
            this.updateTurnIndicator();
            
            // AI の手番
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    makeAIMove() {
        if (this.gameOver) return;
        
        const validMoves = this.getValidMoves(-1);
        
        if (validMoves.length === 0) {
            // AI がパスする場合
            this.currentPlayer = 1;
            this.updateTurnIndicator();
            this.showValidMoves();
            return;
        }
        
        // シンプルなAI: ランダムに選択
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        
        this.makeMove(randomMove[0], randomMove[1], -1);
        this.updateBoardUI();
        this.updateScore();
        
        if (this.checkGameOver()) {
            this.endGame();
            return;
        }
        
        this.currentPlayer = 1;
        this.updateTurnIndicator();
        this.showValidMoves();
    }

    updateScore() {
        let playerScore = 0;
        let aiScore = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === 1) playerScore++;
                else if (this.board[row][col] === -1) aiScore++;
            }
        }
        
        document.getElementById('player-score').textContent = playerScore;
        document.getElementById('ai-score').textContent = aiScore;
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        if (this.currentPlayer === 1) {
            indicator.textContent = '足軽、早よせえ！';
        } else {
            indicator.textContent = '殿がお悩みでござる...';
        }
    }

    checkGameOver() {
        const playerMoves = this.getValidMoves(1).length;
        const aiMoves = this.getValidMoves(-1).length;
        
        return playerMoves === 0 && aiMoves === 0;
    }

    endGame() {
        this.gameOver = true;
        
        const playerScore = parseInt(document.getElementById('player-score').textContent);
        const aiScore = parseInt(document.getElementById('ai-score').textContent);
        
        const messageElement = document.getElementById('game-message');
        
        if (playerScore > aiScore) {
            messageElement.textContent = '下剋上達成でござる！';
            messageElement.className = 'message win';
        } else if (aiScore > playerScore) {
            messageElement.textContent = 'む、無念！切腹でござる...ぐふっ。';
            messageElement.className = 'message lose';
        } else {
            messageElement.textContent = '引き分けです！';
            messageElement.className = 'message draw';
        }
        
        document.getElementById('turn-indicator').textContent = 'ゲーム終了';
    }

    restart() {
        this.board = Array(8).fill().map(() => Array(8).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        
        this.initializeBoard();
        this.updateBoardUI();
        this.updateScore();
        this.showValidMoves();
        
        document.getElementById('game-message').textContent = '';
        document.getElementById('game-message').className = 'message';
        document.getElementById('turn-indicator').textContent = 'あなたの番です';
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new OthelloGame();
});