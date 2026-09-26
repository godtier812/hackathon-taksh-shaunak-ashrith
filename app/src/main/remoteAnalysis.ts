import { ipcMain, type BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import type { RemoteAnalyzeRequest, RemoteAnalyzeResult } from '../shared/bridge'
import type { Session, SessionSource, TaskId } from '../shared/types'

const TIMEOUT_MS = 30_000

interface Pending {
  resolve: (session: Session) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

const pending = new Map<string, Pending>()

export function registerRemoteAnalysisResults(): void {
  ipcMain.on('remote:analyzeResult', (_event, result: RemoteAnalyzeResult) => {
    const entry = pending.get(result.requestId)
    if (!entry) return
    clearTimeout(entry.timer)
    pending.delete(result.requestId)
    if (result.session) entry.resolve(result.session)
    else entry.reject(new Error(result.error ?? 'Analysis failed'))
  })
}

export function analyzeInRenderer(
  win: BrowserWindow | null,
  audio: Buffer,
  mimeType: string,
  task: TaskId,
  source: SessionSource
): Promise<Session> {
  if (!win || win.isDestroyed())
    return Promise.reject(new Error('The EchoMind app window is not open'))
  const requestId = randomUUID()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId)
      reject(new Error('Analysis timed out'))
    }, TIMEOUT_MS)
    pending.set(requestId, { resolve, reject, timer })
    const request: RemoteAnalyzeRequest = {
      requestId,
      task,
      source,
      mimeType,
      audio: new Uint8Array(audio)
    }
    win.webContents.send('remote:analyzeRequest', request)
  })
}
