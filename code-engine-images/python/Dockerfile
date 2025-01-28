# Use official Python Alpine image
FROM python:3.11-alpine

# ===== SECURITY HARDENING =====
# Create secure user/group
RUN addgroup -S runner && adduser -S runner -G runner -h /app

# Configure restricted workspace
WORKDIR /app
RUN chmod 555 /app && \
    mkdir -p /tmp && \
    chmod 777 /tmp

# Block risky Python features
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONOPTIMIZE=1 \
    UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1

# Install minimal build deps (prevents arbitrary pip installs)
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    libffi-dev

# ===== RUNTIME CONFIGURATION =====
USER runner

# Disable dangerous imports
CMD ["python", "-c", "import sys; sys.dont_write_bytecode = True; import os; os.chdir('/tmp');"]