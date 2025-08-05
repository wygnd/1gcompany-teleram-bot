import {BaseCommand, IBaseCommandFields} from "../command.abstract";
import {Bot, InlineKeyboard} from "grammy";
import {BotContext, IOrderEntity} from "../../context/context.interface";
import {EMOJIS, MAIN_BUTTONS, MANAGER_TELEGRAM} from "../../constants";
import {randomUUID} from "crypto";


type FieldsKeys = keyof IOrderEntity;

const fieldsList = new Map<string, IBaseCommandFields>([
	["pick_date", {
		name: "Дата забора",
		slug: "pick_date",
		value: "",
		index: 0,
		textForInput: "",
		required: true
	}],
	["pick_type", {
		name: "Место забора (ЮВ, ТЯК, Садовод, склад поставщика)",
		slug: "pick_type",
		value: "",
		index: 0,
		textForInput: "",
		required: true
	}],
	["pick_address", {
		name: "Точный адрес забора (номер линии, павильона, адрес)",
		slug: "pick_address",
		value: "",
		index: 1,
		textForInput: "",
		required: true
	}],
	["provider", {
		name: "Контакт поставщика",
		slug: "provider",
		value: "",
		index: 3,
		textForInput: "",
		required: true
	}],
	["product", {
		name: "Объем или количество товара",
		slug: "product",
		value: "",
		index: 4,
		textForInput: "",
		required: true
	}],
	["attachment", {
		name: "Накладная на товар от поставщика или чек об оплате (при наличии)",
		slug: "attachment",
		value: "",
		index: 5,
		textForInput: "накладную на товар от поставщика или чек об оплате, если нет, напишите \"пропустить\"",
		required: false
	}],
	["for", {
		name: "Для кого",
		slug: "for",
		value: "",
		index: 6,
		textForInput: "",
		required: true
	}]
])

export class OrderCommand extends BaseCommand {
	private handleField: string;
	private orderMainMessageId: number;


	constructor(bot: Bot<BotContext>) {
		super(bot, fieldsList);
		this.handleField = "pick_date";
		this.orderMainMessageId = 0;
	}

