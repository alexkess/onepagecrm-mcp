#!/usr/bin/env node

/**
 * OnePage CRM MCP Server
 *
 * An open-source Model Context Protocol server for the OnePage CRM API.
 * Manage contacts, deals, actions, notes, and pipelines — all from your
 * AI assistant.
 *
 * Created by Kess Media (https://kess.media)
 * License: MIT
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OnePageClient } from "./onepage-client.js";

// ── Config ──
const USER_ID = process.env.ONEPAGECRM_USER_ID;
const API_KEY = process.env.ONEPAGECRM_API_KEY;

if (!USER_ID) {
  console.error("Error: ONEPAGECRM_USER_ID environment variable is required");
  process.exit(1);
}

if (!API_KEY) {
  console.error("Error: ONEPAGECRM_API_KEY environment variable is required");
  process.exit(1);
}

const client = new OnePageClient({ userId: USER_ID, apiKey: API_KEY });

// ── Server ──
const server = new McpServer({
  name: "onepage-crm-mcp-server",
  version: "1.0.0",
});

// ── Tool: List Actions ──
server.tool(
  "crm_list_actions",
  "Pull the action stream from OnePage CRM. Returns next actions that are due today, overdue, or all. Filter by done/not done status.",
  {
    assignee_id: z.string().optional().describe("Filter by assignee user ID"),
    contact_id: z.string().optional().describe("Filter by contact ID"),
    status: z
      .enum(["asap", "date", "date_time", "waiting", "queued"])
      .optional()
      .describe("Filter by action status type"),
    done: z.boolean().optional().describe("Filter by completion: true=done, false=not done"),
    per_page: z.number().optional().describe("Results per page (default 10)"),
    page: z.number().optional().describe("Page number (0-based)"),
  },
  async (params) => {
    try {
      const queryParams: Record<string, string> = {};
      if (params.assignee_id) queryParams.assignee_id = params.assignee_id;
      if (params.contact_id) queryParams.contact_id = params.contact_id;
      if (params.status) queryParams.status = params.status;
      if (params.done !== undefined) queryParams.done = String(params.done);
      if (params.per_page !== undefined) queryParams.per_page = String(params.per_page);
      if (params.page !== undefined) queryParams.page = String(params.page);
      const result = await client.listActions(queryParams);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: Get Contact ──
server.tool(
  "crm_get_contact",
  "Get full contact detail from OnePage CRM by contact ID. Returns all fields including emails, phones, addresses, tags, custom fields, and next action.",
  {
    id: z.string().describe("The contact ID"),
  },
  async (params) => {
    try {
      const result = await client.getContact(params.id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: List Contacts ──
server.tool(
  "crm_list_contacts",
  "Search and list contacts in OnePage CRM. Supports text search, pagination, and filtering by letter, tag, or status.",
  {
    search: z.string().optional().describe("Search term to find contacts by name, email, phone, or company"),
    letter: z.string().optional().describe("Filter by first letter of last name"),
    tag: z.string().optional().describe("Filter by tag name"),
    status: z.string().optional().describe("Filter by lead status"),
    per_page: z.number().optional().describe("Results per page (default 10)"),
    page: z.number().optional().describe("Page number (0-based)"),
  },
  async (params) => {
    try {
      const queryParams: Record<string, string> = {};
      if (params.search) queryParams.search = params.search;
      if (params.letter) queryParams.letter = params.letter;
      if (params.tag) queryParams.tag = params.tag;
      if (params.status) queryParams.status = params.status;
      if (params.per_page !== undefined) queryParams.per_page = String(params.per_page);
      if (params.page !== undefined) queryParams.page = String(params.page);
      const result = await client.listContacts(queryParams);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: Create Contact ──
server.tool(
  "crm_create_contact",
  "Create a new contact in OnePage CRM with name, company, emails, status, background, and tags.",
  {
    first_name: z.string().describe("Contact first name"),
    last_name: z.string().optional().describe("Contact last name"),
    company_name: z.string().optional().describe("Company name"),
    emails: z
      .array(z.object({
        type: z.enum(["work", "home", "other"]).optional().describe("Email type"),
        value: z.string().describe("Email address"),
      }))
      .optional()
      .describe("Array of email objects"),
    phones: z
      .array(z.object({
        type: z.enum(["work", "home", "mobile", "fax", "direct", "other"]).optional().describe("Phone type"),
        value: z.string().describe("Phone number"),
      }))
      .optional()
      .describe("Array of phone objects"),
    status: z.string().optional().describe("Lead status (e.g. 'Lead', 'Prospect', 'Customer')"),
    background: z.string().optional().describe("Background/notes about the contact"),
    tags: z.array(z.string()).optional().describe("Array of tag names"),
  },
  async (params) => {
    try {
      const body: Record<string, unknown> = {
        first_name: params.first_name,
      };
      if (params.last_name) body.last_name = params.last_name;
      if (params.company_name) body.company_name = params.company_name;
      if (params.emails) body.emails = params.emails;
      if (params.phones) body.phones = params.phones;
      if (params.status) body.status = params.status;
      if (params.background) body.background = params.background;
      if (params.tags) body.tags = params.tags;
      const result = await client.createContact(body);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: Update Contact ──
server.tool(
  "crm_update_contact",
  "Update an existing contact's fields in OnePage CRM. Only include the fields you want to change.",
  {
    id: z.string().describe("The contact ID to update"),
    first_name: z.string().optional().describe("Updated first name"),
    last_name: z.string().optional().describe("Updated last name"),
    company_name: z.string().optional().describe("Updated company name"),
    emails: z
      .array(z.object({
        type: z.enum(["work", "home", "other"]).optional(),
        value: z.string(),
      }))
      .optional()
      .describe("Updated emails array"),
    phones: z
      .array(z.object({
        type: z.enum(["work", "home", "mobile", "fax", "direct", "other"]).optional(),
        value: z.string(),
      }))
      .optional()
      .describe("Updated phones array"),
    status: z.string().optional().describe("Updated lead status"),
    background: z.string().optional().describe("Updated background notes"),
    tags: z.array(z.string()).optional().describe("Updated tags array"),
  },
  async (params) => {
    try {
      const { id, ...fields } = params;
      const body: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) body[key] = value;
      }
      const result = await client.updateContact(id, body);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: Create Action ──
server.tool(
  "crm_create_action",
  "Set a next action on a contact in OnePage CRM. Actions are the core workflow driver — every contact should have a next action.",
  {
    contact_id: z.string().describe("The contact ID to set the action on"),
    text: z.string().describe("Action description (e.g. 'Follow up on proposal')"),
    date: z.string().optional().describe("Due date in YYYY-MM-DD format"),
    assignee_id: z.string().optional().describe("User ID to assign the action to"),
    status: z
      .enum(["asap", "date", "date_time", "waiting", "queued"])
      .optional()
      .describe("Action status type"),
  },
  async (params) => {
    try {
      const body: Record<string, unknown> = {
        text: params.text,
      };
      if (params.date) body.date = params.date;
      if (params.assignee_id) body.assignee_id = params.assignee_id;
      if (params.status) body.status = params.status;
      const result = await client.createAction(params.contact_id, body);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: Update Action ──
server.tool(
  "crm_update_action",
  "Update an existing action in OnePage CRM — change its text, push the date, mark as done, or reassign.",
  {
    id: z.string().describe("The action ID to update"),
    text: z.string().optional().describe("Updated action text"),
    date: z.string().optional().describe("Updated due date (YYYY-MM-DD)"),
    done: z.boolean().optional().describe("Set to true to mark as completed"),
    assignee_id: z.string().optional().describe("Reassign to a different user"),
    status: z
      .enum(["asap", "date", "date_time", "waiting", "queued"])
      .optional()
      .describe("Updated action status type"),
  },
  async (params) => {
    try {
      const { id, ...fields } = params;
      const body: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) body[key] = value;
      }
      const result = await client.updateAction(id, body);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: Complete Action ──
server.tool(
  "crm_complete_action",
  "Mark an action as done in OnePage CRM. This completes the action and moves the contact to needing a new next action.",
  {
    id: z.string().describe("The action ID to mark as done"),
  },
  async (params) => {
    try {
      const result = await client.completeAction(params.id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: Create Note ──
server.tool(
  "crm_create_note",
  "Log a note on a contact in OnePage CRM. Use for call logs, meeting notes, or any contact activity.",
  {
    contact_id: z.string().describe("The contact ID to add the note to"),
    text: z.string().describe("Note content"),
    date: z.string().optional().describe("Note date in YYYY-MM-DD format (defaults to today)"),
  },
  async (params) => {
    try {
      const body: Record<string, unknown> = {
        contact_id: params.contact_id,
        text: params.text,
      };
      if (params.date) body.date = params.date;
      const result = await client.createNote(body);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: List Notes ──
server.tool(
  "crm_list_notes",
  "Get notes for a contact in OnePage CRM. Returns the note history in reverse chronological order.",
  {
    contact_id: z.string().describe("The contact ID to get notes for"),
    per_page: z.number().optional().describe("Results per page"),
    page: z.number().optional().describe("Page number (0-based)"),
  },
  async (params) => {
    try {
      const queryParams: Record<string, string> = {};
      if (params.per_page !== undefined) queryParams.per_page = String(params.per_page);
      if (params.page !== undefined) queryParams.page = String(params.page);
      const result = await client.listNotes(params.contact_id, queryParams);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: List Deals ──
server.tool(
  "crm_list_deals",
  "List deals in OnePage CRM. Filter by pipeline, stage, status, or contact.",
  {
    contact_id: z.string().optional().describe("Filter by contact ID"),
    pipeline_id: z.string().optional().describe("Filter by pipeline ID"),
    stage: z.number().optional().describe("Filter by stage number"),
    status: z.enum(["won", "lost", "pending"]).optional().describe("Filter by deal status"),
    per_page: z.number().optional().describe("Results per page"),
    page: z.number().optional().describe("Page number (0-based)"),
  },
  async (params) => {
    try {
      const queryParams: Record<string, string> = {};
      if (params.contact_id) queryParams.contact_id = params.contact_id;
      if (params.pipeline_id) queryParams.pipeline_id = params.pipeline_id;
      if (params.stage !== undefined) queryParams.stage = String(params.stage);
      if (params.status) queryParams.status = params.status;
      if (params.per_page !== undefined) queryParams.per_page = String(params.per_page);
      if (params.page !== undefined) queryParams.page = String(params.page);
      const result = await client.listDeals(queryParams);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: Get Deal ──
server.tool(
  "crm_get_deal",
  "Get full deal detail from OnePage CRM by deal ID. Returns amount, stage, status, contact, and custom fields.",
  {
    id: z.string().describe("The deal ID"),
  },
  async (params) => {
    try {
      const result = await client.getDeal(params.id);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: Update Deal ──
server.tool(
  "crm_update_deal",
  "Update a deal in OnePage CRM — change stage, amount, status, expected close date, or other fields.",
  {
    id: z.string().describe("The deal ID to update"),
    name: z.string().optional().describe("Updated deal name"),
    amount: z.number().optional().describe("Updated deal amount"),
    stage: z.number().optional().describe("Updated stage number"),
    status: z.enum(["won", "lost", "pending"]).optional().describe("Updated deal status"),
    expected_close_date: z.string().optional().describe("Updated expected close date (YYYY-MM-DD)"),
    months: z.number().optional().describe("Deal duration in months"),
  },
  async (params) => {
    try {
      const { id, ...fields } = params;
      const body: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) body[key] = value;
      }
      const result = await client.updateDeal(id, body);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Tool: List Pipelines ──
server.tool(
  "crm_list_pipelines",
  "List all pipeline stages in OnePage CRM. Returns pipeline definitions with stage names and IDs.",
  {},
  async () => {
    try {
      const result = await client.listPipelines();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (e: unknown) {
      return { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true };
    }
  }
);

// ── Start ──
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OnePage CRM MCP Server running on stdio");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
