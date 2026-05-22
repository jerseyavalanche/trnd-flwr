import { spawn } from 'node:child_process';

const server = spawn('npm', ['run', 'dev:server'], { stdio: 'inherit', shell: true });
const client = spawn('npm', ['run', 'dev:client'], { stdio: 'inherit', shell: true });

const close = () => { server.kill(); client.kill(); process.exit(0); };
process.on('SIGINT', close);
process.on('SIGTERM', close);
