import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const remnoteSkillPath = 'skills/remnote/SKILL.md';
const uploadScriptPath = 'skills/upload-to-clawhub.sh';

describe('remnote skill metadata', () => {
  it('includes note-taking discovery terms in the skill description', async () => {
    const content = await readFile(remnoteSkillPath, 'utf8');

    expect(content).toContain(
      'Search, read, and write RemNote notes and personal knowledge base content'
    );
    expect(content).toContain(
      'Use for note-taking, journaling, tags, and knowledge-base navigation'
    );
  });

  it('publishes the skill with a notes-oriented display name', async () => {
    const content = await readFile(uploadScriptPath, 'utf8');

    expect(content).toContain('NAME="RemNote Notes"');
  });
});
