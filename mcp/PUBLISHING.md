# Publishing RCSX MCP Server to npm

## 📦 Pre-Publishing Checklist

✅ Package.json updated with scoped name `@rcsx/mcp-server`  
✅ Server.js made executable (`chmod +x server.js`)  
✅ README.md created with usage instructions  
✅ .npmignore configured to include only essential files  
✅ Dry run test completed successfully  

## 🚀 Publishing Steps

### 1. Login to npm
```bash
npm login
# Enter your npm credentials
```

### 2. Publish the Package
```bash
cd /Users/Morsy/Documents/dev/rcs/mcp/servers/rcsx-mcp-server
npm publish
```

### 3. Verify Publication
```bash
npm view @rcsx/mcp-server
```

## 👥 User Installation

Once published, users can install with:
```bash
npx @rcsx/mcp-server
```

## 🔧 Claude Desktop Configuration

Users add this to their `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "rcsx": {
      "command": "npx",
      "args": ["@rcsx/mcp-server"],
      "env": {
        "RCSX_SERVER_URL": "https://rcsx.specialized.live",
        "RCSX_API_KEY": "user_api_key_from_dashboard"
      }
    }
  }
}
```

## 📈 Version Updates

To publish updates:
```bash
# Update version in package.json
npm version patch  # or minor, major
npm publish
```

## 🎯 Package Contents

The published package includes:
- `server.js` - Main MCP server executable
- `README.md` - Usage documentation  
- `package.json` - Package metadata

Total size: ~3.7 kB compressed, 11.7 kB unpacked

## ✅ Ready to Publish!

The package is prepared and tested. Run `npm publish` when ready to make it available to users.
