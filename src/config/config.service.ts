import {config, DotenvParseOutput} from "dotenv";
import {IConfigService} from "./config.interface.js";
import {BotCommand} from "@grammyjs/types";


export class ConfigService implements IConfigService {
    private config: DotenvParseOutput;
    private commands = new Map<string, BotCommand>();

    constructor() {
        const {error, parsed} = config();

        if (error) throw new Error(`Error exception on configure config service: ${error}`);
        if (!parsed) throw new Error("Config file wasn't found");

        this.config = parsed;
    }

    get(key: string): string {
        const variable = this.config[key];

        if (!variable) throw new Error(`${key} wasn't found in file config`);

        return variable;
    }


    getCommands(): MapIterator<BotCommand> {
        return this.commands.values();
    }
}