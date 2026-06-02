#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   IMAGE_REGISTRY=registry.gitlab.com/group/project ./docker/ci-pdf/build-and-push.sh
# Optional:
#   IMAGE_TAG=node22-pw1.60-tex-2026-06

IMAGE_REGISTRY="${IMAGE_REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-node22-pw1.60-tex-2026-06}"

if [[ -z "$IMAGE_REGISTRY" ]]; then
  echo "Missing IMAGE_REGISTRY. Example:"
  echo "  IMAGE_REGISTRY=registry.gitlab.com/group/project ./docker/ci-pdf/build-and-push.sh"
  exit 1
fi

IMAGE="${IMAGE_REGISTRY}/ci/tex-node-playwright:${IMAGE_TAG}"

echo "Building ${IMAGE}"
docker build -f docker/ci-pdf/Dockerfile -t "${IMAGE}" .

echo "Pushing ${IMAGE}"
docker push "${IMAGE}"

echo "Done: ${IMAGE}"
