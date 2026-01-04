class OthelloGame {
    constructor() {
        this.board = Array(8).fill().map(() => Array(8).fill(0));
        this.currentPlayer = 1; // 1: 黒(プレイヤー), -1: 白(AI)
        this.gameOver = false;
        this.aiTurnCount = 0; // AIのターン数をカウント
        this.hasShownLosingAnimation = false; // 劣勢アニメーション表示フラグ
        this.hasShownEndgameAnimation = false; // 終盤アニメーション表示フラグ
        this.isProcessingPass = false; // パス処理中フラグ
        
        // アニメーション完了後にゲームを初期化
        this.startGameAnimation();
    }

    startGameAnimation() {
        const animationElement = document.getElementById('start-animation');
        
        // 2.5秒後（アニメーション完了後）にゲームを開始
        setTimeout(() => {
            animationElement.classList.add('hide');
            
            // フェードアウト完了後にアニメーション要素を削除してゲーム開始
            setTimeout(() => {
                animationElement.remove();
                this.initializeGame();
            }, 500);
        }, 2500);
    }

    initializeGame() {
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

    updateBoardUIWithAnimation(moveResult, isAIMove = false) {
        if (!moveResult) {
            this.updateBoardUI();
            return;
        }

        const { newPiece, flippedPieces } = moveResult;
        const [newRow, newCol] = newPiece;

        // AIの手の場合、セルをハイライト
        if (isAIMove) {
            const aiMoveCell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
            if (aiMoveCell) {
                aiMoveCell.classList.add('ai-move');
                // 2秒後にハイライトを削除
                setTimeout(() => {
                    aiMoveCell.classList.remove('ai-move');
                }, 2000);
            }
        }

        // まず全体のUIを更新
        this.updateBoardUI();

        // 新しく置かれたコマにアニメーションを追加
        const newPieceCell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
        if (newPieceCell) {
            const piece = newPieceCell.querySelector('.piece');
            if (piece) {
                piece.classList.add('new-piece');
                // アニメーション完了後にクラスを削除
                setTimeout(() => {
                    piece.classList.remove('new-piece');
                }, 400);
            }
        }

        // 裏返されたコマにアニメーションを追加（少し遅延させて）
        setTimeout(() => {
            flippedPieces.forEach(([row, col]) => {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    const piece = cell.querySelector('.piece');
                    if (piece) {
                        piece.classList.add('flipping');
                        // アニメーション完了後にクラスを削除
                        setTimeout(() => {
                            piece.classList.remove('flipping');
                        }, 600);
                    }
                }
            });
        }, 200);
    }

    showValidMoves() {
        if (this.gameOver || this.isProcessingPass) return;
        
        const validMoves = this.getValidMoves(this.currentPlayer);
        
        // プレイヤーのターンで有効手がない場合はパス処理
        if (this.currentPlayer === 1 && validMoves.length === 0) {
            // ゲーム終了判定
            if (this.checkGameOver()) {
                this.endGame();
                return;
            }
            this.isProcessingPass = true;
            setTimeout(() => this.checkPlayerCanMove(), 500);
            return;
        }
        
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
        
        const flippedPieces = [];
        
        for (const [dx, dy] of directions) {
            const flipped = this.flipPieces(row, col, dx, dy, player);
            flippedPieces.push(...flipped);
        }
        
        return { newPiece: [row, col], flippedPieces };
    }

    flipPieces(row, col, dx, dy, player) {
        if (!this.checkDirection(row, col, dx, dy, player)) return [];
        
        const flipped = [];
        let x = row + dx;
        let y = col + dy;
        
        while (x >= 0 && x < 8 && y >= 0 && y < 8 && this.board[x][y] === -player) {
            this.board[x][y] = player;
            flipped.push([x, y]);
            x += dx;
            y += dy;
        }
        
        return flipped;
    }

    handleCellClick(row, col) {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        const moveResult = this.makeMove(row, col, 1);
        if (moveResult) {
            this.updateBoardUIWithAnimation(moveResult, false);
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

    checkPlayerCanMove() {
        const validMoves = this.getValidMoves(1);
        if (validMoves.length === 0 && this.currentPlayer === 1 && !this.gameOver) {
            // プレイヤーがパスする場合
            this.showPlayerPassAnimation(() => {
                this.isProcessingPass = false;
                this.currentPlayer = -1;
                this.updateTurnIndicator();
                setTimeout(() => this.makeAIMove(), 500);
            });
            return false;
        }
        this.isProcessingPass = false;
        return true;
    }

    showPlayerPassAnimation(callback) {
        const passAnimationElement = document.getElementById('player-pass-animation');
        if (!passAnimationElement) {
            console.error('Player pass animation element not found');
            callback();
            return;
        }
        
        // アニメーションをリセットして再実行
        const background = passAnimationElement.querySelector('.animation-background');
        const character = passAnimationElement.querySelector('.character-slide');
        
        if (background) {
            background.style.animation = 'none';
            background.offsetHeight; // リフロー強制
            background.style.animation = '';
        }
        if (character) {
            character.style.animation = 'none';
            character.offsetHeight; // リフロー強制
            character.style.animation = '';
        }
        
        passAnimationElement.style.display = 'flex';
        
        // 2.5秒後（アニメーション完了後）にコールバックを実行
        setTimeout(() => {
            passAnimationElement.classList.add('hide');
            
            // フェードアウト完了後にアニメーション要素を非表示にしてコールバック実行
            setTimeout(() => {
                passAnimationElement.style.display = 'none';
                passAnimationElement.classList.remove('hide');
                callback();
            }, 500);
        }, 2500);
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
        
        // AIのターン数を増加
        this.aiTurnCount++;
        
        // 4ターン目の場合、アニメーションを表示
        if (this.aiTurnCount === 4) {
            this.showAIAnimation(() => {
                this.executeAIMove(validMoves);
            });
        } else {
            this.executeAIMove(validMoves);
        }
    }

    showAIAnimation(callback) {
        const aiAnimationElement = document.getElementById('ai-animation');
        aiAnimationElement.style.display = 'flex';
        
        // 2.5秒後（アニメーション完了後）にコールバックを実行
        setTimeout(() => {
            aiAnimationElement.classList.add('hide');
            
            // フェードアウト完了後にアニメーション要素を非表示にしてコールバック実行
            setTimeout(() => {
                aiAnimationElement.style.display = 'none';
                aiAnimationElement.classList.remove('hide');
                callback();
            }, 500);
        }, 2500);
    }

    executeAIMove(validMoves) {
        // 戦略的なAI: 優先順位に基づいて手を選択
        const bestMove = this.getBestAIMove(validMoves);
        
        const moveResult = this.makeMove(bestMove[0], bestMove[1], -1);
        this.updateBoardUIWithAnimation(moveResult, true);
        this.updateScore();
        
        if (this.checkGameOver()) {
            this.endGame();
            return;
        }
        
        this.currentPlayer = 1;
        this.updateTurnIndicator();
        this.showValidMoves();
        
        // プレイヤーがパスする必要があるかチェック
        setTimeout(() => this.checkForPlayerPass(), 100);
    }

    getBestAIMove(validMoves) {
        // 位置の重み付けマップ（角が最高、角の隣が最低）
        const positionWeights = [
            [100, -20,  10,   5,   5,  10, -20, 100],
            [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
            [ 10,  -2,   5,   1,   1,   5,  -2,  10],
            [  5,  -2,   1,   0,   0,   1,  -2,   5],
            [  5,  -2,   1,   0,   0,   1,  -2,   5],
            [ 10,  -2,   5,   1,   1,   5,  -2,  10],
            [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
            [100, -20,  10,   5,   5,  10, -20, 100]
        ];

        // 角が取れる場合は即座に取る
        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        for (const move of validMoves) {
            if (corners.some(corner => corner[0] === move[0] && corner[1] === move[1])) {
                return move;
            }
        }

        // 各手を評価してベストな手を選択
        let bestMove = validMoves[0];
        let bestScore = -Infinity;

        for (const move of validMoves) {
            const score = this.evaluateMove(move[0], move[1], positionWeights);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    evaluateMove(row, col, positionWeights) {
        // 位置の重み
        let score = positionWeights[row][col];
        
        // 取れる石の数
        const flips = this.countFlips(row, col, -1);
        score += flips * 2;
        
        // 角の隣を取ると、角が空いている場合はペナルティ
        if (this.isNearCorner(row, col)) {
            const nearbyCorner = this.getNearbyCorner(row, col);
            if (nearbyCorner && this.board[nearbyCorner[0]][nearbyCorner[1]] === 0) {
                score -= 50; // 角が空いている場合は大きなペナルティ
            }
        }
        
        // 辺を取ると安定性が増す
        if (this.isEdge(row, col) && !this.isNearCorner(row, col)) {
            score += 10;
        }
        
        // 相手の有効手を減らす手を優先
        const opponentMobilityPenalty = this.simulateMoveAndCountOpponentMoves(row, col);
        score -= opponentMobilityPenalty * 3;
        
        return score;
    }

    getNearbyCorner(row, col) {
        // 角の隣接位置から対応する角を返す
        const cornerMap = {
            '0,1': [0, 0], '1,0': [0, 0], '1,1': [0, 0],
            '0,6': [0, 7], '1,6': [0, 7], '1,7': [0, 7],
            '6,0': [7, 0], '6,1': [7, 0], '7,1': [7, 0],
            '6,6': [7, 7], '6,7': [7, 7], '7,6': [7, 7]
        };
        return cornerMap[`${row},${col}`] || null;
    }

    isEdge(row, col) {
        return row === 0 || row === 7 || col === 0 || col === 7;
    }

    simulateMoveAndCountOpponentMoves(row, col) {
        // 手を打った後の相手の有効手数をシミュレート
        const boardCopy = this.board.map(r => [...r]);
        
        // 仮に手を打つ
        this.board[row][col] = -1;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        for (const [dx, dy] of directions) {
            this.simulateFlip(row, col, dx, dy, -1);
        }
        
        // 相手の有効手数をカウント
        const opponentMoves = this.getValidMoves(1).length;
        
        // ボードを元に戻す
        this.board = boardCopy;
        
        return opponentMoves;
    }

    simulateFlip(row, col, dx, dy, player) {
        if (!this.checkDirection(row, col, dx, dy, player)) return [];
        
        const flipped = [];
        let x = row + dx;
        let y = col + dy;
        
        while (x >= 0 && x < 8 && y >= 0 && y < 8 && this.board[x][y] === -player) {
            this.board[x][y] = player;
            flipped.push([x, y]);
            x += dx;
            y += dy;
        }
        
        return flipped;
    }

    isNearCorner(row, col) {
        // 角の隣接位置をチェック
        const dangerousPositions = [
            [0, 1], [1, 0], [1, 1], // 左上角の隣
            [0, 6], [1, 6], [1, 7], // 右上角の隣
            [6, 0], [6, 1], [7, 1], // 左下角の隣
            [6, 6], [6, 7], [7, 6]  // 右下角の隣
        ];
        
        return dangerousPositions.some(pos => pos[0] === row && pos[1] === col);
    }

    getBestMoveByFlips(moves) {
        let bestMove = moves[0];
        let maxFlips = 0;

        for (const move of moves) {
            const flips = this.countFlips(move[0], move[1], -1);
            if (flips > maxFlips) {
                maxFlips = flips;
                bestMove = move;
            }
        }

        return bestMove;
    }

    getWorstMoveByFlips(moves) {
        let worstMove = moves[0];
        let minFlips = Infinity;

        for (const move of moves) {
            const flips = this.countFlips(move[0], move[1], -1);
            if (flips < minFlips) {
                minFlips = flips;
                worstMove = move;
            }
        }

        return worstMove;
    }

    countFlips(row, col, player) {
        let totalFlips = 0;
        
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dx, dy] of directions) {
            totalFlips += this.countFlipsInDirection(row, col, dx, dy, player);
        }
        
        return totalFlips;
    }

    countFlipsInDirection(row, col, dx, dy, player) {
        let x = row + dx;
        let y = col + dy;
        let flips = 0;
        
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            if (this.board[x][y] === 0) return 0;
            if (this.board[x][y] === player) return flips;
            flips++;
            x += dx;
            y += dy;
        }
        
        return 0;
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
        
        // AIが4割以下になった場合の劣勢アニメーション判定
        this.checkAILosingCondition(playerScore, aiScore);
        
        // 残り5駒の終盤アニメーション判定
        this.checkEndgameCondition(playerScore, aiScore);
    }

    checkEndgameCondition(playerScore, aiScore) {
        const totalPieces = playerScore + aiScore;
        const remainingSpaces = 64 - totalPieces;
        
        // 残り5駒で、まだ終盤アニメーションを表示していない場合
        if (remainingSpaces === 5 && !this.hasShownEndgameAnimation) {
            this.hasShownEndgameAnimation = true;
            
            if (aiScore > playerScore) {
                // AIが勝っている場合: guchi_action03.jpg
                this.showEndgameAnimation('winning');
            } else {
                // AIが負けている場合: guchi_action02.jpg
                this.showEndgameAnimation('losing');
            }
        }
    }

    showEndgameAnimation(type) {
        const animationId = type === 'winning' ? 'ai-endgame-winning-animation' : 'ai-endgame-losing-animation';
        const animationElement = document.getElementById(animationId);
        animationElement.style.display = 'flex';
        
        // 2.5秒後（アニメーション完了後）にアニメーション要素を非表示
        setTimeout(() => {
            animationElement.classList.add('hide');
            
            // フェードアウト完了後にアニメーション要素を非表示
            setTimeout(() => {
                animationElement.style.display = 'none';
                animationElement.classList.remove('hide');
            }, 500);
        }, 2500);
    }

    checkAILosingCondition(playerScore, aiScore) {
        const totalPieces = playerScore + aiScore;
        
        // 石が16個以上あり、AIの割合が40%以下で、まだアニメーションを表示していない場合
        if (totalPieces >= 16 && !this.hasShownLosingAnimation) {
            const aiRatio = aiScore / totalPieces;
            if (aiRatio <= 0.4) {
                this.hasShownLosingAnimation = true;
                this.showAILosingAnimation();
            }
        }
    }

    showAILosingAnimation() {
        const aiLosingAnimationElement = document.getElementById('ai-losing-animation');
        aiLosingAnimationElement.style.display = 'flex';
        
        // 2.5秒後（アニメーション完了後）にアニメーション要素を非表示
        setTimeout(() => {
            aiLosingAnimationElement.classList.add('hide');
            
            // フェードアウト完了後にアニメーション要素を非表示
            setTimeout(() => {
                aiLosingAnimationElement.style.display = 'none';
                aiLosingAnimationElement.classList.remove('hide');
            }, 500);
        }, 2500);
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        if (this.currentPlayer === 1) {
            indicator.textContent = '足軽、早よせえ！';
        } else {
            indicator.textContent = '殿がお悩みでござる...';
        }
    }

    checkForPlayerPass() {
        // プレイヤーターンで有効手がない場合の追加チェック
        if (this.currentPlayer === 1 && !this.gameOver && !this.isProcessingPass) {
            const validMoves = this.getValidMoves(1);
            if (validMoves.length === 0) {
                // ゲーム終了判定
                if (this.checkGameOver()) {
                    this.endGame();
                    return;
                }
                this.isProcessingPass = true;
                this.checkPlayerCanMove();
            }
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
            // プレイヤー勝利アニメーションを表示
            this.showPlayerVictoryAnimation();
        } else if (aiScore > playerScore) {
            messageElement.textContent = 'む、無念！切腹でござる...ぐふっ。';
            messageElement.className = 'message lose';
            // AI勝利アニメーションを表示
            this.showAIVictoryAnimation();
        } else {
            messageElement.textContent = '引き分けです！';
            messageElement.className = 'message draw';
        }
        
        document.getElementById('turn-indicator').textContent = 'ゲーム終了';
    }

    showPlayerVictoryAnimation() {
        const victoryAnimationElement = document.getElementById('player-victory-animation');
        if (!victoryAnimationElement) {
            console.error('Player victory animation element not found');
            return;
        }
        
        // アニメーションをリセットして再実行
        const background = victoryAnimationElement.querySelector('.animation-background');
        const character = victoryAnimationElement.querySelector('.character-slide');
        
        if (background) {
            background.style.animation = 'none';
            background.offsetHeight; // リフロー強制
            background.style.animation = '';
        }
        if (character) {
            character.style.animation = 'none';
            character.offsetHeight; // リフロー強制
            character.style.animation = '';
        }
        
        victoryAnimationElement.style.display = 'flex';
        
        // 2.5秒後（アニメーション完了後）にアニメーション要素を非表示
        setTimeout(() => {
            victoryAnimationElement.classList.add('hide');
            
            // フェードアウト完了後にアニメーション要素を非表示
            setTimeout(() => {
                victoryAnimationElement.style.display = 'none';
                victoryAnimationElement.classList.remove('hide');
            }, 500);
        }, 2500);
    }

    showAIVictoryAnimation() {
        const aiVictoryAnimationElement = document.getElementById('ai-victory-animation');
        
        if (!aiVictoryAnimationElement) {
            // フォールバック: 要素を動的に作成
            console.log('AI victory animation: using dynamic fallback');
            this.createAIVictoryAnimation();
            return;
        }
        
        // アニメーションをリセットして再実行
        const background = aiVictoryAnimationElement.querySelector('.ai-animation-background');
        const character = aiVictoryAnimationElement.querySelector('.ai-character-slide');
        
        if (background) {
            background.style.animation = 'none';
            background.offsetHeight; // リフロー強制
            background.style.animation = '';
        }
        if (character) {
            character.style.animation = 'none';
            character.offsetHeight; // リフロー強制
            character.style.animation = '';
        }
        
        aiVictoryAnimationElement.style.display = 'flex';
        
        // 2.5秒後（アニメーション完了後）にアニメーション要素を非表示
        setTimeout(() => {
            aiVictoryAnimationElement.classList.add('hide');
            
            // フェードアウト完了後にアニメーション要素を非表示
            setTimeout(() => {
                aiVictoryAnimationElement.style.display = 'none';
                aiVictoryAnimationElement.classList.remove('hide');
            }, 500);
        }, 2500);
    }

    createAIVictoryAnimation() {
        // 動的にAI勝利アニメーション要素を作成
        const animationDiv = document.createElement('div');
        animationDiv.id = 'ai-victory-animation-dynamic';
        animationDiv.className = 'ai-animation';
        animationDiv.innerHTML = `
            <div class="ai-animation-background"></div>
            <div class="ai-character-slide">
                <img src="images/guchi_action04.jpg" alt="愚痴勝利" class="ai-character-image">
            </div>
        `;
        document.body.insertBefore(animationDiv, document.body.firstChild);
        
        animationDiv.style.display = 'flex';
        
        // 2.5秒後にアニメーション要素を非表示
        setTimeout(() => {
            animationDiv.classList.add('hide');
            setTimeout(() => {
                animationDiv.remove();
            }, 500);
        }, 2500);
    }

    restart() {
        this.board = Array(8).fill().map(() => Array(8).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.aiTurnCount = 0; // AIターン数をリセット
        this.hasShownLosingAnimation = false; // 劣勢アニメーションフラグをリセット
        this.hasShownEndgameAnimation = false; // 終盤アニメーションフラグをリセット
        this.isProcessingPass = false; // パス処理中フラグをリセット
        
        this.initializeBoard();
        this.updateBoardUI();
        this.updateScore();
        this.showValidMoves();
        
        document.getElementById('game-message').textContent = '';
        document.getElementById('game-message').className = 'message';
        document.getElementById('turn-indicator').textContent = '足軽の番でござる';
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new OthelloGame();
});