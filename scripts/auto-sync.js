#!/usr/bin/env node

/**
 * Auto-sync script for CCEP Sustainability Analytics
 * Watches for file changes and automatically commits and pushes to GitHub
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
// Using built-in fs.watch instead of chokidar for simplicity

class AutoSync {
  constructor() {
    this.isProcessing = false;
    this.pendingChanges = new Set();
    this.debounceTimer = null;
    this.debounceDelay = 5000; // 5 seconds delay to batch changes
    
    // Files and directories to watch
    this.watchPaths = [
      'srv/**/*',
      'db/**/*',
      'app/**/*',
      'config/**/*',
      'docs/**/*',
      'test/**/*',
      '*.js',
      '*.json',
      '*.md',
      '*.cds',
      '*.xml'
    ];
    
    // Files to ignore
    this.ignorePaths = [
      'node_modules/**',
      '.git/**',
      'logs/**',
      '*.log',
      '*.db',
      '*.sqlite',
      'coverage/**',
      '.nyc_output/**',
      'dist/**',
      'build/**'
    ];
  }

  start() {
    console.log('🔄 Starting CCEP Auto-Sync...');
    console.log('📁 Watching for changes in:', this.watchPaths.join(', '));
    
    const watcher = chokidar.watch(this.watchPaths, {
      ignored: this.ignorePaths,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      }
    });

    watcher
      .on('add', (filePath) => this.handleFileChange('added', filePath))
      .on('change', (filePath) => this.handleFileChange('modified', filePath))
      .on('unlink', (filePath) => this.handleFileChange('deleted', filePath))
      .on('error', (error) => console.error('❌ Watcher error:', error));

    console.log('✅ Auto-sync is now active!');
    console.log('💡 Make changes to your files and they will be automatically synced to GitHub');
    console.log('🛑 Press Ctrl+C to stop auto-sync');
  }

  handleFileChange(action, filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`📝 File ${action}: ${relativePath}`);
    
    this.pendingChanges.add(relativePath);
    
    // Debounce to batch multiple changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.processChanges();
    }, this.debounceDelay);
  }

  async processChanges() {
    if (this.isProcessing || this.pendingChanges.size === 0) {
      return;
    }

    this.isProcessing = true;
    const changedFiles = Array.from(this.pendingChanges);
    this.pendingChanges.clear();

    try {
      console.log(`\n🔄 Processing ${changedFiles.length} changed file(s)...`);
      
      // Check if there are actually changes to commit
      const hasChanges = await this.checkForChanges();
      if (!hasChanges) {
        console.log('ℹ️  No changes to commit');
        this.isProcessing = false;
        return;
      }

      // Add all changes
      await this.execCommand('git add .');
      console.log('✅ Added changes to staging');

      // Create commit message
      const commitMessage = this.generateCommitMessage(changedFiles);
      await this.execCommand(`git commit -m "${commitMessage}"`);
      console.log('✅ Created commit:', commitMessage);

      // Push to GitHub (the post-commit hook will handle this)
      console.log('🚀 Pushing to GitHub...');
      
      console.log('🎉 Auto-sync completed successfully!');
      console.log('🔗 View changes at: https://github.com/SK2252/capm\n');
      
    } catch (error) {
      console.error('❌ Auto-sync failed:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  async checkForChanges() {
    try {
      const result = await this.execCommand('git status --porcelain');
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  generateCommitMessage(changedFiles) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    if (changedFiles.length === 1) {
      const file = changedFiles[0];
      const action = this.getFileAction(file);
      return `Auto-sync: ${action} ${file} (${timestamp})`;
    } else {
      const fileTypes = this.categorizeFiles(changedFiles);
      return `Auto-sync: Updated ${changedFiles.length} files - ${fileTypes} (${timestamp})`;
    }
  }

  getFileAction(filePath) {
    if (filePath.includes('srv/')) return 'Updated service';
    if (filePath.includes('app/')) return 'Updated frontend';
    if (filePath.includes('db/')) return 'Updated database';
    if (filePath.includes('test/')) return 'Updated tests';
    if (filePath.includes('docs/')) return 'Updated documentation';
    if (filePath.endsWith('.md')) return 'Updated documentation';
    if (filePath.endsWith('.json')) return 'Updated configuration';
    return 'Updated';
  }

  categorizeFiles(files) {
    const categories = {
      services: files.filter(f => f.includes('srv/')).length,
      frontend: files.filter(f => f.includes('app/')).length,
      database: files.filter(f => f.includes('db/')).length,
      tests: files.filter(f => f.includes('test/')).length,
      docs: files.filter(f => f.includes('docs/') || f.endsWith('.md')).length,
      config: files.filter(f => f.endsWith('.json') || f.includes('config/')).length
    };

    const parts = [];
    if (categories.services > 0) parts.push(`${categories.services} service file(s)`);
    if (categories.frontend > 0) parts.push(`${categories.frontend} frontend file(s)`);
    if (categories.database > 0) parts.push(`${categories.database} database file(s)`);
    if (categories.tests > 0) parts.push(`${categories.tests} test file(s)`);
    if (categories.docs > 0) parts.push(`${categories.docs} documentation file(s)`);
    if (categories.config > 0) parts.push(`${categories.config} config file(s)`);

    return parts.join(', ') || `${files.length} file(s)`;
  }

  execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping auto-sync...');
  console.log('👋 Auto-sync stopped. Your changes are safe!');
  process.exit(0);
});

// Start the auto-sync
const autoSync = new AutoSync();
autoSync.start();
