import { Request, Response } from "express";
import { Message } from "../model/message.schema.ts";
import { AI } from "../service/chatgpt.service.ts";

interface MessageRequestBody {
	sessionId: string;
	message: string;
}

interface HistoryRequestBody {
	sessionId: string;
}

const userMessage = async (
	req: Request<{}, {}, MessageRequestBody>,
	res: Response
): Promise<void> => {
	try {
		const { sessionId, message } = req.body;

		const data = await Message.aggregate([
			{ $match: { sessionId } },
			{ $sort: { createdAt: -1 } },
			{ $limit: 10 },
			{
				$project: {
					_id: 0,
					messages: [
						{ role: "user", content: "$message" },
						{ role: "assistant", content: "$reply" },
					],
				},
			},
		]);

		// Transform the aggregate result to match the expected format
		const history = data
			.flatMap((item: { messages: Array<{ role: string; content: string }> }) =>
				item.messages.map((msg: { role: string; content: string }) => ({
					role: msg.role as "user" | "assistant",
					content: msg.content,
				}))
			)
			.reverse(); // Reverse to get chronological order

		const response = await AI({ message, history });
		await Message.create({
			sessionId,
			message,
			reply: response,
		});
		res.status(200).json({ reply: response, sessionId });
	} catch (error: unknown) {
		console.error("Error processing message:", error);

		// Handle LLM API errors gracefully
		if (error instanceof Error) {
			const errorMessage = error.message.toLowerCase();

			if (
				errorMessage.includes("api key") ||
				errorMessage.includes("authentication")
			) {
				res.status(500).json({
					msg: "Service configuration error. Please contact support.",
					error: "Invalid API configuration",
				});
				return;
			}

			if (
				errorMessage.includes("rate limit") ||
				errorMessage.includes("quota")
			) {
				res.status(503).json({
					msg: "Service is temporarily unavailable. Please try again in a moment.",
					error: "Rate limit exceeded",
				});
				return;
			}

			if (
				errorMessage.includes("timeout") ||
				errorMessage.includes("network")
			) {
				res.status(504).json({
					msg: "Request timed out. Please try again.",
					error: "Request timeout",
				});
				return;
			}
		}

		// Generic error response
		res.status(500).json({
			msg: "Sorry, I'm having trouble processing your request. Please try again later.",
			error: "Internal server error",
		});
	}
};

const userHistory = async (
	req: Request<{}, {}, HistoryRequestBody>,
	res: Response
): Promise<void> => {
	try {
		const { sessionId } = req.body;

		const data = await Message.aggregate([
			{ $match: { sessionId: sessionId } },
			{ $sort: { createdAt: 1 } },
			{
				$project: {
					_id: 0,
					messages: [
						{ sender: "user", text: "$message" },
						{ sender: "ai", text: "$reply" },
					],
				},
			},
			{ $unwind: "$messages" },
			{ $replaceRoot: { newRoot: "$messages" } },
		]);

		res.status(200).json({ data });
	} catch (error) {
		console.log(error);
		res.status(500).json({ msg: "Internal Server Error", error });
	}
};

export { userMessage, userHistory };
