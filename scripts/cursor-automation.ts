import { spawnSync } from 'node:child_process'
import { exit } from 'node:process'
import { Agent, CursorAgentError, type AgentOptions, type Run, type RunResult, type SDKMessage } from '@cursor/sdk'

type Command = 'local' | 'cloud' | 'resume' | 'review' | 'ship' | 'help'

const model = { id: process.env.CURSOR_MODEL ?? 'composer-2' }
const cwd = process.cwd()

const runGit = (args: string[]) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`)
  }
  return result.stdout.trim()
}

const optionalGit = (args: string[], fallback: string) => {
  try {
    return runGit(args)
  } catch {
    return fallback
  }
}

const requireApiKey = () => {
  const apiKey = process.env.CURSOR_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('Set CURSOR_API_KEY before running Cursor automation.')
  }
  return apiKey
}

const currentBranch = () => optionalGit(['branch', '--show-current'], 'main')

const repoUrl = () => {
  const configured = process.env.CURSOR_REPO_URL?.trim()
  if (configured) return configured

  const origin = optionalGit(['remote', 'get-url', 'origin'], '')
  if (origin.startsWith('git@github.com:')) {
    return `https://github.com/${origin.slice('git@github.com:'.length).replace(/\.git$/, '')}`
  }
  return origin.replace(/\.git$/, '')
}

const promptFromArgs = (args: string[], fallback: string) => {
  const prompt = args.join(' ').trim()
  return prompt || fallback
}

const printHelp = () => {
  console.log(`Cursor automation for TRND_FLWR

Usage:
  npm run cursor:local -- "prompt"
  npm run cursor:cloud -- "prompt"
  npm run cursor:resume -- <agent-id> "prompt"
  npm run cursor:review
  npm run cursor:ship

Environment:
  CURSOR_API_KEY       Required for SDK runs.
  CURSOR_MODEL         Optional model id. Defaults to composer-2.
  CURSOR_REPO_URL      Optional GitHub repo URL. Defaults to origin.
  CURSOR_STARTING_REF  Optional cloud starting ref. Defaults to current branch.
  CURSOR_AUTO_PR       Set to false to disable cloud PR creation.
`)
}

const writeMessage = (message: SDKMessage) => {
  switch (message.type) {
    case 'assistant':
      for (const block of message.message.content) {
        if (block.type === 'text') process.stdout.write(block.text)
      }
      return
    case 'thinking':
      return
    case 'tool_call':
      if (message.status === 'running') console.error(`\n[tool] ${message.name}`)
      return
    case 'status':
      console.error(`[status] ${message.status}`)
      return
    case 'system':
    case 'user':
    case 'request':
    case 'task':
      return
    default: {
      const exhaustive: never = message
      return exhaustive
    }
  }
}

const streamAndWait = async (run: Run) => {
  console.error(`[cursor] agent=${run.agentId} run=${run.id}`)

  if (run.supports('stream')) {
    for await (const message of run.stream()) {
      writeMessage(message)
    }
    process.stdout.write('\n')
  }

  const result = await run.wait()
  printResult(result)
  if (result.status === 'error' || result.status === 'cancelled') {
    exit(2)
  }
}

const printResult = (result: RunResult) => {
  console.error(`[cursor] run=${result.id} status=${result.status}`)
  for (const branch of result.git?.branches ?? []) {
    if (branch.branch) console.error(`[cursor] branch=${branch.branch}`)
    if (branch.prUrl) console.error(`[cursor] pr=${branch.prUrl}`)
  }
}

const runWithAgent = async (options: AgentOptions, prompt: string) => {
  const agent = await Agent.create(options)
  try {
    const run = await agent.send(prompt)
    await streamAndWait(run)
  } finally {
    agent.close()
  }
}

const runLocal = async (prompt: string) => {
  await runWithAgent(
    {
      apiKey: requireApiKey(),
      model,
      name: 'TRND_FLWR local automation',
      local: { cwd, settingSources: ['project', 'plugins'] },
    },
    prompt,
  )
}

const runCloud = async (prompt: string) => {
  const url = repoUrl()
  if (!url) throw new Error('Unable to infer repo URL. Set CURSOR_REPO_URL.')

  await runWithAgent(
    {
      apiKey: requireApiKey(),
      model,
      name: 'TRND_FLWR cloud automation',
      cloud: {
        repos: [{ url, startingRef: process.env.CURSOR_STARTING_REF ?? currentBranch() }],
        autoCreatePR: process.env.CURSOR_AUTO_PR !== 'false',
        skipReviewerRequest: true,
      },
    },
    prompt,
  )
}

const resumeAgent = async (agentId: string | undefined, prompt: string) => {
  if (!agentId) throw new Error('Usage: npm run cursor:resume -- <agent-id> "prompt"')

  const agent = await Agent.resume(agentId, { apiKey: requireApiKey(), model })
  try {
    const run = await agent.send(prompt)
    await streamAndWait(run)
  } finally {
    agent.close()
  }
}

const verify = () => {
  const result = spawnSync('npm', ['run', 'verify'], { cwd, stdio: 'inherit' })
  if (result.status !== 0) exit(result.status ?? 1)
}

const reviewPrompt = () => `Review the current TRND_FLWR branch against origin/main.
Prioritize correctness, security, data integrity, missing tests, and operational risks.
Do not modify files. Report findings first, then summarize residual risk.`

const shipPrompt = () => `Prepare the current TRND_FLWR work for review.
Check the branch diff against origin/main, make only focused fixes if needed, run npm run verify, commit changes if you make any, push a branch, and open or update a pull request.`

const main = async () => {
  const [rawCommand, ...args] = process.argv.slice(2)
  if (!rawCommand || rawCommand === '--help' || rawCommand === '-h') {
    printHelp()
    return
  }

  const command = (rawCommand ?? 'help') as Command

  try {
    switch (command) {
      case 'local':
        await runLocal(promptFromArgs(args, 'Summarize the current TRND_FLWR repository state.'))
        return
      case 'cloud':
        await runCloud(promptFromArgs(args, shipPrompt()))
        return
      case 'resume': {
        const [agentId, ...promptArgs] = args
        await resumeAgent(agentId, promptFromArgs(promptArgs, 'Continue the previous TRND_FLWR automation task.'))
        return
      }
      case 'review':
        await runLocal(reviewPrompt())
        return
      case 'ship':
        verify()
        await runCloud(shipPrompt())
        return
      case 'help':
        printHelp()
        return
      default:
        throw new Error(`Unknown command: ${rawCommand}`)
    }
  } catch (error) {
    if (error instanceof CursorAgentError) {
      console.error(`[cursor] startup failed: ${error.message}`)
      console.error(`[cursor] retryable=${error.isRetryable}`)
      exit(1)
    }

    if (error instanceof Error) {
      console.error(error.message)
      exit(1)
    }

    throw error
  }
}

await main()
