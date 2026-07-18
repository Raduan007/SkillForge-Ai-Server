import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// 1. Try loading .env from current working directory
dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
});
// 2. If GEMINI_API_KEY is not loaded, resolve relative to the source directory
if (!process.env.GEMINI_API_KEY) {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // Development: src/config/loadEnv.ts -> two levels up to root
        dotenv.config({
            path: path.resolve(__dirname, "../../.env"),
        });
    }
    catch (e) {
        // Ignore
    }
}
// 3. Fallback for compiled bundle path (dist/config/loadEnv.js)
if (!process.env.GEMINI_API_KEY) {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // Compiled: dist/config/loadEnv.js -> three levels up to root
        dotenv.config({
            path: path.resolve(__dirname, "../../../.env"),
        });
    }
    catch (e) {
        // Ignore
    }
}
