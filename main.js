const { app, BrowserWindow, ipcMain } = require('electron');

let mainWindow;

/** Define channel name */
const CHANNEL_NAME = 'main';

/**
 * Create a new window
 */
const createWindow = () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      /** Enable node integration */
      nodeIntegration: true
    }
  });

  /** Open devTools */
  mainWindow.webContents.openDevTools();

  /** Load the index.html page */
  mainWindow.loadFile('index.html');
};

/**
 * Initialize the application
 */
const init = () => {
  /** Create app window */
  createWindow();

  /******************** TG BOT *******************************/
  const TelegramBot = require('node-telegram-bot-api');
  const Agent = require('socks5-https-client/lib/Agent');

  const token = require('config').token;

  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(token, {
    polling: true,
    request: {
      /**
       * Use SOCKS: https://github.com/yagop/node-telegram-bot-api/issues/562#issuecomment-382313307
       */
      agentClass: Agent,
      agentOptions: {
        socksHost: 'sox.ctf.su',
        socksPort: 1080,
        // If authorization is needed:
        // socksUsername: process.env.PROXY_SOCKS5_USERNAME,
        // socksPassword: process.env.PROXY_SOCKS5_PASSWORD
      }
    }
  });

  let messages = {};

  const saveMessage = (msg) => {
    const chatId = msg.chat.id;

    if (!messages[chatId]) {
      messages[chatId] = [];
    }

    messages[chatId].push(msg);

    mainWindow.webContents.send(CHANNEL_NAME, msg);
  };

  bot.on('message', (msg) => {
    saveMessage(msg);
  });
  /********************************************************************/

  /**
   * Add an IPC event listener for the channel
   */
  ipcMain.on('outbox', (event, data) => {
    /** Show the request data */
    console.log(data);

    bot.sendMessage(data.recipient, data.message)
      .then(saveMessage);

    /** Send a response for a synchronous request */
    // event.returnValue = 'pong';
  });
};

/**
 * Run the app
 */
app.on('ready', init);
