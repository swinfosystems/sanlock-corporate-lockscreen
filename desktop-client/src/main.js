const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const axios = require('axios');
const io = require('socket.io-client');
const { machineId } = require('node-machine-id');
const screenshot = require('screenshot-desktop');
const robot = require('robotjs');
const CryptoJS = require('crypto-js');

class CorporateLockscreen {
    constructor() {
        this.mainWindow = null;
        this.isLocked = false;
        this.socket = null;
        this.deviceId = null;
        this.userSession = null;
        this.apiUrl = 'https://your-api-endpoint.com'; // Configure this
        this.socketUrl = 'https://your-socket-endpoint.com'; // Configure this
    }

    async initialize() {
        await this.getDeviceId();
        this.createLockWindow();
        this.setupSocketConnection();
        this.registerGlobalShortcuts();
        this.startHeartbeat();
    }

    async getDeviceId() {
        try {
            this.deviceId = await machineId();
        } catch (error) {
            console.error('Failed to get device ID:', error);
            this.deviceId = 'unknown-device';
        }
    }

    createLockWindow() {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        
        this.mainWindow = new BrowserWindow({
            width: width,
            height: height,
            fullscreen: true,
            frame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false,
            movable: false,
            minimizable: false,
            maximizable: false,
            closable: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            }
        });

        this.mainWindow.loadFile(path.join(__dirname, 'lockscreen.html'));
        this.mainWindow.setKiosk(true);
        
        // Prevent window from being closed
        this.mainWindow.on('close', (event) => {
            if (this.isLocked) {
                event.preventDefault();
            }
        });
    }

    setupSocketConnection() {
        this.socket = io(this.socketUrl, {
            auth: {
                deviceId: this.deviceId,
                type: 'desktop-client'
            }
        });

        this.socket.on('connect', () => {
            console.log('Connected to control server');
            this.registerDevice();
        });

        this.socket.on('remote-control-request', (data) => {
            this.handleRemoteControlRequest(data);
        });

        this.socket.on('screenshot-request', () => {
            this.sendScreenshot();
        });

        this.socket.on('mouse-move', (data) => {
            if (this.isRemoteControlActive) {
                robot.moveMouse(data.x, data.y);
            }
        });

        this.socket.on('mouse-click', (data) => {
            if (this.isRemoteControlActive) {
                robot.mouseClick(data.button);
            }
        });

        this.socket.on('key-press', (data) => {
            if (this.isRemoteControlActive) {
                robot.keyTap(data.key, data.modifiers);
            }
        });

        this.socket.on('lock-screen', () => {
            this.lockScreen();
        });

        this.socket.on('unlock-screen', (data) => {
            this.unlockScreen(data.adminId);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from control server');
            setTimeout(() => this.setupSocketConnection(), 5000);
        });
    }

    async registerDevice() {
        try {
            const response = await axios.post(`${this.apiUrl}/api/devices/register`, {
                deviceId: this.deviceId,
                hostname: require('os').hostname(),
                platform: process.platform,
                arch: process.arch,
                version: app.getVersion()
            });
            
            console.log('Device registered successfully');
        } catch (error) {
            console.error('Failed to register device:', error);
        }
    }

    registerGlobalShortcuts() {
        // Disable common shortcuts when locked
        const shortcuts = [
            'CommandOrControl+Alt+Delete',
            'Alt+Tab',
            'Alt+F4',
            'CommandOrControl+Shift+Escape',
            'CommandOrControl+R',
            'F11',
            'CommandOrControl+W'
        ];

        shortcuts.forEach(shortcut => {
            globalShortcut.register(shortcut, () => {
                if (this.isLocked) {
                    // Block the shortcut
                    return false;
                }
            });
        });
    }

    lockScreen() {
        this.isLocked = true;
        this.mainWindow.show();
        this.mainWindow.focus();
        this.mainWindow.setAlwaysOnTop(true);
        
        // Send lock event to server
        this.socket.emit('screen-locked', {
            deviceId: this.deviceId,
            timestamp: new Date().toISOString()
        });
    }

    unlockScreen(adminId) {
        this.isLocked = false;
        this.mainWindow.hide();
        
        // Log unlock event
        this.socket.emit('screen-unlocked', {
            deviceId: this.deviceId,
            adminId: adminId,
            timestamp: new Date().toISOString()
        });
    }

    async sendScreenshot() {
        try {
            const img = await screenshot();
            const base64 = img.toString('base64');
            
            this.socket.emit('screenshot-data', {
                deviceId: this.deviceId,
                image: base64,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
        }
    }

    handleRemoteControlRequest(data) {
        // Verify admin permissions
        if (data.adminLevel === 'superadmin' || data.permissions.includes('remote-control')) {
            this.isRemoteControlActive = true;
            this.socket.emit('remote-control-accepted', {
                deviceId: this.deviceId,
                adminId: data.adminId
            });
        } else {
            this.socket.emit('remote-control-denied', {
                deviceId: this.deviceId,
                adminId: data.adminId,
                reason: 'Insufficient permissions'
            });
        }
    }

    startHeartbeat() {
        setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('heartbeat', {
                    deviceId: this.deviceId,
                    status: this.isLocked ? 'locked' : 'unlocked',
                    timestamp: new Date().toISOString()
                });
            }
        }, 30000); // Every 30 seconds
    }
}

// IPC handlers
ipcMain.handle('authenticate-user', async (event, credentials) => {
    try {
        const response = await axios.post(`${lockscreen.apiUrl}/api/auth/login`, credentials);
        return response.data;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('request-permission', async (event, permissionData) => {
    try {
        const response = await axios.post(`${lockscreen.apiUrl}/api/permissions/request`, permissionData);
        return response.data;
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// App event handlers
app.whenReady().then(() => {
    const lockscreen = new CorporateLockscreen();
    lockscreen.initialize();
});

app.on('window-all-closed', () => {
    // Prevent app from quitting
});

app.on('before-quit', (event) => {
    // Prevent quitting when locked
    if (lockscreen && lockscreen.isLocked) {
        event.preventDefault();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
