import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateAppId(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug) {
    throw new Error('앱 이름에 영숫자가 최소 1자 포함되어야 합니다');
  }

  return `com.site2app.${slug}`;
}

export async function substituteVariables(dir, variables) {
  const files = await getTextFiles(dir);
  for (const filePath of files) {
    let content = await fs.readFile(filePath, 'utf-8');
    let changed = false;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      if (content.includes(placeholder)) {
        content = content.replaceAll(placeholder, value);
        changed = true;
      }
    }
    if (changed) {
      await fs.writeFile(filePath, content, 'utf-8');
    }
  }
}

async function getTextFiles(dir) {
  const textExts = new Set(['.js', '.json', '.html', '.css', '.md', '.txt', '.yml', '.yaml']);
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...await getTextFiles(fullPath));
    } else if (entry.isFile() && textExts.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

export async function prepareTemplate(options) {
  const { name, url, icon, target = 'dir', output = './dist' } = options;
  const appId = generateAppId(name);
  const templateDir = path.join(__dirname, '..', 'template');
  const tmpDir = path.join(os.tmpdir(), `site2app-${Date.now()}`);
  try {
    await fs.copy(templateDir, tmpDir);
    await substituteVariables(tmpDir, {
      APP_NAME: name,
      APP_URL: url,
      APP_ID: appId,
    });
    return { tmpDir, appId };
  } catch (err) {
    await fs.remove(tmpDir).catch(() => {});
    throw err;
  }
}
