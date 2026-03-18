#!/bin/bash
# =============================================================================
# R2 File Storage Test Script
# Run from: ~/Documents/music-agent-mvp/file-handler/
# Usage:    bash test-r2.sh
# =============================================================================

BASE="http://localhost:3001"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check() {
  local label="$1"
  local output="$2"
  local expected="$3"
  if echo "$output" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASS${NC} — $label"
    PASS=$((PASS+1))
  else
    echo -e "${RED}❌ FAIL${NC} — $label"
    echo "   Expected: $expected"
    echo "   Got: $output"
    FAIL=$((FAIL+1))
  fi
}

# =============================================================================
# 0. AUTH
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

# =============================================================================
# 1. Find a real release ID from the DB
# =============================================================================
echo ""
echo -e "${YELLOW}--- 1. Finding test data ---${NC}"
RELEASES=$(curl -s "$BASE/releases/" -H "Authorization: Bearer $TOKEN")
RELEASE_ID=$(echo "$RELEASES" | jq -r '.releases[0].releaseId // empty')

if [ -z "$RELEASE_ID" ]; then
  echo -e "${YELLOW}⚠️  No releases found — creating a test release first${NC}"
  CREATE_R=$(curl -s -X POST "$BASE/metadata" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"releaseId":"2026-01-01_R2Test_TestTrack","metadata":{"title":"R2 Test Track","artist":"R2 Test","genre":"Electronic","releaseType":"Single","releaseFormat":"Single"}}')
  RELEASE_ID="2026-01-01_R2Test_TestTrack"
  echo "   Created test release: $RELEASE_ID"
else
  echo "   Using release: $RELEASE_ID"
fi

# Find a real collection too
COLLECTIONS=$(curl -s "$BASE/collections" -H "Authorization: Bearer $TOKEN")
COLLECTION_ID=$(echo "$COLLECTIONS" | jq -r '.collections[0].collectionId // empty')

if [ -z "$COLLECTION_ID" ]; then
  echo -e "${YELLOW}⚠️  No collections found — creating a test collection${NC}"
  CREATE_C=$(curl -s -X POST "$BASE/collections" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"title":"R2 Test EP","artist":"R2 Test","collectionType":"EP"}')
  COLLECTION_ID=$(echo "$CREATE_C" | jq -r .collectionId)
  echo "   Created test collection: $COLLECTION_ID"
else
  echo "   Using collection: $COLLECTION_ID"
fi

# =============================================================================
# 2. Create a tiny test image (1x1 pixel PNG — no real image file needed)
# =============================================================================
echo ""
echo -e "${YELLOW}--- 2. Creating test files ---${NC}"
TEST_IMAGE="/tmp/test-artwork.png"
# Minimal valid PNG (1x1 red pixel)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' > "$TEST_IMAGE"
echo -e "${GREEN}✅ Test image created${NC} ($TEST_IMAGE)"

TEST_DOC="/tmp/test-notes-file.txt"
echo "This is a test notes attachment" > "$TEST_DOC"
echo -e "${GREEN}✅ Test document created${NC} ($TEST_DOC)"

# =============================================================================
# 3. Test release artwork upload
# =============================================================================
echo ""
echo -e "${YELLOW}--- 3. Release Artwork ---${NC}"

UPLOAD=$(curl -s -X POST "$BASE/releases/$RELEASE_ID/artwork" \
  -H "Authorization: Bearer $TOKEN" \
  -F "artwork=@$TEST_IMAGE")
check "POST /releases/:id/artwork — upload to R2" "$UPLOAD" '"success":true'

