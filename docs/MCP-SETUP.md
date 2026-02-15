# Supabase MCP Setup

The Supabase MCP server is configured in **`.cursor/mcp.json`**. It uses Supabase’s hosted MCP so you can inspect and change your project from Cursor.

## First-time use

1. Restart Cursor (or reload the window) so it picks up `.cursor/mcp.json`.
2. When you use Supabase MCP tools, Cursor will open a browser window to log in to Supabase and grant access.
3. In Cursor: **Settings → Cursor Settings → Tools & MCP** and confirm the “supabase” server is connected.

## Optional: scope to one project

To limit the MCP to a single Supabase project, add a `project_ref` query parameter. The project ref is the subdomain of your project URL (e.g. `https://YOUR_REF.supabase.co` → ref is `YOUR_REF`).

Edit `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
    }
  }
}
```

Replace `YOUR_PROJECT_REF` with your ref (from Supabase Dashboard → Project Settings → General, or from your project URL).

## Optional: read-only mode

To run all SQL as read-only:

```json
"url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=true"
```

## What the MCP can do

- **Database**: `execute_sql`, `apply_migration`, `list_tables`, `list_migrations`, etc.
- **Debugging**: `get_logs`, `get_advisors`
- **Development**: `generate_typescript_types`, `get_project_url`, `get_publishable_keys`
- **Edge Functions**: `list_edge_functions`, `get_edge_function`, `deploy_edge_function`
- **Docs**: `search_docs`

See [Supabase MCP docs](https://supabase.com/mcp) for the full list and security notes.
