import {BaseCommand, IBaseCommandFields} from "../command.abstract";
import {Bot, InlineKeyboard} from "grammy";
import {BotContext} from "../../context/context.interface";
import {EMOJIS, MAIN_BUTTONS, MANAGER_TELEGRAM} from "../../constants";

interface IOrderEntity {
	pick_date: string;
	pick_type: string;
	pick_address: string;
	provider: string;
	product: string;
	attachment: string
	for: string;
}

type FieldsKeys = keyof IOrderEntity;

const fieldsList = new Map<FieldsKeys, IBaseCommandFields>([
	["pick_date", {
		name: "Дата забора",
		slug: "date-pick",
		value: "",
		index: 0,
		textForInput: "",
		required: true
	}],
	["pick_type", {
		name: "Место забора (ЮВ, ТЯК, Садовод, склад поставщика)",
		slug: "date-pick",
		value: "",
		index: 0,
		textForInput: "",
		required: true
	}],
	["pick_address", {
		name: "Точный адрес забора (номер линии, павильона)",
		slug: "pick_address",
		value: "",
		index: 0,
		textForInput: "",
		required: true
	}],
	["provider", {
		name: "Контакт поставщика",
		slug: "provider",
		value: "",
		index: 0,
		textForInput: "",
		required: true
	}],
	["product", {
		name: "Объем или количество товара",
		slug: "product",
		value: "",
		index: 0,
		textForInput: "",
		required: true
	}],
	["attachment", {
		name: "Накладная на товар от поставщика или чек об оплате (при наличии)",
		slug: "attachment",
		value: "",
		index: 0,
		textForInput: "",
		required: false
	}],
	["for", {
		name: "Для кого",
		slug: "for",
		value: "",
		index: 0,
		textForInput: "",
		required: true
	}]
])

// const fieldsList = new Map<FieldsKeys, IBaseCommandFields>([
// 	["billing", {
// 		name: "Данные получателя",
// 		slug: "billing",
// 		value: "",
// 		index: 0,
// 		textForInput: "Введите контактное лицо и телефон для связи с поставщиком"
// 	}],
// 	["date", {
// 		name: "Дата и время",
// 		slug: "date",
// 		value: "",
// 		index: 0,
// 		textForInput: "Введите дату и время, когда нужно забрать"
// 	}],
// 	["address", {
// 		name: "Адрес",
// 		slug: "address",
// 		value: "",
// 		index: 1,
// 		textForInput: "Введите адрес забора с указанием линии и номера павильона в случае, " +
// 			"если товар находится на рынке (ЮВ, ТЯК, Садовод, склад поставщика и тд.)"
// 	}],
// 	["product", {
// 		name: "Объем товара",
// 		slug: "product",
// 		value: "",
// 		index: 1,
// 		textForInput: "Введите объем товара в м3 или количество грузовых мест (если в накладной не указано)"
// 	}],
// 	["attachment", {
// 		name: "Фото",
// 		slug: "attachment",
// 		value: "",
// 		index: 1,
// 		textForInput: "Введите фото накладной и чека об оплате"
// 	}]
// ]);

export class OrderCommand extends BaseCommand {
	private handleField: FieldsKeys | null;

	constructor(bot: Bot<BotContext>) {
		super(bot, fieldsList);
		this.handleField = null;
	}

