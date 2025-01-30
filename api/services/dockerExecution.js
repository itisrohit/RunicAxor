import Docker from 'dockerode';
import { PassThrough } from 'stream';
import { config } from '../config/default.js';
import logger from '../middlewares/logger.js';
import { securityConfig } from '../config/security.js';

export class DockerExecution {
  constructor() {
    this.docker = new Docker();
    this.timeout = config.docker.timeout;
    this.resourceLimits = {
      Memory: config.docker.memoryLimit,
      CpuQuota: config.docker.cpuQuota,
      PidsLimit: config.docker.pidsLimit
    };
  }

  async execute({ language, code, input = '' }) {
    const container = await this.createContainer(language);
    const inputStream = new PassThrough();
    
    try {
      const executionPromise = this.runContainer(container, inputStream, input);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout')), this.timeout)
      );

      return await Promise.race([executionPromise, timeoutPromise]);
    } finally {
      await this.cleanup(container, inputStream);
    }
  }

  async createContainer(language) {
    return this.docker.createContainer({
      Image: `code-engine-${language}`,
      Cmd: this.getCommand(language),
      HostConfig: {
        ...this.resourceLimits,
        AutoRemove: true,
        ReadonlyRootfs: true,
        SecurityOpt: ['no-new-privileges', 'seccomp=unconfined'],
        NetworkMode: 'none',
        Binds: ['/tmp:/tmp:rw']
      },
      OpenStdin: true,
      StdinOnce: true
    });
  }

  async runContainer(container, inputStream, input) {
    const output = { stdout: '', stderr: '', exitCode: null };
    const execStream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true
    });

    inputStream.end(securityConfig.sanitizeInput(input));
    inputStream.pipe(execStream);
    
    await container.start();
    
    return new Promise((resolve, reject) => {
      container.wait((err, data) => {
        output.exitCode = data?.StatusCode;
        if (err) reject(err);
      });

      container.logs({
        follow: true,
        stdout: true,
        stderr: true
      }, (err, stream) => {
        if (err) return reject(err);
        
        stream.on('data', chunk => {
          output.stdout += chunk.toString();
        });
        
        stream.on('end', () => resolve(output));
      });
    });
  }

  getCommand(lang) {
    return {
      nodejs: ['node', '--no-deprecation', '-e', 'process.stdin.on("data", d => { try { eval(d.toString()) } catch(e) { process.exit(1) } })'],
      python: ['python3', '-c', 'import sys; exec(sys.stdin.read())'],
      cpp: ['/bin/sh', '-c', 'g++ -x c++ -static -O2 -o /tmp/a.out - && /tmp/a.out']
    }[lang];
  }

  async cleanup(container, stream) {
    try {
      stream.destroy();
      await container.stop();
      await container.remove();
    } catch (error) {
      logger.error('Cleanup failed', { error });
    }
  }
}