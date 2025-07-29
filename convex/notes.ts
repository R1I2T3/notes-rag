import { getAuthUserId } from "@convex-dev/auth/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
export const createNoteWithEmbeddings = internalMutation({
  args: {
    title: v.string(),
    body: v.string(),
    userId: v.id("users"),
    embeddings: v.array(
      v.object({
        embedding: v.array(v.float64()),
        content: v.string(),
      })
    ),
  },
  returns: v.id("notes"),
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("Unauthorized");
    }
    const note = await ctx.db.insert("notes", {
      title: args.title,
      body: args.body,
      userId: args.userId,
    });
    for (const embeddingData of args.embeddings) {
      await ctx.db.insert("noteEmbeddings", {
        content: embeddingData.content,
        embedding: embeddingData.embedding,
        noteId: note,
        userId: args.userId,
      });
    }
    return note;
  },
});

export const updateNoteWithEmbeddings = internalMutation({
  args: {
    title: v.string(),
    body: v.string(),
    userId: v.id("users"),
    noteId: v.id("notes"),
    embeddings: v.array(
      v.object({
        embedding: v.array(v.float64()),
        content: v.string(),
      })
    ),
  },
  returns: v.id("notes"),
  handler: async (ctx, args) => {
    if (!args.userId) {
      throw new Error("Unauthorized");
    }
    const currentNote = await ctx.db.get(args.noteId);
    if (!currentNote || currentNote.userId !== args.userId) {
      throw new Error("Note not found or unauthorized");
    }
    await ctx.db.patch(args.noteId, {
      title: args.title,
      body: args.body,
    });
    const existingEmbeddings = await ctx.db
      .query("noteEmbeddings")
      .withIndex("by_notedId", (q) => q.eq("noteId", args.noteId))
      .collect();
    for (const embedding of existingEmbeddings) {
      await ctx.db.delete(embedding._id);
    }
    for (const embeddingData of args.embeddings) {
      await ctx.db.insert("noteEmbeddings", {
        content: embeddingData.content,
        embedding: embeddingData.embedding,
        noteId: args.noteId,
        userId: args.userId,
      });
    }
    return args.noteId;
  },
});
export const getUserNotes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return notes;
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }

    const embeddings = await ctx.db
      .query("noteEmbeddings")
      .withIndex("by_notedId", (q) => q.eq("noteId", args.noteId))
      .collect();
    for (const embedding of embeddings) {
      await ctx.db.delete(embedding._id);
    }
    await ctx.db.delete(args.noteId);
    return true;
  },
});

export const fetchNotesByEmbeddingIds = internalQuery({
  args: {
    embeddingIds: v.array(v.id("noteEmbeddings")),
  },
  handler: async (ctx, args) => {
    const embeddings = [];
    for (const id of args.embeddingIds) {
      const embedding = await ctx.db.get(id);
      if (embedding !== null) {
        embeddings.push(embedding);
      }
    }
    const uniqueNoteIds = [
      ...new Set(embeddings.map((embedding) => embedding.noteId)),
    ];

    const results = [];
    for (const id of uniqueNoteIds) {
      const note = await ctx.db.get(id);
      if (note !== null) {
        results.push(note);
      }
    }

    return results;
  },
});
