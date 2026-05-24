#!/usr/bin/env node

let input = ''

for await (const chunk of process.stdin) {
  input += chunk
}

const payload = input ? JSON.parse(input) : {}
const command = String(payload.command ?? payload.tool_input?.command ?? '')
const riskyGitPattern = /\bgit\s+(reset\s+--hard|clean\s+-|push\s+--force|checkout\s+--|restore\s+)/

if (riskyGitPattern.test(command)) {
  console.log(JSON.stringify({
    permission: 'ask',
    user_message: 'This command can discard or overwrite git work. Review it before Cursor runs it.',
    agent_message: 'A project hook requires explicit approval for destructive git commands.',
  }))
  process.exit(0)
}

console.log(JSON.stringify({ permission: 'allow' }))
