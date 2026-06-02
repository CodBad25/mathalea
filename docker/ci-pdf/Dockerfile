FROM mcr.microsoft.com/playwright:v1.60.0-noble

# Keep everything non-interactive for CI builds.
ENV DEBIAN_FRONTEND=noninteractive

# Minimal TeX stack for lualatex-based tests.
# Add more texlive-* packages only if tests report missing modules.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-luatex \
    texlive-latex-recommended \
    texlive-fonts-recommended \
    texlive-science \
    lmodern \
    ghostscript \
    ca-certificates \
    curl \
    git \
  && rm -rf /var/lib/apt/lists/*

# Use the project-declared package manager version.
# Node 22+ has corepack built-in; no need to npm i -g corepack.
RUN corepack enable \
  && corepack prepare pnpm@11.5.0 --activate \
  && pnpm --version \
  && node --version

# Optional sanity check to fail fast if TeX is not available.
RUN lualatex -v
