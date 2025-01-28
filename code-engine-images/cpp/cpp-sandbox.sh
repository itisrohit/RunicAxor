#!/bin/sh
# Limit execution to 5 seconds
timeout -k 2 5 \
    seccomp-proxy \
        --syscalls @safe \
        --execve \
        -- \
        g++ -x c++ -static -O2 -Wall -Wextra -Werror -o /tmp/a.out - && \
        /tmp/a.out