	handle(): void {
		const actionName = MAIN_BUTTONS.get("order")?.name || "Оформить заявку на забор товара";

		this.bot.hears(actionName, async ctx => {
			this.chatId = ctx.chatId;
			if (!this.checkFields()) {
				await this.nextStep(ctx);
				return;
			}

			const message = this.renderMainMessage();

			ctx.reply(message, {
				parse_mode: "HTML",
			}).then(callbackCtx => {
				this.orderMainMessageId = callbackCtx.message_id

				ctx.reply(`Введите ${this.fields.get("pick_date")?.name}`)
					.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id))
			})
		})

		this.fields.forEach(field => {
			const {name, slug, textForInput} = field;

			if (!name || !slug) return;

			this.bot.callbackQuery(slug, async ctx => {
				const {msgId} = ctx;

				if (msgId) this.messageId = msgId;
				this.handleField = slug;

				ctx.reply(`Введите ${textForInput || name}`)
					.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id))

				await ctx.answerCallbackQuery();
			})
		});

		this.bot.on("message:text", async (ctx, next) => {
			if (ctx.session.scene !== "order") return void await next();

			if (!this.handleField) return void await next();

			const field = this.fields.get(this.handleField);

			if (!field) return void ctx.reply("Произошла ошибка, попробуйте еще раз")
				.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));


			if (this.handleField == "attachment" && /пропуст/gi.test(ctx.message.text)) {
				field.value = "Не указано";
				this.fields.set(this.handleField, field);
				this.addHistoryMessageId(ctx.msgId);
				return void await this.nextStep(ctx);
			} else if (this.handleField == "attachment" && !/пропуст/gi.test(ctx.message.text)) return void await ctx.reply("Отправьте фотографию или документ")
				.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));

			const {text} = ctx.message;
			field.value = text;
			this.fields.set(this.handleField, field);
			this.addHistoryMessageId(ctx.msgId);
			await this.nextStep(ctx);
		});

		this.bot.on([":photo", ":document"], async (ctx, next) => {
			if (ctx.session.scene !== "order") return void await next();

			if (this.handleField !== "attachment") return;

			const field = this.fields.get("attachment");

			if (!field) return;

			if (ctx.msg?.photo) {
				field.value = "photo|" + ctx.msg.photo[0].file_id;
			} else if (ctx.msg?.document) {
				field.value = "document|" + ctx.msg.document.file_id;
			} else {
				return void await ctx.reply("Отправьте фотографию или документ")
					.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));
			}

			this.fields.set(this.handleField, field);
			this.addHistoryMessageId(ctx.msgId);
			await this.nextStep(ctx);
		});

		this.bot.callbackQuery("order-confirm", async context => {
			let lastMessage = "Заявка на забор груза\n";
			let i = 1;
			this.fields.forEach(field => {
				const {name, slug, value} = field;

				slug === "attachment" ? lastMessage += `${i}. ${name};\n` : lastMessage += `${i}. ${name}: ${value};\n`;
				i++;
			})
			lastMessage += `Если у вас есть вопросы - пишите в чат в наш совместный чат или <a href='https://t.me/${MANAGER_TELEGRAM}'>менеджеру</a> ` +
				`мы всегда на связи и готовы помочь!` +
				`Ждём вашу заявку с нетерпением! ${EMOJIS.DELIVERY}${EMOJIS.BOX}`;

			await this.bot.api.editMessageText(this.chatId, this.orderMainMessageId, lastMessage, {
				parse_mode: "HTML",
			});
			context.msgId && await this.clearInlineKeyboardButtons(context.msgId);
			this.saveSession(context);
			this.clearFields();
			context.session.scene = "lobby";
			await context.reply("Спасибо за вашу заявку на забор груза. Ваша заявка успешно создана и находится в обработке.\n" +
				"Пожалуйста, ожидайте оповещение в чате «Забор товара» о прибытии вашего груза на наш склад." +
				"Как только товар поступит, мы сразу уведомим вас и предоставим дальнейшие инструкции.\n" +
				`Если у вас возникнут вопросы, пожалуйста, свяжитесь с нашим <a href="https://t.me/${MANAGER_TELEGRAM}">менеджером</a>.\n` +
				"С уважением, фулфилмент FirstGlobal", {
				parse_mode: "HTML"
			});

			context.deleteMessages(this.messageIdsHistory).then(() => this.messageIdsHistory = []);
			await context.answerCallbackQuery();
		});

		this.bot.callbackQuery("order-error", async context => {
			context.msgId && await this.clearInlineKeyboardButtons(context.msgId);
			context.reply("Измените поля", {
				reply_markup: this.generateInlineKeyboardButtons(["Подтвердить|order-confirm|1"])
			}).then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));

			await context.answerCallbackQuery();
		});
	}

	private async nextStep(context: BotContext): Promise<void> {
		this.bot.api.editMessageText(this.chatId, this.orderMainMessageId, this.renderMainMessage(), {
			parse_mode: "HTML",
		}).catch(e => {
			console.log("Error exception on next step function on Order command: ", e);
		})

		if (!this.checkFields()) {
			let index = 1;
			let textReply = "Проверьте правильность полей:\n";
			const inlineKeyboard = new InlineKeyboard()
				.text(`Все правильно ${EMOJIS.CHECK_MARK}`, "order-confirm")
				.text(`Хочу изменить ${EMOJIS.CANCEL}`, "order-error");

			this.fields.forEach((field) => {
				const {name, slug, value} = field;
				if (slug === "attachment" && value !== "Не указано") return;
				textReply += `${index}. ${name}: ${value}\n`;
				index++;
			})
			const attachmentId = this.fields.get("attachment")?.value;

			if (attachmentId && attachmentId !== "Не указано") {
				const [type, ID] = attachmentId.split("|")
				type == "document"
					? context.replyWithDocument(ID, {
						caption: textReply,
						reply_markup: inlineKeyboard
					}).then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id))
					: context.replyWithPhoto(ID, {
						caption: textReply,
						reply_markup: inlineKeyboard
					}).then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));

			} else {
				context.reply(textReply, {
					reply_markup: inlineKeyboard
				}).then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));
			}

			return;
		}

		for (const [keyField, fields] of this.fields) {
			const {value} = fields;

			if (!value) {
				this.handleField = keyField;
				break;
			}

			this.handleField = "end"
		}

		const fieldItems = this.fields.get(this.handleField);
		if (!fieldItems) return void console.log("Error exception on next step function on Order command: cannot get field");
		const {textForInput, name} = fieldItems;

		context.reply(`Введите ${textForInput || name}:`).then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));
	}

	private renderMainMessage(): string {
		const messageHead = "Мы рады помочь Вам с транспортировкой ваших товаров.\n" +
			"Чтобы оформить заявку на забор товара, просто отправьте нам следующую информацию:\n";
		const messageTail = `Если у вас есть вопросы - пишите в чат в наш совместный чат или <a href='https://t.me/${MANAGER_TELEGRAM}'>менеджеру</a> ` +
			`мы всегда на связи и готовы помочь!` +
			`Ждём вашу заявку с нетерпением! ${EMOJIS.DELIVERY}${EMOJIS.BOX}`;
		let message = messageHead;
		let index = 1;

		for (const [_, fields] of this.fields) {
			const {name, value, slug} = fields;

			if (value) {
				slug === "attachment" ? message += `${EMOJIS.CHECK_MARK} ${index}. ${name};\n` : message += `${EMOJIS.CHECK_MARK} ${index}. ${name}: ${value};\n`;
			} else {
				message += `${index}. ${name};\n`;
			}
			index++;
		}

		message += messageTail;

		return message;
	}

	private saveSession(ctx: BotContext): void {
		if (this.checkFields()) throw new Error("Error. Trying save order but one or more fields is empty");

		const pick_date = this.fields.get("pick_date")?.value,
			pick_type = this.fields.get("pick_type")?.value,
			pick_address = this.fields.get("pick_address")?.value,
			provider = this.fields.get("provider")?.value,
			product = this.fields.get("product")?.value,
			attachment = this.fields.get("attachment")?.value,
			for_whom = this.fields.get("for")?.value;

		let orders = ctx.session.orders || [];
		orders.push({
			ID: randomUUID(),
			attachment: attachment || "",
			pick_date: pick_date || "",
			pick_type: pick_type || "",
			provider: provider || "",
			pick_address: pick_address || "",
			product: product || "",
			for: for_whom || "",
			createAt: Date.now()
		})

		ctx.session.orders = orders;
	}
}