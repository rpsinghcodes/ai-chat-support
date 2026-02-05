import mongoose from "mongoose";
import "dotenv/config";

export const db = async (): Promise<void> => {
	try {
		await mongoose.connect(process.env.MONGODB_URL as string);
		console.log("DB connected Successfully");
	} catch (error) {
		console.log(error);
		throw error;
	}
};
