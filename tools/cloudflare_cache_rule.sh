#!/usr/bin/env bash
# Adds a Cloudflare Cache Rule so that the 3D models (/minitel/models/) and the
# Basis transcoder (/minitel/basis/) of sterenna.fr are cached at the edge.
# Without it Cloudflare treats .glb and .wasm as dynamic and every visit hits
# the OVH origin (docs/ASSETS.md, "Compression").
#
# Usage (Git Bash) :
#   export CLOUDFLARE_API_TOKEN=...   # API token : Zone > Cache Rules > Edit
#                                     #             Zone > Zone > Read
#                                     # restricted to the sterenna.fr zone
#   bash tools/cloudflare_cache_rule.sh            # dry run : shows what it would do
#   bash tools/cloudflare_cache_rule.sh --apply    # creates the rule
#
# Idempotent : does nothing if a rule with the same description exists. Never
# replaces the zone's other cache rules (adds to the existing ruleset).
set -euo pipefail

ZONE_NAME="sterenna.fr"
DESCRIPTION="Minitel - modeles 3D"
EXPRESSION='(starts_with(http.request.uri.path, "/minitel/models/")) or (starts_with(http.request.uri.path, "/minitel/basis/"))'
API="https://api.cloudflare.com/client/v4"
APPLY=false
[[ "${1:-}" == "--apply" ]] && APPLY=true

: "${CLOUDFLARE_API_TOKEN:?définir CLOUDFLARE_API_TOKEN, voir le commentaire en tête du script}"
call() { curl -sS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json" "$@"; }
json() { python -c "import json,sys; d=json.load(sys.stdin); $1"; }

zone_id=$(call "$API/zones?name=$ZONE_NAME" | json 'print(d["result"][0]["id"] if d.get("success") and d["result"] else "")')
[[ -n "$zone_id" ]] || { echo "Zone $ZONE_NAME introuvable : vérifier le token (Zone > Zone > Read)." >&2; exit 1; }
echo "Zone $ZONE_NAME : $zone_id"

rule=$(python -c "import json,sys; print(json.dumps({
  'description': sys.argv[1], 'expression': sys.argv[2], 'action': 'set_cache_settings', 'enabled': True,
  'action_parameters': {'cache': True, 'edge_ttl': {'mode': 'respect_origin'}, 'browser_ttl': {'mode': 'respect_origin'}}}))" \
  "$DESCRIPTION" "$EXPRESSION")

entry=$(call "$API/zones/$zone_id/rulesets/phases/http_request_cache_settings/entrypoint")
exists=$(echo "$entry" | json 'print("yes" if d.get("success") else "no")')

if [[ "$exists" == "yes" ]]; then
  ruleset_id=$(echo "$entry" | json 'print(d["result"]["id"])')
  echo "Règles de cache existantes : $(echo "$entry" | json 'print(", ".join(r.get("description") or r["id"] for r in d["result"].get("rules", [])) or "aucune")')"
  if echo "$entry" | DESC="$DESCRIPTION" python -c "import json,os,sys; d=json.load(sys.stdin); sys.exit(0 if any(r.get('description')==os.environ['DESC'] for r in d['result'].get('rules',[])) else 1)"; then
    echo "La règle « $DESCRIPTION » existe déjà : rien à faire."; exit 0
  fi
  echo "Ajout de la règle « $DESCRIPTION » au jeu de règles $ruleset_id."
  $APPLY || { echo "(essai à blanc : relancer avec --apply)"; exit 0; }
  call -X POST "$API/zones/$zone_id/rulesets/$ruleset_id/rules" --data "$rule" | json 'print("OK" if d.get("success") else d.get("errors"))'
else
  echo "Aucune règle de cache sur la zone : création du jeu de règles avec « $DESCRIPTION »."
  $APPLY || { echo "(essai à blanc : relancer avec --apply)"; exit 0; }
  call -X PUT "$API/zones/$zone_id/rulesets/phases/http_request_cache_settings/entrypoint" \
    --data "{\"rules\": [$rule]}" | json 'print("OK" if d.get("success") else d.get("errors"))'
fi

echo "Vérification (premier appel MISS, second HIT) :"
for i in 1 2; do
  curl -sI "https://$ZONE_NAME/minitel/models/minitel.glb" | grep -i "cf-cache-status" || true
done
