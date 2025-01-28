# Use GCC Alpine base
FROM gcc:12.2.0

# ===== SECURITY HARDENING =====
# Create restricted user
RUN addgroup -S runner && adduser -S runner -G runner -h /app

# Configure secure environment
WORKDIR /app
RUN chmod 555 /app && \
    mkdir -p /tmp && \
    chmod 777 /tmp

# Compiler protections
ENV GCC_SECCOMP_SANDBOX=1 \
    FORTIFY_SOURCE=2 \
    _FORTIFY_SOURCE=2 \
    LDFLAGS="-Wl,-z,relro,-z,now"

# Install security packages
RUN apk add --no-cache \
    libseccomp-dev \
    seccomp-proxy

# ===== RUNTIME CONFIGURATION =====
USER runner

# Security wrapper script
COPY --chown=runner:runner cpp/cpp-sandbox.sh /app/
ENTRYPOINT ["/app/cpp-sandbox.sh"]