#!/usr/bin/env node
'use strict'
const process = require('node:process')
const { execFileSync } = require('node:child_process')
const path = require('node:path')

const args = [path.resolve(__dirname, 'index.js'), ...Array.from(process.argv).slice(2)]
execFileSync(String(require('electron')), args, { stdio: 'inherit' })
