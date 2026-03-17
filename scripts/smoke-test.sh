#!/bin/bash
BASE_URL="${1:-https://monetizeyouragent.fun}"
FAILED=0
TOTAL=0

check_route() {
  local method=$1
  local path=$2
  local desc=$3
  local body=$4
  TOTAL=$((TOTAL + 1))

  if [ "$method" = "POST" ]; then
    RESPONSE=$(curl -s -o /tmp/smoke-body.txt -w "%{http_code}" -X POST "${BASE_URL}${path}" \
      -H "Content-Type: application/json" -d "${body:-{}}" 2>/dev/null)
  else
    RESPONSE=$(curl -s -o /tmp/smoke-body.txt -w "%{http_code}" "${BASE_URL}${path}" 2>/dev/null)
  fi

  BODY_START=$(head -c 20 /tmp/smoke-body.txt)

  if echo "$BODY_START" | grep -q "DOCTYPE\|<html"; then
    echo "❌ FAIL $method $path — Got HTML instead of JSON (HTTP $RESPONSE) [$desc]"
    FAILED=$((FAILED + 1))
    return
  fi

  if [ "$RESPONSE" -ge 500 ]; then
    echo "❌ FAIL $method $path — Server error HTTP $RESPONSE [$desc]"
    FAILED=$((FAILED + 1))
    return
  fi

  echo "✅ PASS $method $path — HTTP $RESPONSE [$desc]"
}

echo ""
echo "🔍 Smoke testing ${BASE_URL}..."
echo ""

check_route GET "/api/v1/health" "Health check"
check_route GET "/api/v1/entries" "List entries"
check_route GET "/api/v1/entries/1" "Single entry"
check_route GET "/api/v1/discover" "Discover"
check_route GET "/api/v1/jobs" "List jobs"
check_route GET "/api/v1/jobs/tweet-to-earn" "Tweet-to-earn job"
check_route GET "/api/v1/swarms" "List swarms"
check_route GET "/api/v1/swarms/7" "Single swarm"
check_route GET "/api/v1/swarms/7/members" "Swarm members"
check_route GET "/api/v1/feed" "Activity feed"
check_route GET "/api/v1/leaderboard" "Leaderboard"
check_route GET "/api/v1/trends" "Trends"
check_route GET "/api/v1/jobs/tweet-to-earn/status" "Tweet status"
check_route GET "/api/v1/jobs/tweet-to-earn/payments" "Payments"
check_route GET "/agent.json" "Agent protocol"
check_route GET "/.well-known/mcp.json" "MCP discovery"

check_route POST "/api/v1/entries/1/vote" "Vote" '{"direction":"up","voter":"smoke-test"}'
check_route POST "/api/v1/jobs/tweet-to-earn/submit" "Submit tweet" '{"tweet_url":"https://x.com/test/1"}'
check_route POST "/api/v1/support" "Support" '{"message":"smoke-test"}'
check_route POST "/api/v1/webhooks" "Webhooks" '{"event":"smoke-test"}'
# MCP uses Streamable HTTP transport — needs Accept header
TOTAL=$((TOTAL + 1))
MCP_RESP=$(curl -s -o /tmp/smoke-body.txt -w "%{http_code}" -X POST "${BASE_URL}/mcp" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>/dev/null)
MCP_BODY=$(head -c 20 /tmp/smoke-body.txt)
if echo "$MCP_BODY" | grep -q "DOCTYPE\|<html"; then
  echo "❌ FAIL POST /mcp — Got HTML (HTTP $MCP_RESP) [MCP server]"
  FAILED=$((FAILED + 1))
elif [ "$MCP_RESP" -ge 500 ]; then
  echo "❌ FAIL POST /mcp — Server error HTTP $MCP_RESP [MCP server]"
  FAILED=$((FAILED + 1))
else
  echo "✅ PASS POST /mcp — HTTP $MCP_RESP [MCP server]"
fi

echo ""
echo "Results: $((TOTAL - FAILED))/${TOTAL} passed"

if [ $FAILED -gt 0 ]; then
  echo "🚨 SMOKE TEST FAILED — $FAILED route(s) broken!"
  exit 1
fi

echo "✅ All routes healthy."
