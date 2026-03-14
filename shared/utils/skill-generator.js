import { CONFIG } from '../config.js';

export function generateSkillContent(skillConfig, mcpConfig, webId, authEnabled, authToken) {
  const skillName = skillConfig?.name || mcpConfig?.name || 'MCP Server';
  const skillDescription = skillConfig?.description || 'Use this skill to interact with the MCP server via HTTP requests.';
  const workerDomain = CONFIG.WORKER_DOMAIN;

  let content = `---
name: ${skillName}
description: ${skillDescription}
---

# ${skillName}

## Parameters

Define these parameters for all API requests:
- \`baseURL\`: \`https://${workerDomain}\`
- \`webId\`: \`${webId}\`
`;

  if (authEnabled) {
    content += `- \`authToken\`: \`${authToken}\`
`;
  }

  content += `
## Workflow

1. **Check Service Status** → \`GET /api/{webId}/mcp/config\`
2. **List Available Tools** → \`GET /api/{webId}/mcp/tools/list\`
3. **Execute Tool** → \`POST /api/{webId}/mcp/{toolName}\`

`;

  if (authEnabled) {
    content += `## Authentication

Include this header in ALL requests:

\`\`\`
Authorization: Bearer {authToken}
\`\`\`

`;
  }

  content += `## API Reference

### Check Service Status

\`\`\`
GET {baseURL}/api/{webId}/mcp/config
\`\`\`

Returns service configuration and confirms the service is online.

### List Available Tools

\`\`\`
GET {baseURL}/api/{webId}/mcp/tools/list
\`\`\`

Returns a list of all available tools with their input schemas.

### Execute a Tool

\`\`\`
POST {baseURL}/api/{webId}/mcp/{toolName}
Content-Type: application/json

{"argName": "value"}
\`\`\`

Execute a tool with arguments as JSON body.

`;

  if (skillConfig?.usageNotes?.trim()) {
    content += `## Usage Notes

${skillConfig.usageNotes}
`;
  }

  return content;
}
