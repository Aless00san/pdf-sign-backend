"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const documents_routes_1 = __importDefault(require("./routes/documents.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
console.log('🔹 index.ts iniciado');
const app = (0, express_1.default)();
//JSON middleware
app.use(express_1.default.json());
// Routes middleware
app.use('/api', documents_routes_1.default);
app.use('/users', users_routes_1.default);
// Ruta de prueba
app.get('/', (req, res) => {
    res.send('✅ Servidor funcionando con Node + TS + Express!');
});
// Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
