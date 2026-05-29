#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

const rootDir = process.cwd()
const sourceRoot = path.join(rootDir, 'src')
const cliArgs = process.argv.slice(2)
const applyChanges = cliArgs.includes('--apply')
const targetArgs = cliArgs.filter((arg) => !arg.startsWith('--'))
const targetRoots =
  targetArgs.length > 0
    ? targetArgs.map((arg) => path.resolve(rootDir, arg))
    : [sourceRoot]

const skippedFiles = []
const changedFiles = []
const insertedStatements = []

async function collectTsFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue

    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectTsFiles(fullPath)))
      continue
    }

    if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.d.ts')
    ) {
      files.push(fullPath)
    }
  }

  return files
}

async function collectTsTargets(targets) {
  const files = []

  for (const target of targets) {
    const stat = await fs.stat(target)
    if (stat.isDirectory()) {
      files.push(...(await collectTsFiles(target)))
      continue
    }

    if (
      stat.isFile() &&
      (target.endsWith('.ts') || target.endsWith('.tsx')) &&
      !target.endsWith('.d.ts')
    ) {
      files.push(target)
    }
  }

  return files
}

function getIndent(sourceText, position) {
  const lineStart = sourceText.lastIndexOf('\n', position - 1) + 1
  const indentationMatch = sourceText.slice(lineStart, position).match(/^\s*/)
  return indentationMatch?.[0] ?? ''
}

function isAutoCorrectionAMCElementAccess(node) {
  return (
    ts.isElementAccessExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'autoCorrectionAMC' &&
    node.argumentExpression != null
  )
}

function isAutoCorrectionAMCPropertyAccess(node) {
  return (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === 'autoCorrectionAMC'
  )
}

function makeIndexedInsertion(sourceText, statement, leftSide) {
  const receiverText = sourceText.slice(
    leftSide.expression.expression.getStart(),
    leftSide.expression.expression.getEnd(),
  )
  const indexText = sourceText.slice(
    leftSide.argumentExpression.getStart(),
    leftSide.argumentExpression.getEnd(),
  )
  const indent = getIndent(sourceText, statement.getStart())

  return `${indent}${receiverText}.questionsAMC[${indexText}] = amcConvert(${receiverText}.autoCorrectionAMC[${indexText}])`
}

function makeArrayInsertion(sourceText, statement, leftSide) {
  const receiverText = sourceText.slice(
    leftSide.expression.getStart(),
    leftSide.expression.getEnd(),
  )
  const indent = getIndent(sourceText, statement.getStart())

  return `${indent}${receiverText}.questionsAMC = ${receiverText}.autoCorrectionAMC.map((questionAMC) => amcConvert(questionAMC))`
}

function hasNearbyQuestionsAssignment(sourceText, statementEnd) {
  const after = sourceText.slice(statementEnd, statementEnd + 250)
  return /questionsAMC\s*(\[|=)/.test(after)
}

function collectEditsForFile(sourceText, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )

  const edits = []

  const visit = (node) => {
    if (
      ts.isExpressionStatement(node) &&
      ts.isBinaryExpression(node.expression) &&
      node.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      const leftSide = node.expression.left

      if (isAutoCorrectionAMCElementAccess(leftSide)) {
        if (!hasNearbyQuestionsAssignment(sourceText, node.getEnd())) {
          edits.push({
            start: node.getEnd(),
            text: '\n' + makeIndexedInsertion(sourceText, node, leftSide),
          })
        }
      } else if (isAutoCorrectionAMCPropertyAccess(leftSide)) {
        if (!hasNearbyQuestionsAssignment(sourceText, node.getEnd())) {
          edits.push({
            start: node.getEnd(),
            text: '\n' + makeArrayInsertion(sourceText, node, leftSide),
          })
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return edits.sort((a, b) => b.start - a.start)
}

async function processFile(filePath) {
  const sourceText = await fs.readFile(filePath, 'utf8')
  const edits = collectEditsForFile(sourceText, filePath)

  if (edits.length === 0) {
    skippedFiles.push(filePath)
    return
  }

  let nextText = sourceText
  for (const edit of edits) {
    nextText = `${nextText.slice(0, edit.start)}${edit.text}${nextText.slice(edit.start)}`
  }

  if (applyChanges) {
    await fs.writeFile(filePath, nextText)
  }

  changedFiles.push(filePath)
  insertedStatements.push({ filePath, count: edits.length })
}

async function main() {
  const files = await collectTsTargets(targetRoots)

  for (const filePath of files) {
    await processFile(filePath)
  }

  const modeLabel = applyChanges ? 'apply' : 'dry-run'
  console.log(`[amc-questions codemod] mode: ${modeLabel}`)
  console.log(`[amc-questions codemod] targets: ${targetRoots.join(', ')}`)
  console.log(`[amc-questions codemod] scanned files: ${files.length}`)
  console.log(`[amc-questions codemod] changed files: ${changedFiles.length}`)
  console.log(
    `[amc-questions codemod] inserted statements: ${insertedStatements.reduce((total, item) => total + item.count, 0)}`,
  )

  if (!applyChanges) {
    for (const entry of insertedStatements.slice(0, 20)) {
      console.log(`  - ${entry.filePath} (+${entry.count})`)
    }
    if (insertedStatements.length > 20) {
      console.log(`  ... ${insertedStatements.length - 20} other files`)
    }
    if (changedFiles.length === 0) {
      console.log('[amc-questions codemod] nothing to do')
    }
    return
  }

  if (changedFiles.length > 0) {
    console.log('[amc-questions codemod] files written successfully')
  } else {
    console.log('[amc-questions codemod] nothing to write')
  }
}

await main()
