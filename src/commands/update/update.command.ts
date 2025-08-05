import {BotContext} from "../../context/context.interface";
import {BaseCommand} from "../command.abstract";
import {Bot} from "grammy";
import {generateActionKeyboardButtons} from "../../utils";

export class UpdateCommand extends BaseCommand {
	constructor(bot: Bot<BotContext>) {
		super(bot)
	}

	handle() {
		this.bot.command("update", ctx => this.handleCommand(ctx))
	}

	private async handleCommand(ctx: BotContext) {
		await ctx.reply("Обновление...", {
			reply_markup: generateActionKeyboardButtons(ctx)
		})
	}
}