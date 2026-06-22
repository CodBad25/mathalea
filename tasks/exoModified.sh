if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/alea/ > /dev/null 2>&1; then
  echo "Serveur Vite non disponible. Lancez-le..."
  pnpm start 2>&1 >/dev/null &
  sleep 10
fi


until $(curl --output /dev/null --head --fail http://localhost:5173/alea/); do printf '.'; sleep 2; done
    # Récupérer les fichiers modifiés depuis les 5 derniers commits

COMMIT_COUNT=$(git rev-list --count HEAD)
MAX_COMMITS=5
if [ "$COMMIT_COUNT" -lt "$MAX_COMMITS" ]; then
  DIFF_BASE="HEAD~$((COMMIT_COUNT - 1))"
else
  DIFF_BASE="HEAD~$MAX_COMMITS"
fi

echo "Comparing from $DIFF_BASE to HEAD"
CHANGED_FILES=$(git diff --name-only "$DIFF_BASE"..HEAD | while read -r f; do [ -f "$f" ] && echo "$f"; done)

echo ""
echo "📋 Fichiers modifiés:"
echo "$CHANGED_FILES"
echo ""

# ============================================================
# PHASE 2: Tests unitaires et e2e
# ============================================================
# Test 1/6 : Console errors (Playwright)
echo "🧪 Test 1/6: Console errors..."
if CHANGED_FILES="$CHANGED_FILES" pnpm test:e2e:console_errors; then
  STATUS_CONSOLE=ok
else
  STATUS_CONSOLE=ko
fi

# Test 2/6 : All exercises vitest (sans Playwright)
echo "🧪 Test 2/6: All exercises vitest..."
if CHANGED_FILES="$CHANGED_FILES" pnpm vitest --config tests/e2e/vitest.config.all_exercises.js --run; then
  STATUS_VITEST=ok
else
  STATUS_VITEST=ko
fi

# Test 3/6 : Integration interactivity
echo "🧪 Test 3/6: Integration interactivity..."
if CHANGED_FILES="$CHANGED_FILES" pnpm vitest tests/integration/interactivity_all.test.ts --run; then
  STATUS_INTERACTIF=ok
else
  STATUS_INTERACTIF=ko
fi
# Test 4/6 : AMCnum report
echo "🧪 Test 4/6: AMCnum report..."
if CHANGED_FILES="$CHANGED_FILES" pnpm vitest src/lib/amc/report-amcnum.test.ts --run; then
  STATUS_AMCNUM=ok
else
  STATUS_AMCNUM=ko
fi

echo "🧪 Test 5/6: Compilation latex..."
if CHANGED_FILES="$CHANGED_FILES" STYLES="ProfMaquette,Can,Coopmaths" pnpm vitest tests/e2e/tests/pdfexports/pdfexports.test.ts --run; then
  STATUS_COMPILE=ok
else
  STATUS_COMPILE=ko
fi

echo "🧪 Test 6/6: Line breaks..."
if CHANGED_FILES="$CHANGED_FILES" pnpm vitest tests/e2e/tests/latex_breaks/latex_breaks.test.ts --run; then
  STATUS_BREAKS=ok
else
  STATUS_BREAKS=ko
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
[ "$STATUS_COMPILE" = "ok" ] && echo "✅ Compilation latex" || echo "❌ Compilation latex"
[ "$STATUS_BREAKS" = "ok" ] && echo "✅ Latex line breaks" || echo "❌ Latex line breaks"

OK_COUNT=0
[ "$STATUS_CONSOLE" = "ok" ] && OK_COUNT=$((OK_COUNT + 1))
[ "$STATUS_VITEST" = "ok" ] && OK_COUNT=$((OK_COUNT + 1))
[ "$STATUS_INTERACTIF" = "ok" ] && OK_COUNT=$((OK_COUNT + 1))
[ "$STATUS_AMCNUM" = "ok" ] && OK_COUNT=$((OK_COUNT + 1))
[ "$STATUS_COMPILE" = "ok" ] && OK_COUNT=$((OK_COUNT + 1))
[ "$STATUS_BREAKS" = "ok" ] && OK_COUNT=$((OK_COUNT + 1))

echo ""
echo "Résultat global: $OK_COUNT/6 sous-tests OK"
echo "═══════════════════════════════════════════"
# Fail si au moins un test a échoué
if [ "$OK_COUNT" -lt 6 ]; then
  exit 1
fi