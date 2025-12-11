// Windows 3.1 Program Manager

class ProgramManager {
    constructor() {
        this.zIndex = 100;
        this.currentWindow = null;
        this.minimizedWindows = new Map();
        this.init();
    }

    init() {
        this.setupGroupIcons();
        this.setupProgramIcons();
        this.setupSystemMenu();
        this.setupClickOutside();
        this.setupProgramManagerControls();
        this.setupDesktopIcons();
        this.setupStatusBarControls();
        this.setupDesktopClickDeselect();
        this.updateStatusBar();
        setInterval(() => this.updateStatusBar(), 1000);
    }

    setupDesktopClickDeselect() {
        // Deselect icons when clicking on windows, taskbar, status bar, or empty desktop
        document.addEventListener('click', (e) => {
            // Don't deselect if clicking on an icon itself or its menu
            if (e.target.closest('.desktop-icon') || 
                e.target.closest('.minimized-program-manager') ||
                e.target.closest('#desktop-icon-menu')) {
                return;
            }
            
            // Hide context menu if clicking elsewhere
            this.hideDesktopIconMenu();
            
            // If an icon is in move mode, clicking elsewhere should place it (exit move mode)
            const iconInMoveMode = document.querySelector('.desktop-icon[data-move-mode="true"], .minimized-program-manager[data-move-mode="true"]');
            if (iconInMoveMode) {
                delete iconInMoveMode.dataset.moveMode;
                iconInMoveMode.style.cursor = 'pointer';
                iconInMoveMode.classList.remove('selected');
            }
            
            // Deselect when clicking on windows, taskbar, status bar, or desktop
            if (e.target.closest('.window') || 
                e.target.closest('.desktop-taskbar') || 
                e.target.closest('.desktop-status-bar') ||
                e.target.closest('.program-manager') ||
                e.target.classList.contains('win31-desktop') ||
                e.target.classList.contains('screen-content')) {
                document.querySelectorAll('.desktop-icon, .minimized-program-manager').forEach(i => i.classList.remove('selected'));
            }
        });
    }

