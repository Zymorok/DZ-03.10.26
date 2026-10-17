import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";

export const setTyping = mutation({
  args: { chatRoomId: v.id("chatRooms"), isTyping: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<void> => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await ctx.db.get(args.chatRoomId))) return;
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_and_room", (q) =>
        q.eq("userId", userId).eq("chatRoomId", args.chatRoomId),
      )
      .first();
    if (args.isTyping === false) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }
    const user = await ctx.db.get(userId);
    if (!user) return;
    const lastTypedAt = Date.now();
    let indicatorId = existing?._id;
    if (existing) {
      await ctx.db.patch(existing._id, { lastTypedAt });
    } else {
      indicatorId = await ctx.db.insert("typingIndicators", {
        chatRoomId: args.chatRoomId,
        userId,
        userName: user.fullname || user.name || user.email || "Користувач",
        lastTypedAt,
      });
    }
    await ctx.scheduler.runAfter(3000, internal.typing.expireTyping, {
      indicatorId: indicatorId!,
      lastTypedAt,
    });
  },
});

export const expireTyping = internalMutation({
  args: { indicatorId: v.id("typingIndicators"), lastTypedAt: v.number() },
  handler: async (ctx, args): Promise<void> => {
    const indicator = await ctx.db.get(args.indicatorId);
    if (indicator?.lastTypedAt === args.lastTypedAt)
      await ctx.db.delete(args.indicatorId);
  },
});

export const getTypingUsers = query({
  args: { chatRoomId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const roomId = ctx.db.normalizeId("chatRooms", args.chatRoomId);
    if (!userId || !roomId || !(await ctx.db.get(roomId))) return [];
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_room", (q) => q.eq("chatRoomId", roomId))
      .collect();
    return indicators
      .filter(
        (item) =>
          item.userId !== userId && item.lastTypedAt > Date.now() - 3000,
      )
      .map((item) => item.userName);
  },
});
