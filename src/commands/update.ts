import { Command } from 'commander';
import { DaemonClient } from '../client/daemon-client.js';
import { formatResult, formatError, type OutputFormat } from '../output/formatter.js';
import { EXIT } from '../config.js';
import { resolveOptionalInlineOrFileContent } from './content-input.js';

export function registerUpdateCommand(program: Command): void {
  program
    .command('update <rem-id>')
    .description('Update an existing note')
    .option('--title <text>', 'New title')
    .option('--append <text>', 'Append content')
    .option('--append-file <path>', 'Read appended content from UTF-8 file ("-" for stdin)')
    .option('--add-tags <tags...>', 'Tags to add')
    .option('--remove-tags <tags...>', 'Tags to remove')
    .action(async (remId: string, opts) => {
      const globalOpts = program.opts();
      const format: OutputFormat = globalOpts.text ? 'text' : 'json';
      const client = new DaemonClient(parseInt(globalOpts.controlPort, 10));

      try {
        const appendContent = await resolveOptionalInlineOrFileContent({
          inlineText: opts.append as string | undefined,
          filePath: opts.appendFile as string | undefined,
          inlineFlag: '--append',
          fileFlag: '--append-file',
        });

        const payload: Record<string, unknown> = { remId };
        if (opts.title) payload.title = opts.title;
        if (appendContent !== undefined) payload.appendContent = appendContent;
        if (opts.addTags) payload.addTags = opts.addTags;
        if (opts.removeTags) payload.removeTags = opts.removeTags;

        const result = await client.execute('update_note', payload);
        console.log(
          formatResult(result, format, (data) => {
            const r = data as Record<string, unknown>;
            return `Updated note ${r.remId || remId}`;
          })
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(formatError(message, format));
        process.exit(EXIT.ERROR);
      }
    });
}