    setupStatusBarControls() {
        // Volume control
        const volumeControl = document.getElementById('volume-control');
        const volumeValue = document.getElementById('volume-value');
        let volume = 100;
        let isMuted = false;

        // Create volume dropdown
        const volumeDropdown = document.createElement('div');
        volumeDropdown.className = 'volume-dropdown';
        volumeDropdown.id = 'volume-dropdown';
        volumeDropdown.innerHTML = `
            <div class="volume-slider-container">
                <div class="volume-slider-label">Volume: <span id="volume-display">100%</span></div>
                <input type="range" class="volume-slider" id="volume-slider" min="0" max="100" value="100" />
                <button class="volume-mute-btn" id="volume-mute-btn">Mute</button>
            </div>
        `;
        document.querySelector('.screen-content').appendChild(volumeDropdown);

        const volumeSlider = document.getElementById('volume-slider');
        const volumeDisplay = document.getElementById('volume-display');
        const muteBtn = document.getElementById('volume-mute-btn');

        volumeControl.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('volume-dropdown');
            const rect = volumeControl.getBoundingClientRect();
            const screenContent = document.querySelector('.screen-content');
            const screenRect = screenContent.getBoundingClientRect();
            
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            } else {
                dropdown.style.left = (rect.left - screenRect.left) + 'px';
                dropdown.style.bottom = (screenRect.bottom - rect.top + 4) + 'px';
                dropdown.style.display = 'block';
            }
        });

        volumeSlider.addEventListener('input', (e) => {
            volume = parseInt(e.target.value);
            if (!isMuted) {
                volumeValue.textContent = volume + '%';
                volumeDisplay.textContent = volume + '%';
                volumeControl.querySelector('.status-icon').textContent = volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊';
            }
        });

        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            if (isMuted) {
                volumeValue.textContent = 'Muted';
                volumeDisplay.textContent = 'Muted';
                volumeControl.querySelector('.status-icon').textContent = '🔇';
                muteBtn.textContent = 'Unmute';
            } else {
                volumeValue.textContent = volume + '%';
                volumeDisplay.textContent = volume + '%';
                volumeControl.querySelector('.status-icon').textContent = volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊';
                muteBtn.textContent = 'Mute';
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!volumeControl.contains(e.target) && !volumeDropdown.contains(e.target)) {
                volumeDropdown.style.display = 'none';
            }
        });
    }

    setupDesktopIcons() {
        const aiIcon = document.getElementById('ai-assistant-icon');
        if (aiIcon) {
            // Single click to select and show context menu
            aiIcon.addEventListener('click', (e) => {
                // Don't show menu if in move mode (clicking to place)
                if (aiIcon.dataset.moveMode) {
                    return;
                }
                
                // Only select if we didn't just drag
                if (window.aiIconDragging === true) {
                    window.aiIconDragging = false;
                    return;
                }
                
                // Deselect all desktop icons and minimized program manager
                document.querySelectorAll('.desktop-icon, .minimized-program-manager').forEach(i => i.classList.remove('selected'));
                aiIcon.classList.add('selected');
                
                // Show context menu
                this.showDesktopIconMenu(aiIcon, 'ai-assistant');
                e.stopPropagation();
            });
            
            // Double click to open
            aiIcon.addEventListener('dblclick', () => {
                this.hideDesktopIconMenu();
                this.openAIAssistant();
            });
            
            // Don't setup drag by default - only when Move is selected
        }
        
        // Don't setup drag for minimized Program Manager by default
    }

    setupIconDrag(icon) {
        // Only allow drag if move mode is enabled
        if (!icon.dataset.moveMode) {
            return;
        }
        
        // Make icon follow cursor automatically
        const mousemoveHandler = (e) => {
            if (!icon.dataset.moveMode) {
                document.removeEventListener('mousemove', mousemoveHandler);
                return;
            }
            
            const screenContent = document.querySelector('.screen-content');
            const screenRect = screenContent.getBoundingClientRect();
            
            // Calculate new position - center icon on cursor
            let newLeft = e.clientX - screenRect.left - (icon.offsetWidth / 2);
            let newTop = e.clientY - screenRect.top - (icon.offsetHeight / 2);
            
            // Constrain to screen bounds
            const maxX = screenContent.offsetWidth - icon.offsetWidth;
            const maxY = screenContent.offsetHeight - icon.offsetHeight - 24; // Account for status bar
            
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));
            
            icon.style.left = newLeft + 'px';
            icon.style.top = newTop + 'px';
            icon.style.position = 'absolute';
        };
        
        document.addEventListener('mousemove', mousemoveHandler);
        
        // Click to place (exit move mode) - prevent menu from showing
        const clickHandler = (e) => {
            if (icon.dataset.moveMode) {
                e.stopPropagation();
                e.preventDefault();
                delete icon.dataset.moveMode;
                icon.style.cursor = '';
                icon.classList.remove('selected');
                document.body.classList.remove('move-mode-active');
                document.removeEventListener('mousemove', mousemoveHandler);
                document.removeEventListener('click', clickHandler, true);
                // Clear dragging flag
                if (icon.id === 'ai-assistant-icon') {
                    window.aiIconDragging = false;
                } else if (icon.id === 'program-manager-minimized') {
                    window.pmIconDragging = false;
                }
            }
        };
        
        // Use capture phase to intercept click before it reaches icon handlers
        document.addEventListener('click', clickHandler, true);
    }

    setupMinimizedProgramManagerDrag() {
        // This will be called when Program Manager is minimized
        // We'll set it up in minimizeProgramManager
    }

    openAIAssistant() {
        const aiApp = document.getElementById('ai-assistant-app');
        if (!aiApp) return;

        if (aiApp.style.display === 'none' || !aiApp.style.display) {
            aiApp.style.display = 'flex';
            aiApp.style.left = `${150 + Math.random() * 50}px`;
            aiApp.style.top = `${60 + Math.random() * 50}px`;
            aiApp.style.width = '500px';
            aiApp.style.height = '400px';
            this.setupWindowDrag(aiApp);
            this.setupSingleWindowControls(aiApp);
            
            // Remove from taskbar if it was there
            this.removeFromTaskbar('ai-assistant-app');
            
            // Setup AI assistant functionality
            this.setupAIAssistant();
        }
        
        this.focusWindow(aiApp);
    }

    setupAIAssistant() {
        const aiApp = document.getElementById('ai-assistant-app');
        if (aiApp.dataset.setup) return;
        aiApp.dataset.setup = 'true';

        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send-btn');
        const chatArea = document.getElementById('ai-chat-area');

        const sendMessage = () => {
            const query = input.value.trim();
            if (!query) return;

            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'ai-message ai-user';
            userMsg.innerHTML = `<div class="message-text">${query}</div>`;
            chatArea.appendChild(userMsg);

            // Clear input
            input.value = '';

            // Scroll to bottom
            chatArea.scrollTop = chatArea.scrollHeight;

            // Simulate AI response (retro style)
            setTimeout(() => {
                const aiMsg = document.createElement('div');
                aiMsg.className = 'ai-message ai-assistant';
                const responses = [
                    "That's an interesting question! In the retro computing era, we would have consulted manuals and documentation.",
                    "Processing your request... Please wait while I search through my knowledge base.",
                    "I'm a retro AI assistant from the Windows 3.1 era. My capabilities are limited compared to modern AI, but I'll do my best!",
                    "Let me check my database... Hmm, that's a complex query. Would you like me to search for more information?",
                    "In the classic computing days, we relied on command-line interfaces and text-based systems. Your question reminds me of those times!",
                    "I'm processing your request using vintage algorithms. This might take a moment...",
                    "That's a great question! Unfortunately, as a retro AI, I don't have access to real-time web search, but I can help with general knowledge.",
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                aiMsg.innerHTML = `<div class="message-text">${response}</div>`;
                chatArea.appendChild(aiMsg);
                chatArea.scrollTop = chatArea.scrollHeight;
            }, 500);
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    updateStatusBar() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
        
        const timeElement = document.getElementById('status-time');
        if (timeElement) {
            timeElement.textContent = `${displayHours}:${minutes} ${ampm}`;
        }
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dayName = days[now.getDay()];
        const monthName = months[now.getMonth()];
        const date = now.getDate();
        const year = now.getFullYear();
        
        const dateElement = document.getElementById('status-date');
        if (dateElement) {
            dateElement.textContent = `${dayName}, ${monthName} ${date}, ${year}`;
        }
    }

    setupProgramManagerControls() {
        const programManager = document.querySelector('.program-manager');
        if (!programManager) return;

        const systemMenuBtn = programManager.querySelector('.system-menu');
        const buttons = programManager.querySelectorAll('.window-btn');
        const minimizeBtn = buttons[0];
        const maximizeBtn = buttons[1];

        // System menu button - show dropdown
        if (systemMenuBtn) {
            systemMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('system-menu-dropdown');
                if (dropdown.style.display === 'block' && this.currentWindow === programManager) {
                    this.hideSystemMenu();
                } else {
                    this.showSystemMenu(programManager, systemMenuBtn);
                }
            });
        }

        // Minimize button - minimize to icon
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.minimizeProgramManager();
            });
        }

        // Maximize button
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Program Manager is already maximized by default
            });
        }
    }

    minimizeProgramManager() {
        const programManager = document.querySelector('.program-manager');
        programManager.style.display = 'none';
        
        // Deselect any currently selected group icons
        document.querySelectorAll('.group-icon').forEach(i => i.classList.remove('selected'));
        
        // Show minimized icon at top left of desktop
        let minimizedIcon = document.getElementById('program-manager-minimized');
        if (!minimizedIcon) {
            minimizedIcon = document.createElement('div');
            minimizedIcon.id = 'program-manager-minimized';
            minimizedIcon.className = 'minimized-program-manager group-icon';
            minimizedIcon.innerHTML = `
                <div class="minimized-icon-image group-icon-image">
                    <div class="mini-window-icon"></div>
                </div>
                <div class="minimized-icon-label group-icon-label">Program Manager</div>
            `;
            // Single click to select and show context menu
            minimizedIcon.addEventListener('click', (e) => {
                // Don't show menu if in move mode (clicking to place)
                if (minimizedIcon.dataset.moveMode) {
                    return;
                }
                
                // Only select if we didn't just drag
                if (window.pmIconDragging === true) {
                    window.pmIconDragging = false;
                    return;
                }
                
                // Deselect all desktop icons and group icons
                document.querySelectorAll('.desktop-icon, .group-icon').forEach(i => i.classList.remove('selected'));
                minimizedIcon.classList.add('selected');
                
                // Show context menu
                this.showDesktopIconMenu(minimizedIcon, 'program-manager');
                e.stopPropagation();
            });
            // Double click to restore
            minimizedIcon.addEventListener('dblclick', () => {
                this.restoreProgramManager();
            });
            const desktopIcons = document.querySelector('.desktop-icons-area');
            if (desktopIcons) {
                desktopIcons.insertBefore(minimizedIcon, desktopIcons.firstChild);
            } else {
                document.querySelector('.screen-content').appendChild(minimizedIcon);
            }
        }
        minimizedIcon.style.display = 'flex';
        
        // Don't add Program Manager to its own taskbar - it's shown as icon at top left
    }

    restoreProgramManager() {
        const programManager = document.querySelector('.program-manager');
        programManager.style.display = 'flex';
        
        const minimizedIcon = document.getElementById('program-manager-minimized');
        if (minimizedIcon) {
            minimizedIcon.style.display = 'none';
            minimizedIcon.classList.remove('selected');
        }
    }

    addToTaskbar(windowId, title, window) {
        const taskbar = document.querySelector('.desktop-taskbar');
        if (!taskbar) return;
        
        // Don't add Program Manager to taskbar - it has its own icon
        if (windowId === 'program-manager') return;
        
        // Only add application windows to taskbar, not program group windows
        if (!window.classList.contains('application-window')) return;
        
        // Check if already in taskbar
        if (this.minimizedWindows.has(windowId)) return;
        
        const taskbarItem = document.createElement('div');
        taskbarItem.className = 'taskbar-item';
        taskbarItem.dataset.windowId = windowId;
        taskbarItem.innerHTML = `
            <div class="taskbar-item-image">
                <div class="mini-window-icon"></div>
            </div>
            <div class="taskbar-item-label">${title}</div>
        `;
        
        // Click to restore
        taskbarItem.addEventListener('click', () => {
            this.restoreFromTaskbar(windowId, window);
        });
        
        // Double click to restore
        taskbarItem.addEventListener('dblclick', () => {
            this.restoreFromTaskbar(windowId, window);
        });
        
        taskbar.appendChild(taskbarItem);
        this.minimizedWindows.set(windowId, { window, taskbarItem });
    }

    removeFromTaskbar(windowId) {
        const entry = this.minimizedWindows.get(windowId);
        if (entry) {
            entry.taskbarItem.remove();
            this.minimizedWindows.delete(windowId);
        }
    }

    restoreFromTaskbar(windowId, window) {
        if (window) {
            window.style.display = 'flex';
            
            // Re-setup controls if needed
            if (window.classList.contains('program-group-window') && !window.dataset.controlsSetup) {
                this.setupSingleWindowControls(window);
                this.setupWindowDrag(window);
            }
            
            this.focusWindow(window);
            this.removeFromTaskbar(windowId);
            
        }
    }

    setupGroupIcons() {
        document.querySelectorAll('.group-icon').forEach(icon => {
            // Single click to select
            icon.addEventListener('click', (e) => {
                // Deselect all group icons including minimized Program Manager
                document.querySelectorAll('.group-icon').forEach(i => i.classList.remove('selected'));
                const minimizedPM = document.getElementById('program-manager-minimized');
                if (minimizedPM) {
                    minimizedPM.classList.remove('selected');
                }
                icon.classList.add('selected');
            });

            // Double click to open
            icon.addEventListener('dblclick', (e) => {
                const groupId = icon.dataset.group;
                this.openProgramGroup(groupId);
            });
        });
    }

    setupProgramIcons() {
        document.querySelectorAll('.program-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                document.querySelectorAll('.program-icon').forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
            });

            icon.addEventListener('dblclick', (e) => {
                const app = icon.dataset.app;
                if (app === 'minesweeper') {
                    this.openMinesweeper();
                }
            });
        });
    }

    openMinesweeper() {
        const minesweeperApp = document.getElementById('minesweeper-app');
        if (!minesweeperApp) return;

        if (minesweeperApp.style.display === 'none' || !minesweeperApp.style.display) {
            minesweeperApp.style.display = 'flex';
            minesweeperApp.style.left = `${100 + Math.random() * 100}px`;
            minesweeperApp.style.top = `${60 + Math.random() * 50}px`;
            minesweeperApp.style.width = '300px';
            this.setupWindowDrag(minesweeperApp);
            this.setupSingleWindowControls(minesweeperApp);
            
            // Remove from taskbar if it was there
            this.removeFromTaskbar('minesweeper-app');
            
            // Initialize game if not already initialized
            if (!minesweeperApp.dataset.initialized) {
                this.initMinesweeper();
                minesweeperApp.dataset.initialized = 'true';
            }
        }
        
        // Always bring to front when opening/clicking
        this.focusWindow(minesweeperApp);
    }

    initMinesweeper() {
        const board = document.getElementById('minesweeper-board');
        const faceButton = document.getElementById('face-button');
        const mineCounter = document.getElementById('mine-counter');
        const timeCounter = document.getElementById('time-counter');
        
        const rows = 9;
        const cols = 9;
        const mines = 10;
        
        let gameBoard = [];
        let revealed = [];
        let flagged = [];
        let gameOver = false;
        let gameWon = false;
        let firstClick = true;
        let timer = 0;
        let timerInterval = null;
        
        // Initialize board
        function initBoard() {
            gameBoard = Array(rows).fill().map(() => Array(cols).fill(0));
            revealed = Array(rows).fill().map(() => Array(cols).fill(false));
            flagged = Array(rows).fill().map(() => Array(cols).fill(false));
            gameOver = false;
            gameWon = false;
            firstClick = true;
            timer = 0;
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = null;
            updateTime();
            updateMineCounter();
            faceButton.textContent = '😊';
        }
        
        // Place mines
        function placeMines(excludeRow, excludeCol) {
            let placed = 0;
            while (placed < mines) {
                const row = Math.floor(Math.random() * rows);
                const col = Math.floor(Math.random() * cols);
                if (gameBoard[row][col] !== -1 && !(row === excludeRow && col === excludeCol)) {
                    gameBoard[row][col] = -1; // -1 = mine
                    placed++;
                }
            }
            
            // Calculate numbers
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (gameBoard[r][c] !== -1) {
                        let count = 0;
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                const nr = r + dr;
                                const nc = c + dc;
                                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && gameBoard[nr][nc] === -1) {
                                    count++;
                                }
                            }
                        }
                        gameBoard[r][c] = count;
                    }
                }
            }
        }
        
        // Render board
        function renderBoard() {
            board.innerHTML = '';
            board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'minesweeper-cell';
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    
                    if (flagged[r][c]) {
                        cell.textContent = '🚩';
                        cell.classList.add('flagged');
                    } else if (revealed[r][c]) {
                        if (gameBoard[r][c] === -1) {
                            cell.textContent = '💣';
                            cell.classList.add('mine');
                        } else if (gameBoard[r][c] > 0) {
                            cell.textContent = gameBoard[r][c];
                            cell.classList.add('number', `number-${gameBoard[r][c]}`);
                        } else {
                            cell.classList.add('empty');
                        }
                        cell.classList.add('revealed');
                    } else {
                        cell.classList.add('hidden');
                    }
                    
                    cell.addEventListener('click', (e) => handleCellClick(r, c, e));
                    cell.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        handleRightClick(r, c);
                    });
                    
                    board.appendChild(cell);
                }
            }
        }
        
        // Handle cell click
        function handleCellClick(row, col, e) {
            if (gameOver || gameWon || flagged[row][col] || revealed[row][col]) return;
            
            if (firstClick) {
                placeMines(row, col);
                firstClick = false;
                startTimer();
            }
            
            revealCell(row, col);
            checkWin();
        }
        
        // Handle right click (flag)
        function handleRightClick(row, col) {
            if (gameOver || gameWon || revealed[row][col]) return;
            
            flagged[row][col] = !flagged[row][col];
            updateMineCounter();
            renderBoard();
        }
        
        // Reveal cell
        function revealCell(row, col) {
            if (revealed[row][col] || flagged[row][col]) return;
            
            revealed[row][col] = true;
            
            if (gameBoard[row][col] === -1) {
                // Game over
                gameOver = true;
                faceButton.textContent = '😵';
                revealAllMines();
                if (timerInterval) clearInterval(timerInterval);
            } else if (gameBoard[row][col] === 0) {
                // Reveal adjacent cells
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = row + dr;
                        const nc = col + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                            revealCell(nr, nc);
                        }
                    }
                }
            }
            
            renderBoard();
        }
        
        // Reveal all mines
        function revealAllMines() {
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (gameBoard[r][c] === -1) {
                        revealed[r][c] = true;
                    }
                }
            }
            renderBoard();
        }
        
        // Check win
        function checkWin() {
            let revealedCount = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (revealed[r][c]) revealedCount++;
                }
            }
            
            if (revealedCount === rows * cols - mines) {
                gameWon = true;
                gameOver = true;
                faceButton.textContent = '😎';
                if (timerInterval) clearInterval(timerInterval);
            }
        }
        
        // Start timer
        function startTimer() {
            timerInterval = setInterval(() => {
                timer++;
                updateTime();
                if (timer >= 999) {
                    clearInterval(timerInterval);
                }
            }, 1000);
        }
        
        // Update time counter
        function updateTime() {
            timeCounter.textContent = String(timer).padStart(3, '0');
        }
        
        // Update mine counter
        function updateMineCounter() {
            let flagCount = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (flagged[r][c]) flagCount++;
                }
            }
            const remaining = mines - flagCount;
            mineCounter.textContent = String(Math.max(0, remaining)).padStart(3, '0');
        }
        
        // Face button click (new game)
        faceButton.addEventListener('click', () => {
            initBoard();
            renderBoard();
        });
        
        // Initialize
        initBoard();
        renderBoard();
    }

    setupSystemMenu() {
        const dropdown = document.getElementById('system-menu-dropdown');
        
        // Setup menu item actions
        dropdown.querySelectorAll('.system-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.dataset.action;
                if (item.classList.contains('disabled')) return;
                
                if (action && this.currentWindow) {
                    const isProgramManager = this.currentWindow.classList.contains('program-manager');
                    
                    switch (action) {
                        case 'minimize':
                            if (isProgramManager) {
                                this.minimizeProgramManager();
                            } else {
                                this.minimizeWindow(this.currentWindow);
                            }
                            break;
                        case 'maximize':
                            if (!isProgramManager) {
                                this.toggleMaximize(this.currentWindow);
                            }
                            break;
                        case 'close':
                            if (isProgramManager) {
                                this.minimizeProgramManager();
                            } else {
                                this.currentWindow.style.display = 'none';
                            }
                            break;
                    }
                }
                this.hideSystemMenu();
            });
        });
    }

    setupClickOutside() {
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('system-menu-dropdown');
            if (!e.target.classList.contains('system-menu') && 
                !dropdown.contains(e.target)) {
                this.hideSystemMenu();
            }
        });
    }

    showSystemMenu(win, systemMenuBtn) {
        const dropdown = document.getElementById('system-menu-dropdown');
        this.currentWindow = win;
        
        // Position the dropdown below the system menu button
        const rect = systemMenuBtn.getBoundingClientRect();
        const screenContent = document.querySelector('.screen-content');
        const screenRect = screenContent.getBoundingClientRect();
        
        dropdown.style.left = (rect.left - screenRect.left) + 'px';
        dropdown.style.top = (rect.bottom - screenRect.top) + 'px';
        dropdown.style.display = 'block';
        
        // Update Restore state (disabled if not maximized)
        const restoreItem = dropdown.querySelector('.system-menu-item:first-child');
        if (win.classList.contains('maximized')) {
            restoreItem.classList.remove('disabled');
        } else {
            restoreItem.classList.add('disabled');
        }
    }

    hideSystemMenu() {
        const dropdown = document.getElementById('system-menu-dropdown');
        dropdown.style.display = 'none';
        this.currentWindow = null;
    }

    showDesktopIconMenu(icon, appId) {
        const menu = document.getElementById('desktop-icon-menu');
        if (!menu) return;
        
        // Position menu below the icon
        const rect = icon.getBoundingClientRect();
        const screenContent = document.querySelector('.screen-content');
        const screenRect = screenContent.getBoundingClientRect();
        
        menu.style.left = (rect.left - screenRect.left) + 'px';
        menu.style.top = (rect.bottom - screenRect.top + 2) + 'px';
        menu.style.display = 'block';
        menu.dataset.appId = appId;
        
        // Update menu items based on app state
        const restoreItem = menu.querySelector('[data-action="restore"]');
        const minimizeItem = menu.querySelector('[data-action="minimize"]');
        const maximizeItem = menu.querySelector('[data-action="maximize"]');
        
        if (appId === 'program-manager') {
            const programManager = document.querySelector('.program-manager');
            if (programManager && programManager.style.display === 'none') {
                // Program Manager is minimized - enable Restore, disable Minimize
                restoreItem.classList.remove('disabled');
                if (minimizeItem) minimizeItem.classList.add('disabled');
            } else {
                // Program Manager is open - disable Restore, enable Minimize
                restoreItem.classList.add('disabled');
                if (minimizeItem) minimizeItem.classList.remove('disabled');
            }
            // Maximize is always disabled for Program Manager (it's always maximized)
            if (maximizeItem) maximizeItem.classList.add('disabled');
        } else if (appId === 'ai-assistant') {
            const aiWindow = document.getElementById('ai-assistant-app');
            if (aiWindow && aiWindow.style.display === 'none') {
                // AI Assistant is closed - disable Restore and Minimize
                restoreItem.classList.add('disabled');
                if (minimizeItem) minimizeItem.classList.add('disabled');
            } else {
                // AI Assistant is open - enable Restore and Minimize
                restoreItem.classList.remove('disabled');
                if (minimizeItem) minimizeItem.classList.remove('disabled');
            }
            // Maximize is always disabled for desktop icons (they're not windows)
            if (maximizeItem) maximizeItem.classList.add('disabled');
        }
        
        // Setup menu item handlers
        this.setupDesktopIconMenuHandlers(menu, appId);
    }

    hideDesktopIconMenu() {
        const menu = document.getElementById('desktop-icon-menu');
        if (menu) {
            menu.style.display = 'none';
        }
    }

    setupDesktopIconMenuHandlers(menu, appId) {
        // Remove existing handlers to avoid duplicates
        const items = menu.querySelectorAll('.system-menu-item');
        items.forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });
        
        // Restore
        const restoreItem = menu.querySelector('[data-action="restore"]');
        if (restoreItem && !restoreItem.classList.contains('disabled')) {
            restoreItem.addEventListener('click', () => {
                this.hideDesktopIconMenu();
                if (appId === 'program-manager') {
                    this.restoreProgramManager();
                } else if (appId === 'ai-assistant') {
                    const aiWindow = document.getElementById('ai-assistant-app');
                    if (aiWindow && aiWindow.style.display === 'none') {
                        this.openAIAssistant();
                    }
                }
            });
        }
        
        // Move
        const moveItem = menu.querySelector('[data-action="move"]');
        if (moveItem) {
            moveItem.addEventListener('click', () => {
                this.hideDesktopIconMenu();
                // Enable drag mode for the selected icon
                const selectedIcon = document.querySelector('.desktop-icon.selected, .minimized-program-manager.selected');
                if (selectedIcon) {
                    selectedIcon.dataset.moveMode = 'true';
                    // Setup drag for this icon
                    this.setupIconDrag(selectedIcon);
                    // Hide cursor by adding class to body
                    document.body.classList.add('move-mode-active');
                }
            });
        }
        
        // Close
        const closeItem = menu.querySelector('[data-action="close"]');
        if (closeItem) {
            closeItem.addEventListener('click', () => {
                this.hideDesktopIconMenu();
                if (appId === 'program-manager') {
                    // Can't close Program Manager, just minimize
                    this.minimizeProgramManager();
                } else if (appId === 'ai-assistant') {
                    const aiWindow = document.getElementById('ai-assistant-app');
                    if (aiWindow) {
                        aiWindow.style.display = 'none';
                        this.removeFromTaskbar('ai-assistant-app');
                    }
                }
            });
        }
        
        // Switch To
        const switchItem = menu.querySelector('[data-action="switch-to"]');
        if (switchItem) {
            switchItem.addEventListener('click', () => {
                this.hideDesktopIconMenu();
                if (appId === 'program-manager') {
                    this.restoreProgramManager();
                    const programManager = document.querySelector('.program-manager');
                    if (programManager) {
                        this.focusWindow(programManager);
                    }
                } else if (appId === 'ai-assistant') {
                    const aiWindow = document.getElementById('ai-assistant-app');
                    if (aiWindow) {
                        if (aiWindow.style.display === 'none') {
                            this.openAIAssistant();
                        }
                        this.focusWindow(aiWindow);
                    }
                }
            });
        }
    }

    toggleMaximize(win) {
        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            win.style.width = '';
            win.style.height = '';
            win.style.left = '';
            win.style.top = '';
        } else {
            win.classList.add('maximized');
            win.style.width = '100%';
            win.style.height = 'calc(100% - 44px)';
            win.style.left = '0';
            win.style.top = '44px';
        }
    }

    openProgramGroup(groupId) {
        const windowId = `${groupId}-window`;
        const win = document.getElementById(windowId);
        
        if (win) {
            if (win.style.display === 'none' || !win.style.display) {
                win.style.display = 'flex';
                win.style.zIndex = ++this.zIndex;
                this.setupWindowDrag(win);
                this.setupSingleWindowControls(win);
                // Remove from taskbar if it was there
                this.removeFromTaskbar(windowId);
            }
            this.focusWindow(win);
        }
    }

    setupSingleWindowControls(win) {
        if (win.dataset.controlsSetup) return;
        win.dataset.controlsSetup = 'true';

        const systemMenuBtn = win.querySelector('.system-menu');
        const buttons = win.querySelectorAll('.window-btn');
        const minimizeBtn = buttons[0];
        const maximizeBtn = buttons[1];

        // System menu button - show dropdown
        if (systemMenuBtn) {
            systemMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.focusWindow(win); // Bring to front first
                const dropdown = document.getElementById('system-menu-dropdown');
                if (dropdown.style.display === 'block' && this.currentWindow === win) {
                    this.hideSystemMenu();
                } else {
                    this.showSystemMenu(win, systemMenuBtn);
                }
            });
        }

        // Minimize button
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.minimizeWindow(win);
            });
        }

        // Maximize button
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMaximize(win);
            });
        }

        // Click anywhere on window to bring to front
        win.addEventListener('mousedown', (e) => {
            // Don't focus if clicking on controls
            if (!e.target.classList.contains('window-btn') && 
                !e.target.classList.contains('system-menu') &&
                !e.target.closest('.window-btn') &&
                !e.target.closest('.system-menu')) {
                this.focusWindow(win);
            }
        });
    }

    setupWindowDrag(win) {
        const titlebar = win.querySelector('.window-titlebar');
        if (!titlebar || titlebar.dataset.dragSetup) return;
        titlebar.dataset.dragSetup = 'true';

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window-btn') || e.target.classList.contains('system-menu')) {
                return;
            }
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = win.offsetLeft;
            initialTop = win.offsetTop;
            this.focusWindow(win);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            // Only allow drag if move mode is enabled
            if (!icon.dataset.moveMode) {
                isDragging = false;
                return;
            }
            e.preventDefault();
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            win.style.left = (initialLeft + dx) + 'px';
            win.style.top = (initialTop + dy) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    minimizeWindow(win) {
        win.style.display = 'none';
        const title = win.querySelector('.window-title').textContent;
        const windowId = win.id || `window-${Date.now()}`;
        if (!win.id) win.id = windowId;
        this.addToTaskbar(windowId, title, win);
    }

    focusWindow(win) {
        // Remove active from all windows
        document.querySelectorAll('.program-group-window, .application-window').forEach(w => {
            w.classList.remove('active');
        });
        
        // Bring this window to front
        win.classList.add('active');
        win.style.zIndex = ++this.zIndex;
        
        // Deselect desktop icons when focusing a window
        document.querySelectorAll('.desktop-icon, .minimized-program-manager').forEach(i => i.classList.remove('selected'));
        
        // Update taskbar active state
        this.minimizedWindows.forEach((entry, windowId) => {
            if (entry.window === win) {
                entry.taskbarItem.classList.add('active');
            } else {
                entry.taskbarItem.classList.remove('active');
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.programManager = new ProgramManager();
});
