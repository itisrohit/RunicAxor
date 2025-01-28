const Docker = require('dockerode');
const docker = new Docker();

async function runInContainer(code, language) {
  try {
    const container = await docker.createContainer({
      Image: `code-engine-${language}`, // Use your custom Docker image
      Cmd: getCommand(language, code),
      Tty: false,
      HostConfig: {
        AutoRemove: false, // Do not auto-remove the container
        Memory: 100 * 1024 * 1024, // 100MB RAM limit
        CpuPeriod: 100000, // CPU quota
        ReadonlyRootfs: true, // Full filesystem protection
        SecurityOpt: ['no-new-privileges'],
        NetworkMode: 'none', // Disable internet
      },
    });

    await container.start();
    const output = await container.wait();
    const logs = await container.logs({ stdout: true, stderr: true });
    await container.remove(); // Remove the container after capturing logs

    // Remove non-printable characters
    const cleanedLogs = logs.toString().replace(/[^\x20-\x7E]/g, '').trim();
    return cleanedLogs;
  } catch (error) {
    throw new Error(`Docker execution failed: ${error.message}`);
  }
}

// Command based on language
function getCommand(lang, code) {
  const commands = {
    python: ['python3', '-c', code],
    nodejs: ['node', '-e', code],
    // Add more languages here
  };
  return commands[lang];
}

module.exports = { runInContainer };