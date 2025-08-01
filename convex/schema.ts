import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  notes: defineTable({
    title: v.string(),
    body: v.string(),
    userId: v.id("users"),
  }).index("by_userId", ["userId"]),
  noteEmbeddings: defineTable({
    content: v.string(),
    embedding: v.array(v.float64()),
    noteId: v.id("notes"),
    userId: v.id("users"),
  })
    .index("by_notedId", ["noteId"])
    .index("by_userId", ["userId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: ["userId"],
    }),
});
export default schema;
