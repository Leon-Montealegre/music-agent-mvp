#!/bin/bash
# =============================================================================
# Collections + Settings Migration Test Script
# Run from: ~/Documents/music-agent-mvp/file-handler/
# Usage:    bash test-collections.sh
# =============================================================================

BASE="http://localhost:3001"
PASS=0
FAIL=0

# Colours for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Colour

check() {
  local label="$1"
  local output="$2"
  local expected="$3"        # substring that must appear in the response
  if echo "$output" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASS${NC} — $label"
    PASS=$((PASS+1))
  else
    echo -e "${RED}❌ FAIL${NC} — $label"
    echo "   Expected to find: $expected"
    echo "   Got: $output"
    FAIL=$((FAIL+1))
  fi
}

# =============================================================================
# 0. LOGIN — get token
# =============================================================================
echo ""
echo -e "${YELLOW}--- 0. AUTH ---${NC}"
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' | jq -r .token)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Could not get token — is the server running?${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Token obtained${NC}"

AUTH="-H \"Authorization: Bearer $TOKEN\""

# =============================================================================
# 1. POST /collections — create a test collection
# =============================================================================
echo ""
echo -e "${YELLOW}--- 1. POST /collections ---${NC}"
CREATE=$(curl -s -X POST "$BASE/collections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test EP","artist":"TestArtist","collectionType":"EP","genre":"Electronic","releaseDate":"2026-01-01"}')
check "POST /collections returns success" "$CREATE" '"success":true'
check "POST /collections returns collectionId" "$CREATE" '"collectionId"'

COLL_ID=$(echo "$CREATE" | jq -r .collectionId)
echo "   Collection ID: $COLL_ID"

# =============================================================================
# 2. GET /collections — list all collections
# =============================================================================
echo ""
echo -e "${YELLOW}--- 2. GET /collections ---${NC}"
LIST=$(curl -s "$BASE/collections" \
  -H "Authorization: Bearer $TOKEN")
check "GET /collections returns success" "$LIST" '"success":true'
check "GET /collections includes our collection" "$LIST" "$COLL_ID"
check "GET /collections includes collectionType field" "$LIST" '"collectionType":"EP"'
check "GET /collections includes releaseId field (frontend compat)" "$LIST" '"releaseId"'

# =============================================================================
# 3. GET /collections/:collectionId — get single collection
# =============================================================================
echo ""
echo -e "${YELLOW}--- 3. GET /collections/:id ---${NC}"
GET=$(curl -s "$BASE/collections/$COLL_ID" \
  -H "Authorization: Bearer $TOKEN")
check "GET /collections/:id returns success" "$GET" '"success":true'
check "GET /collections/:id has title" "$GET" '"title":"Test EP"'
check "GET /collections/:id has distribution object" "$GET" '"distribution"'
check "GET /collections/:id has notes object" "$GET" '"notes"'
check "GET /collections/:id has songLinks array" "$GET" '"songLinks"'
check "GET /collections/:id has collectionType (frontend compat)" "$GET" '"collectionType":"EP"'

