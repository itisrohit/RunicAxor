FROM python:3.11-alpine

# Security setup
RUN addgroup -S runner && adduser -S runner -G runner \
    && mkdir /app \
    && chown -R runner:runner /app

WORKDIR /app
USER runner

# Disable risky features
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

CMD ["python3", "-c", "import sys; exec(sys.stdin.read())"]