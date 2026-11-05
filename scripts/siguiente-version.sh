#!/usr/bin/env bash
# Calcula la siguiente versión semántica a partir de los commits desde el
# último tag vX.Y.Z (Conventional Commits). Imprime la versión SIN la "v".
#
#   feat!: ... / BREAKING CHANGE   -> MAYOR (1.4.2 -> 2.0.0)
#   feat: ...                      -> MENOR (1.4.2 -> 1.5.0)
#   cualquier otro (fix, chore...) -> PARCHE (1.4.2 -> 1.4.3)
#
# Sin tags previos, la primera versión es la de app.json (expo.version).
# Requiere el historial completo (actions/checkout con fetch-depth: 0).
set -euo pipefail

# El tag más alto del repo (no solo los alcanzables desde HEAD): así una rama
# release que aún no recibe el merge de main no repite una versión publicada.
ultimo_tag="$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' --sort=-v:refname | head -n 1)"

if [ -z "$ultimo_tag" ]; then
  node -p "require('./app.json').expo.version"
  exit 0
fi

commits="$(git log "${ultimo_tag}..HEAD" --format='%s%n%b')"

if [ -z "$(git rev-list "${ultimo_tag}..HEAD")" ]; then
  # Nada nuevo desde el último tag: se repite la misma versión.
  echo "${ultimo_tag#v}"
  exit 0
fi

IFS=. read -r mayor menor parche <<< "${ultimo_tag#v}"

if grep -qE '^[a-z]+(\([^)]*\))?!:|BREAKING CHANGE' <<< "$commits"; then
  echo "$((mayor + 1)).0.0"
elif grep -qE '^feat(\([^)]*\))?:' <<< "$commits"; then
  echo "${mayor}.$((menor + 1)).0"
else
  echo "${mayor}.${menor}.$((parche + 1))"
fi