# Fetch artwork back (no auth — used in <img> tags)
ART_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/releases/$RELEASE_ID/artwork/")
if [ "$ART_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ PASS${NC} — GET /releases/:id/artwork/ returns 200"
  PASS=$((PASS+1))
else
  echo -e "${RED}❌ FAIL${NC} — GET /releases/:id/artwork/ returned $ART_STATUS"
  FAIL=$((FAIL+1))
fi

# Check content-type is an image
ART_CT=$(curl -s -I "$BASE/releases/$RELEASE_ID/artwork/" | grep -i "content-type" | head -1)
check "GET artwork has image content-type" "$ART_CT" "image/"

# Delete artwork
DEL_ART=$(curl -s -X DELETE "$BASE/releases/$RELEASE_ID/artwork" \
  -H "Authorization: Bearer $TOKEN")
check "DELETE /releases/:id/artwork — removes from R2" "$DEL_ART" '"success":true'

# After delete, should 404
ART_GONE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/releases/$RELEASE_ID/artwork/")
if [ "$ART_GONE" = "404" ]; then
  echo -e "${GREEN}✅ PASS${NC} — GET artwork returns 404 after delete"
  PASS=$((PASS+1))
else
  echo -e "${RED}❌ FAIL${NC} — Expected 404 after delete, got $ART_GONE"
  FAIL=$((FAIL+1))
fi

# Re-upload for visual confirmation
curl -s -X POST "$BASE/releases/$RELEASE_ID/artwork" \
  -H "Authorization: Bearer $TOKEN" \
  -F "artwork=@$TEST_IMAGE" > /dev/null

# =============================================================================
# 4. Test release notes file upload/download/delete
# =============================================================================
echo ""
echo -e "${YELLOW}--- 4. Release Notes Files ---${NC}"

NOTES_UP=$(curl -s -X POST "$BASE/releases/$RELEASE_ID/notes/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TEST_DOC")
check "POST /releases/:id/notes/files — upload to R2" "$NOTES_UP" '"success":true'

NOTES_DL=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE/releases/$RELEASE_ID/notes/files/test-notes-file.txt" \
  -H "Authorization: Bearer $TOKEN")
if [ "$NOTES_DL" = "200" ]; then
  echo -e "${GREEN}✅ PASS${NC} — GET /releases/:id/notes/files/:filename returns 200"
  PASS=$((PASS+1))
else
  echo -e "${RED}❌ FAIL${NC} — GET notes file returned $NOTES_DL"
  FAIL=$((FAIL+1))
fi

NOTES_DEL=$(curl -s -X DELETE \
  "$BASE/releases/$RELEASE_ID/notes/files/test-notes-file.txt" \
  -H "Authorization: Bearer $TOKEN")
check "DELETE /releases/:id/notes/files/:filename" "$NOTES_DEL" '"success":true'

# =============================================================================
# 5. Test collection artwork upload/serve/delete
# =============================================================================
echo ""
echo -e "${YELLOW}--- 5. Collection Artwork ---${NC}"

COLL_UP=$(curl -s -X POST "$BASE/collections/$COLLECTION_ID/artwork" \
  -H "Authorization: Bearer $TOKEN" \
  -F "artwork=@$TEST_IMAGE")
check "POST /collections/:id/artwork — upload to R2" "$COLL_UP" '"success":true'

COLL_ART=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/collections/$COLLECTION_ID/artwork")
if [ "$COLL_ART" = "200" ]; then
  echo -e "${GREEN}✅ PASS${NC} — GET /collections/:id/artwork returns 200"
  PASS=$((PASS+1))
else
  echo -e "${RED}❌ FAIL${NC} — GET collection artwork returned $COLL_ART"
  FAIL=$((FAIL+1))
fi

COLL_DEL=$(curl -s -X DELETE "$BASE/collections/$COLLECTION_ID/artwork" \
  -H "Authorization: Bearer $TOKEN")
check "DELETE /collections/:id/artwork" "$COLL_DEL" '"success":true'

# =============================================================================
# 6. Test collection notes file
# =============================================================================
echo ""
echo -e "${YELLOW}--- 6. Collection Notes Files ---${NC}"

CNOTES_UP=$(curl -s -X POST "$BASE/collections/$COLLECTION_ID/notes/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TEST_DOC")
check "POST /collections/:id/notes/files — upload to R2" "$CNOTES_UP" '"success":true'

CNOTES_DL=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE/collections/$COLLECTION_ID/notes/files/test-notes-file.txt" \
  -H "Authorization: Bearer $TOKEN")
if [ "$CNOTES_DL" = "200" ]; then
  echo -e "${GREEN}✅ PASS${NC} — GET /collections/:id/notes/files/:filename returns 200"
  PASS=$((PASS+1))
else
  echo -e "${RED}❌ FAIL${NC} — GET collection notes file returned $CNOTES_DL"
  FAIL=$((FAIL+1))
fi

CNOTES_DEL=$(curl -s -X DELETE \
  "$BASE/collections/$COLLECTION_ID/notes/files/test-notes-file.txt" \
  -H "Authorization: Bearer $TOKEN")
check "DELETE /collections/:id/notes/files/:filename" "$CNOTES_DEL" '"success":true'

# =============================================================================
# 7. Auth check — file endpoints reject unauthenticated requests
# =============================================================================
echo ""
echo -e "${YELLOW}--- 7. Auth protection ---${NC}"
NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/releases/$RELEASE_ID/artwork" \
  -F "artwork=@$TEST_IMAGE")
if [ "$NO_AUTH" = "401" ]; then
  echo -e "${GREEN}✅ PASS${NC} — POST artwork without token returns 401"
  PASS=$((PASS+1))
else
  echo -e "${RED}❌ FAIL${NC} — Expected 401, got $NO_AUTH"
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

# Cleanup temp files
rm -f "$TEST_IMAGE" "$TEST_DOC"
