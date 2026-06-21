 pnpm start 2>&1 >/dev/null &
 sleep 10
until $(curl --output /dev/null --head --fail http://localhost:5173/alea/); do printf '.'; sleep 10; done
    # Récupérer les fichiers modifiés depuis les 2 derniers commits
git fetch origin "$CI_COMMIT_REF_NAME" --depth=10
git checkout FETCH_HEAD

COMMIT_COUNT=$(git rev-list --count HEAD)
MAX_COMMITS=5
if [ "$COMMIT_COUNT" -lt "$MAX_COMMITS" ]; then
  DIFF_BASE="HEAD~$((COMMIT_COUNT - 1))"
else
  DIFF_BASE="HEAD~$MAX_COMMITS"
fi
echo "Comparing from $DIFF_BASE to HEAD"
if git rev-parse --verify "$DIFF_BASE" >/dev/null 2>&1; then
  echo "Comparing from $DIFF_BASE to HEAD"
  CHANGED_FILES=$(git diff --name-only "$DIFF_BASE"..HEAD)
else
  echo "⚠️ Le commit $DIFF_BASE n'est pas disponible (clone trop peu profond ?)"
  CHANGED_FILES=$(git diff --name-only $CI_COMMIT_BEFORE_SHA $CI_COMMIT_SHA)
fi
echo ""
echo "📋 Fichiers modifiés:"
echo "$CHANGED_FILES"
echo ""
# ============================================================
# PHASE 2: Tests unitaires et e2e
# ============================================================
# Test 1/4 : Console errors (Playwright)
echo "🧪 Test 1/4: Console errors..."
if CHANGED_FILES="$CHANGED_FILES" pnpm test:e2e:console_errors; then
  STATUS_CONSOLE=ok
else
  STATUS_CONSOLE=ko
fi
# Test 2/4 : All exercises vitest (sans Playwright)
echo "🧪 Test 2/4: All exercises vitest..."
if CHANGED_FILES="$CHANGED_FILES" pnpm vitest --config tests/e2e/vitest.config.all_exercises.js --run; then
  STATUS_VITEST=ok
else
  STATUS_VITEST=ko
fi
# Test 3/4 : Interactivity report
echo "🧪 Test 3/4: Interactivity report..."
if INTERACTIF_REPORT=1 CHANGED_FILES="$CHANGED_FILES" pnpm vitest src/lib/amc/report-interactif.test.ts --run; then
  STATUS_INTERACTIF=ok
else
  STATUS_INTERACTIF=ko
fi
# Test 4/4 : AMCnum report
echo "🧪 Test 4/4: AMCnum report..."
if AMCNUM_REPORT=1 CHANGED_FILES="$CHANGED_FILES" pnpm vitest src/lib/amc/report-amcnum.test.ts --run; then
  STATUS_AMCNUM=ok
else
  STATUS_AMCNUM=ko
fi
# ============================================================
# PHASE 3: Résumé final
# ============================================================
echo ""
echo "═══════════════════════════════════════════"
echo "📊 Résumé des tests consolidés"
echo "═══════════════════════════════════════════"
[ "$STATUS_CONSOLE" = "ok" ] && echo "✅ Console errors" || echo "❌ Console errors"
[ "$STATUS_VITEST" = "ok" ] && echo "✅ All exercises vitest" || echo "❌ All exercises vitest"
[ "$STATUS_INTERACTIF" = "ok" ] && echo "✅ Interactivity report" || echo "❌ Interactivity report"
[ "$STATUS_AMCNUM" = "ok" ] && echo "✅ AMCnum report" || echo "❌ AMCnum report"
OK_COUNT=0
[ "$STATUS_CONSOLE" = "ok" ] && OK_COUNT=$((OK_COUNT + 1))
[ "$STATUS_VITEST" = "ok" ] && OK_COUNT=$((OK_COUNT + 1))
[ "$STATUS_INTERACTIF" = "ok" ] && OK_COUNT=$((OK_COUNT + 1))
[ "$STATUS_AMCNUM" = "ok" ] && OK_COUNT=$((OK_COUNT + 1))
echo ""
echo "Résultat global: $OK_COUNT/4 sous-tests OK"
echo "═══════════════════════════════════════════"
# Fail si au moins un test a échoué
if [ "$OK_COUNT" -lt 4 ]; then
  exit 1
fi