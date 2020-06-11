import {
  ExtensionContext,
  workspace,
  CompleteOption,
  sources,
  commands,
} from 'coc.nvim'

import which from 'which'

import { spawn } from 'child_process'

const baseDir = process.env.HOME
const wikiDir = baseDir + '/wiki/'

export async function activate(context: ExtensionContext): Promise<void> {
  try {
    which.sync('createwiki')
  } catch (e) {
    workspace.showMessage('create required for coc-wiki', 'warning')
    return
  }

  context.subscriptions.push(
    commands.registerCommand('wiki', async () => {
      workspace.showMessage(`wiki commands work`)
    }),

    sources.createSource({
      name: 'wiki',
      shortcut: '[CS]',
      filetypes: ['markdown'],
      priority: 1,
      triggerPatterns: [],

      // FIXME: cannot trigger completion
      // triggerPatterns: [/\[\[[^\]\|]{1,}$/],

      doComplete: async function (opt: CompleteOption) {
        const matches = await query()

        return {
          items: matches.map((m) => {
            return {
              word: `${m}`,
              filterText: `${m}`,
            }
          }),
        }
      },
    })
  )
}

function query(): Promise<Match[]> {
  return new Promise((resolve, reject) => {
    // const fd = spawn('fd -ap . $HOME/wiki/', [input])
    const fd = spawn('fd', ['-ap', '.', wikiDir])

    let matches: Match[] = []

    fd.stdout.on('data', (data) => {

      data
        .toString()
        .split('\n')
        .slice(0, -1)
        .forEach((m: string) => {
          const [filepath] = m.toString()
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