# =============================================================================
# 4. PATCH /collections/:collectionId — update metadata
# =============================================================================
echo ""
echo -e "${YELLOW}--- 4. PATCH /collections/:id ---${NC}"
PATCH=$(curl -s -X PATCH "$BASE/collections/$COLL_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"genre":"House"}')
check "PATCH /collections/:id returns success" "$PATCH" '"success":true'

# Verify the update stuck
VERIFY=$(curl -s "$BASE/collections/$COLL_ID" -H "Authorization: Bearer $TOKEN")
check "PATCH /collections/:id genre was updated" "$VERIFY" '"genre":"House"'

# =============================================================================
# 5. PATCH /collections/:id/notes
# =============================================================================
echo ""
echo -e "${YELLOW}--- 5. PATCH /collections/:id/notes ---${NC}"
NOTES=$(curl -s -X PATCH "$BASE/collections/$COLL_ID/notes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"notes":"This is my test EP notes"}')
check "PATCH /collections/:id/notes returns success" "$NOTES" '"success":true'

# Second call — should upsert, not create a second row
NOTES2=$(curl -s -X PATCH "$BASE/collections/$COLL_ID/notes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"notes":"Updated notes"}')
check "PATCH /collections/:id/notes upsert works (second call)" "$NOTES2" '"success":true'

VERIFY_NOTES=$(curl -s "$BASE/collections/$COLL_ID" -H "Authorization: Bearer $TOKEN")
check "Notes text shows in GET response" "$VERIFY_NOTES" '"text":"Updated notes"'

# =============================================================================
# 6. POST + DELETE /collections/:id/song-links
# =============================================================================
echo ""
echo -e "${YELLOW}--- 6. Song Links ---${NC}"
ADDLINK=$(curl -s -X POST "$BASE/collections/$COLL_ID/song-links" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"label":"Spotify","url":"https://spotify.com/test"}')
check "POST /collections/:id/song-links returns success" "$ADDLINK" '"success":true'

# Get the link ID from the collection
LINK_ID=$(curl -s "$BASE/collections/$COLL_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.collection.songLinks[0].id')
echo "   Link ID: $LINK_ID"

if [ -z "$LINK_ID" ] || [ "$LINK_ID" = "null" ]; then
  echo -e "${RED}❌ FAIL${NC} — Could not get link ID from collection response"
  FAIL=$((FAIL+1))
else
  check "GET after add: link appears in songLinks" \
    "$(curl -s "$BASE/collections/$COLL_ID" -H "Authorization: Bearer $TOKEN")" \
    '"url":"https://spotify.com/test"'

  DELLINK=$(curl -s -X DELETE "$BASE/collections/$COLL_ID/song-links/$LINK_ID" \
    -H "Authorization: Bearer $TOKEN")
  check "DELETE /collections/:id/song-links/:linkId returns success" "$DELLINK" '"success":true'

  AFTER_DEL=$(curl -s "$BASE/collections/$COLL_ID" -H "Authorization: Bearer $TOKEN")
  check "Song link is gone after DELETE" "$AFTER_DEL" '"songLinks":\[\]'
fi

# =============================================================================
# 7. Distribution — add, edit, delete
# =============================================================================
echo ""
echo -e "${YELLOW}--- 7. Distribution ---${NC}"
DIST_ADD=$(curl -s -X PATCH "$BASE/collections/$COLL_ID/distribution" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"path":"submit","entry":{"label":"Test Label","status":"Pending"}}')
check "PATCH /collections/:id/distribution (add) returns success" "$DIST_ADD" '"success":true'

# Get the timestamp from the created entry
TIMESTAMP=$(curl -s "$BASE/collections/$COLL_ID" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.collection.distribution.submit[0].timestamp')
echo "   Entry timestamp: $TIMESTAMP"

if [ -z "$TIMESTAMP" ] || [ "$TIMESTAMP" = "null" ]; then
  echo -e "${RED}❌ FAIL${NC} — Could not get distribution entry timestamp"
  FAIL=$((FAIL+2))
else
  TS_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TIMESTAMP'))")

  DIST_EDIT=$(curl -s -X PATCH "$BASE/collections/$COLL_ID/distribution/submit/$TS_ENCODED" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"status":"Signed"}')
  check "PATCH /collections/:id/distribution/:pathType/:ts (edit) returns success" "$DIST_EDIT" '"success":true'

  DIST_DEL=$(curl -s -X DELETE "$BASE/collections/$COLL_ID/distribution/submit/$TS_ENCODED" \
    -H "Authorization: Bearer $TOKEN")
  check "DELETE /collections/:id/distribution/:pathType/:ts returns success" "$DIST_DEL" '"success":true'
fi

# =============================================================================
# 8. PATCH /collections/:id/sign
# =============================================================================
echo ""
echo -e "${YELLOW}--- 8. PATCH /collections/:id/sign ---${NC}"
SIGN=$(curl -s -X PATCH "$BASE/collections/$COLL_ID/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"labelName":"Test Records","signedDate":"2026-01-15"}')
check "PATCH /collections/:id/sign returns success" "$SIGN" '"success":true'

VERIFY_SIGN=$(curl -s "$BASE/collections/$COLL_ID" -H "Authorization: Bearer $TOKEN")
check "isSigned is true after signing" "$VERIFY_SIGN" '"isSigned":true'
check "signedLabel is set after signing" "$VERIFY_SIGN" '"signedLabel":"Test Records"'

# =============================================================================
# 9. Tracks — POST to link a release, GET tracks, DELETE to unlink
# =============================================================================
echo ""
echo -e "${YELLOW}--- 9. Tracks ---${NC}"

# First check if there are any releases to link
RELEASES=$(curl -s "$BASE/releases/" -H "Authorization: Bearer $TOKEN")
FIRST_RELEASE=$(echo "$RELEASES" | jq -r '.releases[0].releaseId // empty')

if [ -z "$FIRST_RELEASE" ]; then
  echo -e "${YELLOW}⚠️  SKIP${NC} — No releases found to link as a track (create a release first to test this)"
else
  echo "   Linking release: $FIRST_RELEASE"
  TRACK_ADD=$(curl -s -X POST "$BASE/collections/$COLL_ID/tracks" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"trackReleaseId\":\"$FIRST_RELEASE\"}")
  check "POST /collections/:id/tracks returns success" "$TRACK_ADD" '"success":true'

  TRACK_GET=$(curl -s "$BASE/collections/$COLL_ID/tracks" \
    -H "Authorization: Bearer $TOKEN")
  check "GET /collections/:id/tracks returns tracks" "$TRACK_GET" '"success":true'
  check "GET /collections/:id/tracks includes our release" "$TRACK_GET" "$FIRST_RELEASE"

  TRACK_DEL=$(curl -s -X DELETE "$BASE/collections/$COLL_ID/tracks/$FIRST_RELEASE" \
    -H "Authorization: Bearer $TOKEN")
  check "DELETE /collections/:id/tracks/:id returns success" "$TRACK_DEL" '"success":true'
fi

# =============================================================================
# 10. Settings
# =============================================================================
echo ""
echo -e "${YELLOW}--- 10. Settings ---${NC}"
SETTINGS_GET=$(curl -s "$BASE/settings" -H "Authorization: Bearer $TOKEN")
check "GET /settings returns success" "$SETTINGS_GET" '"success":true'

SETTINGS_PATCH=$(curl -s -X PATCH "$BASE/settings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"defaultArtistName":"My Artist Name","defaultGenre":"Electronic"}')
check "PATCH /settings returns success" "$SETTINGS_PATCH" '"success":true'
check "PATCH /settings saves defaultArtistName" "$SETTINGS_PATCH" '"defaultArtistName":"My Artist Name"'

# Verify it persisted
SETTINGS_VERIFY=$(curl -s "$BASE/settings" -H "Authorization: Bearer $TOKEN")
check "GET /settings returns saved value" "$SETTINGS_VERIFY" '"defaultArtistName":"My Artist Name"'

# =============================================================================
# 11. Auth isolation — 401 without token
# =============================================================================
echo ""
echo -e "${YELLOW}--- 11. Auth check (no token should get 401) ---${NC}"
NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/collections")
if [ "$NO_AUTH" = "401" ]; then
  echo -e "${GREEN}✅ PASS${NC} — GET /collections without token returns 401"
  PASS=$((PASS+1))
else
  echo -e "${RED}❌ FAIL${NC} — Expected 401, got $NO_AUTH"
  FAIL=$((FAIL+1))
fi

# =============================================================================
# 12. Cleanup — delete the test collection
# =============================================================================
echo ""
echo -e "${YELLOW}--- 12. Cleanup ---${NC}"
DEL=$(curl -s -X DELETE "$BASE/collections/$COLL_ID" \
  -H "Authorization: Bearer $TOKEN")
check "DELETE /collections/:id removes the collection" "$DEL" '"success":true'

# Verify it's gone
GONE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/collections/$COLL_ID" \
  -H "Authorization: Bearer $TOKEN")
if [ "$GONE" = "404" ]; then
  echo -e "${GREEN}✅ PASS${NC} — Collection returns 404 after deletion"
  PASS=$((PASS+1))
else
  echo -e "${RED}❌ FAIL${NC} — Expected 404 after deletion, got $GONE"
  FAIL=$((FAIL+1))
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "============================================"
TOTAL=$((PASS+FAIL))
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}All $TOTAL tests passed ✅${NC}"
else
  echo -e "${RED}$FAIL/$TOTAL tests FAILED ❌${NC} — $PASS passed"
fi
echo "============================================"
echo ""
