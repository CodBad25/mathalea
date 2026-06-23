#!/usr/bin/env node
/* eslint-disable no-undef */

// scripts/wait-for-server.ts
import { spawn, spawnSync } from 'node:child_process'
import waitOn from 'wait-on'

// Lancer pnpm start en arrière-plan
const startServer = async () => {
  const child = spawn('pnpm', ['start'], { shell: true })

  // Optionnel : écouter les logs
  child.stdout.on('data', (data) => console.log(`Server stdout: ${data}`))
  child.stderr.on('data', (data) => console.error(`Server stderr: ${data}`))

  // On ne bloque pas l'attente du processus, car on l'attendra via `wait-on`
}

// Fonction principale
const waitForServerOrLaunch = async () => {
  console.log('Checking if server is running at http://localhost:5173/alea...')

  try {
    // Vérifier si le serveur est déjà prêt
    await waitOn({ url: 'http://localhost:5173/alea' })
    console.log('✅ Server is already running.')
  } catch (err) {
    console.log('Server not found. Launching pnpm start...')
    await startServer()
    console.log('Server launched. Waiting for it to be ready...')
    // Attendre que le serveur écoute
    await waitOn({ url: 'http://localhost:5173/alea' })
    console.log('✅ Server started and ready.')
  }
}

// Exécution
waitForServerOrLaunch()
  .then(() => {})
  .catch((error) => {
    console.error('❌ Failed to start or wait for server:', error)
    process.exit(1)
  })

const sourceMode = process.argv[2] ?? 'staged'
const maxCommitsArg = process.argv[3] ?? '1'
const parsedMaxCommits = Number.parseInt(maxCommitsArg, 10)
const maxCommits =
  Number.isFinite(parsedMaxCommits) && parsedMaxCommits > 0
    ? parsedMaxCommits
    : 1

function runGit(args) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return {
    ok: result.status === 0,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  }
}

function hasHeadCommit() {
  return runGit(['rev-parse', '--verify', 'HEAD']).ok
}

function hasCommand(commandName) {
  const result = spawnSync(commandName, ['--version'], {
    stdio: 'ignore',
  })
  return result.status === 0
}

function getChangedFiles() {
  if (sourceMode === 'staged') {
    const staged = runGit([
      'diff',
      '--cached',
      '--name-only',
      '--diff-filter=AM',
    ])
    if (!staged.ok) {
      throw new Error(
        staged.stderr || 'Impossible de récupérer les fichiers stagés.',
      )
    }
    return staged.stdout
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter(Boolean)
  }

  if (sourceMode === 'last-commit') {
    if (!hasHeadCommit()) {
      return []
    }

    const baseRef = `HEAD~${maxCommits}`
    const hasBase = runGit(['rev-parse', '--verify', baseRef]).ok

    if (hasBase) {
      const diff = runGit(['diff', '--name-only', `${baseRef}..HEAD`])
      if (diff.ok) {
        return diff.stdout
          .split(/\r?\n/)
          .map((f) => f.trim())
          .filter(Boolean)
      }
    }

    const showHead = runGit(['show', '--name-only', '--pretty=', 'HEAD'])
    if (!showHead.ok) {
      throw new Error(
        showHead.stderr ||
          'Impossible de récupérer les fichiers du dernier commit.',
      )
    }
    return showHead.stdout
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter(Boolean)
  }

  throw new Error(
    `Mode inconnu: ${sourceMode}. Utiliser staged ou last-commit.`,
  )
}

function isRelevantExerciseFile(filePath) {
  const normalized = filePath.replaceAll('\\\\', '/')
  if (!normalized.startsWith('src/exercices/')) return false
  if (normalized.includes('ressources') || normalized.includes('apps'))
    return false
  const segments = normalized.replace('src/exercices/', '').split('/')
  if (segments.length < 2) return false
  return normalized.endsWith('.ts') || normalized.endsWith('.js')
}

function runTestStep(stepName, command, args, extraEnv = {}) {
  console.log(`[TEST] ${stepName}...`)
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
  })
  return result.status === 0
}

function shouldRunLatexStep() {
  if (process.env.SKIP_EXOMODIFIED_LATEX === '1') {
    return {
      run: false,
      reason: 'SKIP_EXOMODIFIED_LATEX=1',
    }
  }

  if (!hasCommand('lualatex')) {
    return {
      run: false,
      reason: 'lualatex introuvable',
    }
  }

  return {
    run: true,
    reason: null,
  }
}

function main() {
  const changedFiles = getChangedFiles()
  const exerciseFiles = [
    ...new Set(changedFiles.filter(isRelevantExerciseFile)),
  ]

  if (exerciseFiles.length === 0) {
    console.log('Aucun exercice modifie detecte. Tests ExosModified ignores.')
    process.exit(0)
  }

  const changedFilesEnv = exerciseFiles.join('\n')

  console.log('[INFO] Fichiers exos pris en compte pour CHANGED_FILES:')
  console.log(changedFilesEnv)

  const steps = [
    {
      name: 'Console errors',
      command: 'pnpm',
      args: ['test:e2e:console_errors'],
      env: { CHANGED_FILES: changedFilesEnv },
    },
    {
      name: 'All exercises vitest',
      command: 'pnpm',
      args: [
        'vitest',
        '--config',
        'tests/e2e/vitest.config.all_exercises.js',
        '--run',
      ],
      env: { CI: '1', CHANGED_FILES: changedFilesEnv },
    },
    {
      name: 'Interactivity report',
      command: 'pnpm',
      args: ['vitest', 'src/lib/amc/report-interactif.test.ts', '--run'],
      env: { INTERACTIF_REPORT: '1', CHANGED_FILES: changedFilesEnv },
    },
    {
      name: 'AMCnum report',
      command: 'pnpm',
      args: ['vitest', 'src/lib/amc/report-amcnum.test.ts', '--run'],
      env: { AMCNUM_REPORT: '1', CHANGED_FILES: changedFilesEnv },
    },
  ]

  const latexDecision = shouldRunLatexStep()
  if (latexDecision.run) {
    steps.push({
      name: 'LaTeX compile (sans UI)',
      command: 'pnpm',
      args: ['test:e2e:latex_compile'],
      env: { CHANGED_FILES: changedFilesEnv },
    })
  } else {
    console.log(`[INFO] Test LaTeX saute (${latexDecision.reason}).`)
    console.log('[INFO] Attendu localement: outils LaTeX (lualatex) installes.')
  }

  const results = steps.map((step) => {
    const ok = runTestStep(step.name, step.command, step.args, step.env)
    return { name: step.name, ok }
  })

  console.log('')
  console.log('===========================================')
  console.log('[SUMMARY] Resume des tests ExosModified (local)')
  console.log('===========================================')

  for (const result of results) {
    console.log(`${result.ok ? '✅' : '❌'} ${result.name}`)
  }

  const okCount = results.filter((r) => r.ok).length
  console.log('')
  console.log(`Resultat global: ${okCount}/${results.length} sous-tests OK`)
  console.log('===========================================')

  if (okCount !== results.length) {
    process.exit(1)
  }
}

try {
  waitForServerOrLaunch()
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[ERROR] ${message}`)
  process.exit(1)
}
