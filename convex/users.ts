// convex/users.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Запит для отримання профілю поточного авторизованого користувача
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    // Отримуємо ID користувача із сесії Convex Auth
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    // Завантажуємо документ користувача з таблиці "users"
    return await ctx.db.get(userId);
  },
});

/**
 * Отримує публічні дані користувача за його ID
 */
export const getUserProfile = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    if (!(await getAuthUserId(ctx))) return null;
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    const messages = await ctx.db.query("messages").withIndex("by_sender", q => q.eq("senderId", args.id)).collect();
    const rooms = await ctx.db.query("chatRooms").withIndex("by_creator", q => q.eq("creatorId", args.id)).collect();
    return {
      _id: user._id, _creationTime: user._creationTime,
      name: user.name, fullname: user.fullname, username: user.username,
      image: user.image, bio: user.bio, followers: user.followers, following: user.following,
      stats: { messagesCount: messages.length, roomsCreatedCount: rooms.length },
    };
  },
});

/**
 * Оновлює особисті дані користувача (ім'я, нікнейм, bio, аватар)
 */
export const updateUserProfile = mutation({
  args: {
    username: v.optional(v.string()),
    fullname: v.optional(v.string()),
    bio: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized: Користувач не авторизований");
    }

    const patchData: Partial<Doc<"users">> = {};
    if (args.username !== undefined) {
      const username = args.username.trim().replace(/^@/, "").toLowerCase();
      if (username && !/^[a-z0-9_]{3,30}$/.test(username))
        throw new Error("Нікнейм: від 3 до 30 латинських літер, цифр або _");
      const existing = username ? await ctx.db.query("users").withIndex("by_username", q => q.eq("username", username)).first() : null;
      if (existing && existing._id !== userId) throw new Error("Цей нікнейм уже зайнятий");
      patchData.username = username || undefined;
    }
    if (args.fullname !== undefined) {
      const name = args.fullname.trim();
      if (!name || name.length > 100) throw new Error("Ім’я має містити від 1 до 100 символів");
      patchData.fullname = name;
      patchData.name = name;
    }
    if (args.bio !== undefined) {
      if (args.bio.trim().length > 300) throw new Error("Опис має містити до 300 символів");
      patchData.bio = args.bio.trim();
    }

    if (args.imageStorageId) {
      const file = await ctx.db.system.get(args.imageStorageId);
      if (!file || !file.contentType?.startsWith("image/") || file.size > 10 * 1024 * 1024)
        throw new Error("Оберіть зображення розміром до 10 МБ");
      const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
      if (imageUrl) {
        patchData.image = imageUrl;
        patchData.avatarStorageId = args.imageStorageId;
      }
    }

    const user = await ctx.db.get(userId);
    if (patchData.avatarStorageId && user?.avatarStorageId && user.avatarStorageId !== patchData.avatarStorageId)
      await ctx.storage.delete(user.avatarStorageId);
    await ctx.db.patch(userId, patchData);
    return { success: true };
  },
});

/**
 * Отримує користувачів для стрічки історій (поточний користувач + підписки)
 */
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    if (!(await getAuthUserId(ctx))) throw new Error("Потрібно увійти в акаунт");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStoriesUsers = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) return null;

    const now = Date.now();

    // Завантажуємо підписки поточного користувача
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();

    const followingUsers = await Promise.all(
      follows.map((f) => ctx.db.get(f.followingId))
    );

    // Допоміжна перевірка наявності активної історії
    const hasActiveStory = async (uId: Id<"users">) => {
      const story = await ctx.db
        .query("stories")
        .withIndex("by_user", (q) => q.eq("userId", uId))
        .filter((q) => q.gt(q.field("expiresAt"), now))
        .first();
      return !!story;
    };

    const currentUserHasStory = await hasActiveStory(userId);

    // Формуємо масив користувачів: "Ви" на першому місці + підписки
    const storiesList = [
      {
        id: userId,
        username: "Ваша історія",
        avatar:
          currentUser.image ??
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
        hasStory: currentUserHasStory,
        isCurrentUser: true,
      },
      ...(await Promise.all(
        followingUsers
          .filter((user): user is NonNullable<typeof user> => user !== null)
          .map(async (user) => ({
            id: user._id,
            username: user.username ?? user.name ?? "користувач",
            avatar:
              user.image ??
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
            hasStory: await hasActiveStory(user._id),
            isCurrentUser: false,
          }))
      )),
    ];

    return storiesList;
  },
});