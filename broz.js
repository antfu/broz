#!/usr/bin/env node
'use strict'
const execa = require('execa')
const path = require('path')

const args = [path.resolve(__dirname, 'index.js'), process.argv[2] || '']
execa.sync(String(require('electron')), args, { stdio: 'inherit' })
