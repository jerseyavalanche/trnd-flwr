import { spawn } from 'node:child_process'

const children = [
  spawn('node', ['dist-server/index.js'], { stdio: 'inherit' }),
  spawn('vite', [], { stdio: 'inherit', shell: true }),
]

let shuttingDown = false

const shutdown = (code = 0) => {
  if (shuttingDown) return
  shuttingDown = true

  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }

  process.exit(code)
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    if (code === 0 || signal === 'SIGTERM') return
    shutdown(code ?? 1)
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
