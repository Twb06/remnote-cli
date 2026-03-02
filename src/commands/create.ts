import { Command } from 'commander';
import { DaemonClient } from '../client/daemon-client.js';
import { formatResult, formatError, type OutputFormat } from '../output/formatter.js';
import { EXIT } from '../config.js';
import { resolveOptionalInlineOrFileContent } from './content-input.js';

export function registerCreateCommand(program: Command): void {
  program
    .command('create <title>')
    .description('Create a new note in RemNote')
    .option('-c, --content <text>', 'Note content')
    .option('--content-file <path>', 'Read note content from UTF-8 file ("-" for stdin)')
    .option('--parent-id <id>', 'Parent Rem ID')
    .option('-t, --tags <tags...>', 'Tags to add')
    .action(async (title: string, opts) => {
      const globalOpts = program.opts();
      const format: OutputFormat = globalOpts.text ? 'text' : 'json';
      const client = new DaemonClient(parseInt(globalOpts.controlPort, 10));

      try {
        const content = await resolveOptionalInlineOrFileContent({
          inlineText: opts.content as string | undefined,
          filePath: opts.contentFile as string | undefined,
          inlineFlag: '--content',
          fileFlag: '--content-file',
        });

        const payload: Record<string, unknown> = { title };
        if (content !== undefined) payload.content = content;
        if (opts.parentId) payload.parentId = opts.parentId;
        if (opts.tags) payload.tags = opts.tags;

        const result = await client.execute('create_note', payload);
        console.log(
          formatResult(result, format, (data) => {
            const r = data as Record<string, unknown>;
            return `Created note: ${title} (ID: ${r.remId || 'unknown'})`;
          })
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(formatError(message, format));
        process.exit(EXIT.ERROR);
      }
    });
}
