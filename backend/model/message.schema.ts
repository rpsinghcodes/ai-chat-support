import mongoose, { Schema, Model, Document } from "mongoose";

interface IMessage extends Document {
	sessionId: string;
	message: string;
	reply: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const MessageSchema: Schema<IMessage> = new mongoose.Schema(
	{
		sessionId: {
			type: String,
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		reply: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
	}
);

const Message: Model<IMessage> = mongoose.model<IMessage>(
	"Message",
	MessageSchema
);

export { Message, IMessage };
