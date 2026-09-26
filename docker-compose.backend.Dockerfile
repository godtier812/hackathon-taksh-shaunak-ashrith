FROM node:22-bookworm-slim

# xvfb gives Electron a virtual display; the rest are Electron's runtime libs.
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    xauth \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    libatspi2.0-0 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    dbus \
    && rm -rf /var/lib/apt/lists/*
