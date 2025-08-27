# Multi-stage build for RCSX MCP Service
FROM node:18-alpine AS base

# Install dependencies
WORKDIR /app
COPY mcp/service/package.json ./
COPY mcp/servers/rcsx-mcp-server/package.json ./mcp-server/
RUN npm install && cd mcp-server && npm install

# Copy source code
COPY mcp/service/ ./
COPY mcp/servers/rcsx-mcp-server/ ./mcp-server/

# Production stage
FROM node:18-alpine AS production

WORKDIR /app
COPY --from=base /app ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S rcsx -u 1001

# Set ownership
RUN chown -R rcsx:nodejs /app
USER rcsx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

# Expose port
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the service
CMD ["npm", "start"]
