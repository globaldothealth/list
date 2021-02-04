#!/bin/sh

git config --global url."https://github.com/".insteadOf git@github.com:
git config --global url."https://".insteadOf ssh://
npm i