import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import type { Session } from '../shared/types'
import { allowedOriginsFromEnv, startApiServer } from './apiServer'
import { analyzeInRenderer, registerRemoteAnalysisResults } from './remoteAnalysis'
import { listSessions, saveSession, sessionsFile } from './sessionStore'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow = win
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })
  win.on('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.echomind.app')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  console.log('EchoMind sessions file:', sessionsFile())

  ipcMain.handle('sessions:list', () => listSessions())
  ipcMain.handle('sessions:save', (_event, session: Session) => saveSession(session))
  ipcMain.handle('report:exportPdf', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { saved: false }
    const pdf = await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true })
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: `EchoMind-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return { saved: false }
    await writeFile(filePath, pdf)
    void shell.openPath(filePath)
    return { saved: true, filePath }
  })

  registerRemoteAnalysisResults()
  startApiServer({
    listSessions,
    analyze: (audio, mimeType, task, source) => analyzeInRenderer(mainWindow, audio, mimeType, task, source),
    allowedOrigins: allowedOriginsFromEnv()
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
