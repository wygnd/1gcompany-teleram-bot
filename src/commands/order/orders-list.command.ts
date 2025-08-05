import {BaseCommand} from "../command.abstract";
import {BotContext} from "../../context/context.interface";
import {Bot} from "grammy";
import {MAIN_BUTTONS} from "../../constants";

export class OrdersListCommand extends BaseCommand {

	constructor(bot: Bot<BotContext>) {
		super(bot);
	}

	handle(): void {
		const actionName = MAIN_BUTTONS.get("orders-list")?.name || "Список заявок";

		this.bot.hears(actionName, async ctx => {
			await ctx.reply(`Сцена в скором времени будет доступна.\nКолличество заявок: ${ctx.session.orders.length} шт.`);
			// await this.sendOrderList(ctx);
		});
	}

	private async sendOrderList(context: BotContext): Promise<void> {
		const orders = context.session.orders;
		let message = "";
		const ordersLength = orders.length;
		const maxItemsOnPage = 5;
		const pages = Math.floor(ordersLength / maxItemsOnPage) + 1;
		let page = 0;

		
	}
}