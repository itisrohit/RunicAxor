const Docker = require('dockerode');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const docker = new Docker();
const TEMP_DIR = '/tmp/code-engine';

async function runInContainer(code, language, stdin = '') {
  try {
    const workDir = path.join(TEMP_DIR, uuidv4());
    await fs.ensureDir(workDir);

    // Create temp code file
    const filePath = path.join(workDir, `code.${language === 'python' ? 'py' : 'js'}`);
    await fs.writeFile(filePath, code);

    // Stdin file (optional)
    const stdinPath = path.join(workDir, 'stdin.txt');
    await fs.writeFile(stdinPath, stdin);

    const container = await docker.createContainer({
      Image: `code-engine-${language}`, // Custom language runtime
      Cmd: getCommand(language),
      Tty: false,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      StdinOnce: true,
      HostConfig: {
        Binds: [`${workDir}:/code:ro`], // Read-only mount
        Memory: 100 * 1024 * 1024, // 100MB RAM limit
        ReadonlyRootfs: true,
        SecurityOpt: ['no-new-privileges'],
        NetworkMode: 'none', // Disable internet
      },
    });

    await container.start();

    // Attach stdin
    if (stdin) {
      const stream = await container.attach({ stream: true, stdin: true });
      stream.write(stdin);
      stream.end();
    }

    // Get logs
    const logs = await container.logs({ stdout: true, stderr: true });
    await container.remove();
    await fs.remove(workDir);

    return logs.toString().trim();
  } catch (error) {
    throw new Error(`Docker execution failed: ${error.message}`);
  }
}

// Command based on language
function getCommand(language) {
  return {
    python: ['python3', '/code/code.py'],
    nodejs: ['node', '/code/code.js'],
  }[language];
}

module.exports = { runInContainer };

// // Command based on language
// function getCommand(lang, code) {
//   const commands = {
//     python: ['python3', '-c', code],
//     nodejs: ['node', '-e', code],
//     // Add more languages here
//   };
//   return commands[lang];
// }

// module.exports = { runInContainer };