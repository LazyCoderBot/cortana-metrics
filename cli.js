#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const CollectionManager = require('./collection-manager');

/**
 * CLI tool for managing OpenAPI specifications
 */
class OpenAPISpecCLI {
  constructor() {
    this.commands = {
      'list': this.listCollections.bind(this),
      'stats': this.showStats.bind(this),
      'export': this.exportCollections.bind(this),
      'merge': this.mergeCollections.bind(this),
      'version': this.createVersion.bind(this),
      'backup': this.createBackup.bind(this),
      'help': this.showHelp.bind(this)
    };
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    
    if (!this.commands[command]) {
      console.error(`❌ Unknown command: ${command}`);
      this.showHelp();
      process.exit(1);
    }

    try {
      await this.commands[command](args.slice(1));
    } catch (error) {
      console.error(`❌ Error executing command: ${error.message}`);
      process.exit(1);
    }
  }

  async listCollections(args) {
    const baseDir = args[0] || './openapi-specs';
    
    if (!fs.existsSync(baseDir)) {
      console.log('📁 No collections directory found');
      return;
    }

    console.log('📚 Available OpenAPI Specifications:');
    console.log('='.repeat(50));

    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    const collections = entries.filter(entry => entry.isDirectory());

    if (collections.length === 0) {
      console.log('   No collections found');
      return;
    }

    collections.forEach(collection => {
      const collectionDir = path.join(baseDir, collection.name);
      const latestFile = path.join(collectionDir, `${collection.name}_latest.json`);
      
      console.log(`\n📁 ${collection.name.replace(/_/g, ' ')}`);
      
      if (fs.existsSync(latestFile)) {
        try {
          const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
          const requestCount = this.countRequests(data);
          const lastUpdated = data.info.updatedAt || 'Unknown';
          
          console.log(`   📊 Requests: ${requestCount}`);
          console.log(`   📅 Last Updated: ${lastUpdated}`);
          console.log(`   📄 File: ${latestFile}`);
        } catch (error) {
          console.log(`   ❌ Error reading collection: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️  No latest file found`);
      }
    });
  }

  async showStats(args) {
    const baseDir = args[0] || './openapi-specs';
    
    try {
      const manager = new CollectionManager({ baseDir });
      const stats = manager.getAllStats();
      
      console.log('📊 OpenAPI Specification Statistics:');
      console.log('='.repeat(50));
      console.log(`📚 Total Collections: ${stats.totalCollections}`);
      console.log(`📝 Total Requests: ${stats.totalRequests}`);
      console.log(`📁 Total Folders: ${stats.totalFolders}`);
      
      if (Object.keys(stats.collections).length > 0) {
        console.log('\n📋 Collection Details:');
        Object.entries(stats.collections).forEach(([name, collectionStats]) => {
          console.log(`\n  📁 ${name}:`);
          console.log(`     📝 Requests: ${collectionStats.totalRequests}`);
          console.log(`     📁 Folders: ${collectionStats.totalFolders}`);
          console.log(`     📅 Last Updated: ${collectionStats.lastUpdated || 'Unknown'}`);
          console.log(`     🆔 ID: ${collectionStats.collectionId}`);
        });
      }
    } catch (error) {
      console.error(`❌ Error getting stats: ${error.message}`);
    }
  }

  async exportCollections(args) {
    const baseDir = args[0] || './openapi-specs';
    const format = args[1] || 'json';
    const outputFile = args[2];
    
    try {
      const manager = new CollectionManager({ baseDir });
      const exports = manager.exportAllCollections(format, { saveToFile: !!outputFile });
      
      if (outputFile) {
        fs.writeFileSync(outputFile, JSON.stringify(exports, null, 2));
        console.log(`✅ Collections exported to: ${outputFile}`);
      } else {
        console.log('📤 Exported Collections:');
        console.log('='.repeat(50));
        Object.entries(exports).forEach(([name, data]) => {
          console.log(`\n📁 ${name}:`);
          console.log(`   📊 Requests: ${data.stats.totalRequests}`);
          console.log(`   📁 Path: ${data.path}`);
        });
      }
    } catch (error) {
      console.error(`❌ Error exporting collections: ${error.message}`);
    }
  }

  async mergeCollections(args) {
    if (args.length < 2) {
      console.error('❌ Usage: merge <collection1> <collection2> [collection3...] <target-name>');
      return;
    }

    const baseDir = './openapi-specs';
    const targetName = args.pop();
    const sourceCollections = args;
    
    try {
      const manager = new CollectionManager({ baseDir });
      const result = manager.mergeCollections(sourceCollections, targetName, {
        prefixWithCollectionName: true
      });
      
      console.log(`✅ Successfully merged collections into: ${targetName}`);
      console.log(`📁 Output path: ${result.options.outputDir}`);
    } catch (error) {
      console.error(`❌ Error merging collections: ${error.message}`);
    }
  }

  async createVersion(args) {
    if (args.length < 1) {
      console.error('❌ Usage: version <version-number> [base-dir]');
      return;
    }

    const version = args[0];
    const baseDir = args[1] || './openapi-specs';
    
    try {
      const manager = new CollectionManager({ baseDir });
      const results = {};
      
      manager.collections.forEach((generator, name) => {
        try {
          results[name] = manager.createVersion(name, version);
          console.log(`✅ Version ${version} created for: ${name}`);
        } catch (error) {
          results[name] = { error: error.message };
          console.error(`❌ Error creating version for ${name}: ${error.message}`);
        }
      });
      
      console.log(`\n📦 Version ${version} creation summary:`);
      Object.entries(results).forEach(([name, result]) => {
        if (result.error) {
          console.log(`   ❌ ${name}: ${result.error}`);
        } else {
          console.log(`   ✅ ${name}: ${result}`);
        }
      });
    } catch (error) {
      console.error(`❌ Error creating versions: ${error.message}`);
    }
  }

  async createBackup(args) {
    const baseDir = args[0] || './openapi-specs';
    const collectionName = args[1];
    
    try {
      const manager = new CollectionManager({ baseDir });
      
      if (collectionName) {
        manager.createBackup(collectionName);
        console.log(`✅ Backup created for: ${collectionName}`);
      } else {
        // Backup all collections
        manager.collections.forEach((generator, name) => {
          manager.createBackup(name);
          console.log(`✅ Backup created for: ${name}`);
        });
      }
    } catch (error) {
      console.error(`❌ Error creating backup: ${error.message}`);
    }
  }

  showHelp() {
    console.log('🚀 OpenAPI Specification Manager CLI');
    console.log('='.repeat(50));
    console.log('Usage: node cli.js <command> [options]');
    console.log('\nCommands:');
    console.log('  list [base-dir]                     List all collections');
    console.log('  stats [base-dir]                    Show collection statistics');
    console.log('  export [base-dir] [format] [file]   Export collections');
    console.log('  merge <col1> <col2> ... <target>    Merge collections');
    console.log('  version <version> [base-dir]        Create version snapshots');
    console.log('  backup [base-dir] [collection]      Create backups');
    console.log('  help                                Show this help');
    console.log('\nExamples:');
    console.log('  node cli.js list');
    console.log('  node cli.js stats ./my-collections');
    console.log('  node cli.js export ./collections json output.json');
    console.log('  node cli.js merge "API v1" "API v2" "Combined API"');
    console.log('  node cli.js version 2.1.0');
    console.log('  node cli.js backup ./collections "Main API"');
  }

  countRequests(collection) {
    let count = 0;
    
    if (collection.item) {
      collection.item.forEach(item => {
        if (Array.isArray(item.item)) {
          // It's a folder
          count += item.item.length;
        } else {
          // It's a request
          count += 1;
        }
      });
    }
    
    return count;
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new OpenAPISpecCLI();
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  });
}

module.exports = OpenAPISpecCLI;
