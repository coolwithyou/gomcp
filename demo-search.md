# MCP Server Search Demo

The gomcp CLI now includes a search/filter functionality when installing MCP servers.

## How it works:

1. When you select "Install new servers", you'll see a new interface:

```
Currently selected: 0 server(s). What would you like to do?
❯ 🔍 Search for servers by name
  📋 Browse all servers  
  ✓ Done selecting (nothing selected)
  ────────────────────
  ← Back to previous menu
```

2. Select "🔍 Search for servers by name" to search:
   - Enter a search term (e.g., "github" to find GitHub-related servers)
   - The list will be filtered to show only matching servers

3. Select "📋 Browse all servers" to see all available servers without filtering

4. In the server selection:
   - Servers marked with ✓ are already selected
   - Use space to toggle selection
   - Use enter to confirm your selections
   - Selected servers will show "(selected)" suffix

5. You can search multiple times:
   - Search for "github" and select some servers
   - Go back and search for "file" to find filesystem-related servers
   - Your previous selections are preserved

6. When done, select "✓ Done selecting" to proceed with installation

## Example workflow:

1. Choose "Install new servers"
2. Choose installation scope (User/Project)
3. Select "🔍 Search for servers by name"
4. Type "github" to find GitHub-related servers
5. Select the servers you want
6. Go back to search menu
7. Search for another term or select "Done selecting"
8. Proceed with installation

This makes it much easier to find specific servers when the list grows large!