import { google } from "@ai-sdk/google";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { httpRouter } from "convex/server";
import { z } from "zod";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/api/chat",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    const lastMessages = messages.slice(-10);

    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: `
      You are a helpful assistant that can search through the user's notes.
      Use the information from the notes to answer questions and provide insights.
      If the requested information is not available, respond with "Sorry, I can't find that information in your notes".
      You can use markdown formatting like links, bullet points, numbered lists, and bold text.
      Provide links to relevant notes using this relative URL structure (omit the base URL): ${process.env.SITE_URL}/notes?noteId=<note-id>'.
      Keep your responses concise and to the point.
      `,
      messages: convertToModelMessages(lastMessages),
      stopWhen: stepCountIs(3),
      tools: {
        findRelevantNotes: tool({
          description:
            "Retrieve relevant notes from the database based on the user's query",
          inputSchema: z.object({
            query: z.string().describe("The user's query"),
          }),
          execute: async ({ query }) => {
            const relevantNotes = await ctx.runAction(
              internal.notes_action.findRelatedNotes,
              {
                query,
                userId,
              }
            );
            return relevantNotes.map((note) => ({
              id: note._id,
              title: note.title,
              body: note.body,
              creationTime: note._creationTime,
            }));
          },
        }),
      },
      onError(error) {
        console.error("streamText error:", error);
      },
    });

    return result.toUIMessageStreamResponse({
      headers: new Headers({
        "Access-Control-Allow-Origin": "*",
        Vary: "origin",
      }),
    });
  }),
});

http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

export default http;
