import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const userSystemEnum = pgEnum("user_system_enum", ["system","user"]);

export const chats = pgTable('chats', {
    id: serial('id').primaryKey(),
    contentName: text('content_name').notNull(),
    contentURL: text('content_url').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    userId: varchar('userId', {length:256}).notNull(),
    fileKey: text('file_key').notNull()
 });

export const messages =  pgTable('messages', {
    id: serial('id').primaryKey(),
    chatId: integer('chat_id').references(()=>chats.id).notNull(),
    messageContent: text('message_content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(), 
    role: userSystemEnum('role').notNull()
 });