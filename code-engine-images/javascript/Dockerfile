# Use official Node.js Alpine image (smallest secure base)
FROM node:20-alpine

# ===== SECURITY HARDENING =====
# Create non-root user/group with least privileges
RUN addgroup -S runner && adduser -S runner -G runner -h /app

# Configure secure workspace
WORKDIR /app
RUN chmod 555 /app && \
    mkdir -p /tmp && \
    chmod 777 /tmp

# Block potential attack vectors
ENV NODE_ENV=production \
    NODE_OPTIONS="--disallow-code-generation-from-strings" \
    NODE_NO_WARNINGS=1 \
    OPENSSL_CONF=/dev/null

# Install common build dependencies (prevents arbitrary `npm install` failures)
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++

# ===== RUNTIME CONFIGURATION =====
# Drop privileges
USER runner

# Disable Node.js inspector
CMD ["node", "--no-experimental-fetch", "--disable-proto=delete"]