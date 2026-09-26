import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { RemoteAnalyzeRequest, RemoteAnalyzeResult } from '../shared/bridge'

contextBridge.exposeInMainWorld('api', {
  listSessions: () => ipcRenderer.invoke('sessions:list'),
  saveSession: (session: unknown) => ipcRenderer.invoke('sessions:save', session),
  exportReportPdf: () => ipcRenderer.invoke('report:exportPdf'),
  onRemoteAnalyzeRequest: (handler: (request: RemoteAnalyzeRequest) => void) => {
    const listener = (_event: IpcRendererEvent, request: RemoteAnalyzeRequest): void => handler(request)
    ipcRenderer.on('remote:analyzeRequest', listener)
    return () => ipcRenderer.removeListener('remote:analyzeRequest', listener)
  },
  sendRemoteAnalyzeResult: (result: RemoteAnalyzeResult) => ipcRenderer.send('remote:analyzeResult', result)
})
