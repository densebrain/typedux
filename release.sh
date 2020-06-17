#!/usr/bin/env bash

set -e
yarn compile
yarn test
npm version patch
git push --tags

mkdir -p dist
cp package.json dist/package.json
cd dist

npm publish