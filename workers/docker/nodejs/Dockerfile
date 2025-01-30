FROM node:20-alpine

# Security setup
RUN addgroup -S runner && adduser -S runner -G runner \
    && mkdir /app \
    && chown -R runner:runner /app

WORKDIR /app
USER runner

# Security configurations
RUN chmod 555 /app && \
    mkdir -p /tmp && \
    chmod 777 /tmp

# Runtime flags for security
CMD ["node", "--no-deprecation", "--disallow-code-generation-from-strings", "-e", "process.stdin.on('data', d => { try { eval(d.toString()) } catch(e) { process.exit(1) } })"]