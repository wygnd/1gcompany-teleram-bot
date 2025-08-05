import {Bot, Context, session} from "grammy";
import {BotContext, SessionData} from "./context/context.interface";
import {IConfigService} from "./config/config.interface";
import {ConfigService} from "./config/config.service";
import {FileAdapter} from '@grammyjs/storage-file';
import {BaseCommand} from "./commands/command.abstract";
import {RegistrationCommand} from "./commands/registration/registration.command";
import {StartCommand} from "./commands/start/start.command";
import {HelpCommand} from "./commands/help/help.command";
import {OrderCommand} from "./commands/order/order.command";
import {AccountCommand} from "./commands/account/account.command";
import {OrdersListCommand} from "./commands/order/orders-list.command";
import {UpdateCommand} from "./commands/update/update.command";
import {restrictUsersMiddleware} from "./middleware/restrict-users.middleware";
import {sceneListenerMiddleware} from "./middleware/scene-listener.middleware";


class ApplicationBot {
	public bot: Bot<BotContext>;
	private botCommands: BaseCommand[] = [];

	constructor(private readonly configService: IConfigService) {
		this.bot = new Bot<BotContext>(this.configService.get("TG_BOT_API_KEY"));

		// todo: Change file session to DB
		this.bot.use(session({
			getSessionKey(ctx: Context): string | undefined {
				return ctx.chat?.id.toString();
			},
			storage: new FileAdapter({
				dirName: "session"
			}),
			initial: () => this.crateInitialStateContext(),
		}));

		// middleware
		this.bot.use(restrictUsersMiddleware, sceneListenerMiddleware);
	}

	public init(): void {
		this.addBotCommandsActions();

		this.bot.catch(error => {
			console.log("Except Error: ", error);
		})

		this.bot.start({
			onStart: () => {
				console.log("Bot started...");
			}
		});
	}

	private crateInitialStateContext(): SessionData {
		return {
			user: {
				name: null,
				phone: null,
				organization: null
			},
			alreadyRegistered: false,
			scene: "lobby",
			orders: [],
		}
	}

	private addBotCommandsActions(): void {
		this.botCommands.push(
			new StartCommand(this.bot),
			new RegistrationCommand(this.bot),
			new HelpCommand(this.bot),
			new OrderCommand(this.bot),
			new AccountCommand(this.bot),
			new OrdersListCommand(this.bot),
			new UpdateCommand(this.bot)
		)

		this.botCommands.map(command => command.handle())
	}
}


const botApi = new ApplicationBot(new ConfigService());

botApi.init();

// TODO: ПЕРВОНАЧАЛЬНО!!! Еще такой моментик, нужно перенести сессии в бд. Ибо чзх они в json храняться....
// todo: Подумать, как правильно пропускать Накладную(фото) если она не будет прикреплена: какие слова искать для пропуска
// todo: Начать делать список заказов с пагинацией все цивильненько и статусы кста тоже надо сделать
// todo: Сделать сцену "Личный кабинет"
// todo: Разграничение на админов и клиентов