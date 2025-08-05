import {Context, NextFunction} from "grammy";


export async function restrictUsersMiddleware(ctx: Context, next: NextFunction): Promise<void> {
	const userID = ctx.chat?.id;
	console.log(userID)

	if (!userID || userID !== 1436953716) {
		await ctx.reply("Доступ запрещен...");
		return;
	}

	await next();
}