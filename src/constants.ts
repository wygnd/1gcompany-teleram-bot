import {ScenesType} from "./context/context.interface";

export const enum EMOJIS {
	GREETING = "👋",
	PHONE = "📱",
	INDIVIDUAL = "🏢",
	COMPANY = "🏬",
	SELF_EMPLOYED = "🏭",
	PHYSICAL = "👤",
	CHECK_MARK = "✅",
	DELIVERY = "🚚",
	BOX = "📦",
	CANCEL = "❌",
	NEXT = "⏩",
	PREV = "⏪"
}

export const MANAGER_TELEGRAM = "ManagerFirstGlobal";

export const MAIN_BUTTONS = new Map<string, MainButtonFields>([
		["registration", {
			name: "Регистрация",
			command: "/registration",
			scene: "registration",
			index: 0,
			needReg: false,
			deprecated: false,
			forUnRegUsers: true
		}],
		["order", {
			name: "Оформить заявку на забор товара",
			command: "/order",
			scene: "order",
			index: 1,
			needReg: true,
			deprecated: false,
			forUnRegUsers: false
		}],
		["help", {
			name: "Нужна помощь менеджера",
			command: "/help",
			scene: "help",
			index: 2,
			needReg: false,
			deprecated: false,
			forUnRegUsers: false
		}],
		["account", {
			name: "Личный кабинет",
			command: "/account",
			scene: "account",
			index: 2,
			needReg: true,
			deprecated: true,
			forUnRegUsers: false
		}],
		["orders-list", {
			name: "Список заявок",
			command: "/orders-list",
			scene: "orders-list",
			index: 3,
			needReg: true,
			deprecated: true,
			forUnRegUsers: false
		}],
	]
)

type MainButtonFields = {
	name: string;
	command: string;
	scene: ScenesType;
	index: number;
	needReg?: boolean;
	deprecated: boolean;
	forUnRegUsers: boolean;
}