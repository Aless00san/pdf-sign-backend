"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = exports.documents = exports.db = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const better_sqlite3_2 = require("drizzle-orm/better-sqlite3");
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
// Inicializar conexión SQLite
const sqlite = new better_sqlite3_1.default('db.sqlite');
exports.db = (0, better_sqlite3_2.drizzle)(sqlite);
exports.documents = (0, sqlite_core_1.sqliteTable)('documents', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    status: (0, sqlite_core_1.text)('status').default('pending'),
    userId: (0, sqlite_core_1.text)('user_id')
        .notNull()
        .references(() => exports.users.id),
});
exports.users = (0, sqlite_core_1.sqliteTable)('users', {
    id: (0, sqlite_core_1.text)('id').primaryKey(), // UUID
    email: (0, sqlite_core_1.text)('email').notNull().unique(),
    password: (0, sqlite_core_1.text)('password').notNull(), // Hashed password
    createdAt: (0, sqlite_core_1.text)('created_at').default(new Date().toISOString()),
});
