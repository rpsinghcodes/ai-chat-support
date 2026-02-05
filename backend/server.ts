import express, { Express } from "express";
import dotenv from "dotenv";
import cors from "cors";
import errorHandler from "./middleware/error.middleware.ts";
import { msgRoute } from "./routes/message.route.ts";
import { db } from "./connection/db.connect.ts";

dotenv.config();
const app: Express = express();
app.use(express.json());

app.use(
	cors({
		origin: "*",
	})
);

app.use("/chat", msgRoute);

app.use(errorHandler);

const PORT: string | number = process.env.PORT || 4000;
app.listen(PORT, async () => {
	await db();
	console.log(`Server is running on ${PORT}`);
});
