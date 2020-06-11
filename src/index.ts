import {
  ExtensionContext,
  workspace,
  sources,
  ISource,
  CompleteResult,
  CompleteOption
} from 'coc.nvim'

import which from 'which'

import { spawn } from 'child_process'
import { MessageChannel } from 'worker_threads'

const baseDir = process.env.HOME
const wikiDir = baseDir + '/wiki/'

export async function activate(context: ExtensionContext): Promise<void> {
  let { subscriptions, logger } = context

  try {
    which.sync('createwiki')
  } catch (e) {
    workspace.showMessage('create required for coc-wiki', 'warning')
    return
  }

  let source: ISource = {
    name: 'wiki',
    enable: true,
    filetypes: ['markdown'],
    priority: 99,
    triggerPatterns: [
      /\[\[[^\]\|]{2,}$/,
      /^(File|Reference):\s*/,
      /^(File|Reference):.*,\s*/
    ],

    async doComplete(opt: CompleteOption) {
      const matches = await query()

      if (!matches) {
        console.error('error in !matches: \n' + matches)
      }

      return {
        items: matches.map(m => {
          return {
            word: m.filepath,
            filterText: m.filepath
          }
        }),
      }
    },
  }
  subscriptions.push(sources.addSource(source))
}

function query(): Promise<Match[]> {
  return new Promise((resolve, reject) => {

    const fd = spawn('fd', ['-ap', '.', wikiDir])

    let matches: Match[] = []

    fd.stdout.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .slice(0,-1)
        .forEach((m: string) => {
          const filepath = m.toString()
          matches.push({ filepath })
        })
    })

    fd.on('exit', () => resolve(matches))

    fd.on('error', (err) => reject(err))
  })
}

interface Match {
  filepath: string
}