	handle(): void {
		const actionName = MAIN_BUTTONS.get("order")?.name || "Оформить заявку на забор товара";

		this.bot.hears(actionName, async ctx => {
			this.chatId = ctx.chatId;
			ctx.session.scene = "order";
			if (!this.checkFields()) {
				await this.nextStep(ctx);
				return;
			}

			const message = this.renderMainMessage();
			const inlineKeyboard = this.generateInlineKeyboardButtons();

			await ctx.reply(message, {
				reply_markup: inlineKeyboard,
				parse_mode: "HTML",
			})
		})

		this.fields.forEach(field => {
			const {name, slug, textForInput} = field;

			if (!name || !slug) return;

			this.bot.callbackQuery(slug, async ctx => {
				const {msgId} = ctx;

				if (msgId) this.messageId = msgId;
				this.handleField = slug as keyof IOrderEntity;

				ctx.reply(textForInput || `Введите ${name.toLowerCase()}`)
					.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id))

				await ctx.answerCallbackQuery();
			})
		});

		this.bot.on("message:text", async (ctx, next) => {
			if (ctx.session.scene !== "order") return void await next();

			if (!this.handleField) return void ctx.reply("Выберите поле...")
				.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));

			if (this.handleField == "attachment") return void await ctx.reply("Отправьте фотографию или документ")
				.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));

			const {text} = ctx.message;
			const field = this.fields.get(this.handleField);

			if (!field) return void ctx.reply("Произошла ошибка, попробуйте еще раз")
				.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));

			field.value = text;
			this.fields.set(this.handleField, field);
			this.handleField = null;
			ctx.deleteMessages(this.messageIdsHistory).then(() => this.messageIdsHistory = []);
			await this.nextStep(ctx);
		});

		this.bot.on([":photo", ":document"], async (ctx, next) => {
			if (ctx.session.scene !== "order") {
				await next();
				return;
			}
			if (!this.handleField || this.handleField !== "attachment") return;

			const field = this.fields.get("attachment");
			if (!field) {
				return;
			}

			if (ctx.msg?.photo) {
				field.value = "photo|" + ctx.msg.photo[0].file_id;
			} else if (ctx.msg?.document) {
				field.value = "document|" + ctx.msg.document.file_id;
			} else {
				return void await ctx.reply("Отправьте фотографию или документ")
					.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));
			}

			this.fields.set(this.handleField, field);
			this.handleField = null;
			await ctx.deleteMessages(this.messageIdsHistory);
			this.messageIdsHistory = [];
			await this.nextStep(ctx);
		});

		this.bot.callbackQuery("order-confirm", async context => {
			context.msgId && await this.clearInlineKeyboardButtons(context.msgId);
			this.saveSession(context);
			this.clearFields();
			context.session.scene = "lobby";
			await context.reply("Заявка успешно оформлена <b>текст</b>", {
				parse_mode: "HTML"
			});


			await context.answerCallbackQuery();
		});

		this.bot.callbackQuery("order-error", async context => {
			context.msgId && await this.clearInlineKeyboardButtons(context.msgId);
			await context.reply("Измените поля", {
				reply_markup: this.generateInlineKeyboardButtons(["Подтвердить|order-confirm|1"])
			});

			await context.answerCallbackQuery();
		});
	}

	private async nextStep(context: BotContext): Promise<void> {
		this.bot.api.editMessageText(this.chatId, this.messageId, this.renderMainMessage(), {
			reply_markup: this.generateInlineKeyboardButtons(),
			parse_mode: "HTML",
		}).catch(e => {
			console.log("Error exception on next step function on Order command: ", e);
		})

		if (!this.checkFields()) {
			let index = 1;
			let textReply = "Проверьте правильность полей:\n";
			const inlineKeyboard = new InlineKeyboard()
				.text(`Подтвердить ${EMOJIS.CHECK_MARK}`, "order-confirm")
				.text(`Отмена ${EMOJIS.CANCEL}`, "order-error");

			this.fields.forEach((field) => {
				const {name, slug, value} = field;
				if (slug === "attachment") return;
				textReply += `${index}. ${name}: ${value}\n`;
				index++;
			})
			const attachmentId = this.fields.get("attachment")?.value;

			if (attachmentId) {
				const [type, ID] = attachmentId.split("|")
				type == "document"
					? await context.replyWithDocument(ID, {
						caption: textReply,
						reply_markup: inlineKeyboard
					})
					: await context.replyWithPhoto(ID, {
						caption: textReply,
						reply_markup: inlineKeyboard
					});

			} else {
				await context.reply(textReply, {
					reply_markup: inlineKeyboard
				})
			}
		}
	}

	private renderMainMessage(): string {
		const datetime = this.fields.get("date")?.value;
		const billing = this.fields.get("billing")?.value;
		const address = this.fields.get("address")?.value;
		const attachment = this.fields.get("attachment")?.value;
		const product = this.fields.get("product")?.value;

		return "Мы рады помочь Вам с транспортировкой ваших товаров.\n" +
			"Чтобы оформить заявку на забор товара, просто отправьте нам следующую информацию:\n" +
			`${datetime ? `${EMOJIS.CHECK_MARK} 1. Дату и время: ${datetime};` : "1. Дату и время;"} \n` +
			`${address ? `${EMOJIS.CHECK_MARK} 2. Адрес забора: ${address};` : "2. Адрес забора;"} \n` +
			`${product ? `${EMOJIS.CHECK_MARK} 3. Объем товара: ${product};` : "3. Объем товара;"} \n` +
			`${billing ? `${EMOJIS.CHECK_MARK} 4. Данные получателя: ${billing};` : "4. Данные получателя;"} \n` +
			`${attachment && `${EMOJIS.CHECK_MARK}`}` + `5. Фото накладной и чека об оплате;\n` +
			`Если у вас есть вопросы - пишите в чат в наш совместный чат или <a href='https://t.me/${MANAGER_TELEGRAM}'>менеджеру</a> ` +
			`мы всегда на связи и готовы помочь!` +
			`Ждём вашу заявку с нетерпением! ${EMOJIS.DELIVERY}${EMOJIS.BOX}`
	}

	private saveSession(ctx: BotContext): void {
		if (this.checkFields()) throw new Error("Error. Trying save order but one or more fields is empty");

		const address = this.fields.get("address")?.value,
			billing = this.fields.get("billing")?.value,
			datetime = this.fields.get("date")?.value,
			product = this.fields.get("product")?.value,
			attachment = this.fields.get("attachment")?.value;

		let orders = ctx.session.orders || [];
		// orders.push({
		// 	ID: randomUUID(),
		// 	// address: address || "",
		// 	attachment: attachment || "",
		// 	billing: billing || "",
		// 	datetime: datetime || "",
		// 	product: product || "",
		// 	createAt: Date.now()
		// })
		// ctx.session.orders = orders;
	}
}