#!/usr/bin/env node
'use strict'
const { execFileSync } = require('child_process')
const path = require('path')

const args = [path.resolve(__dirname, 'index.js'), process.argv[2] || '']
execFileSync(String(require('electron')), args)
