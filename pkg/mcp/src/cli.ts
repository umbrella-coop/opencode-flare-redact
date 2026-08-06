#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './index.js';

const cwd = process.env.FLARE_REDACT_PROJECT_DIR ?? process.cwd();
const server = createMcpServer(cwd);
await server.connect(new StdioServerTransport());
