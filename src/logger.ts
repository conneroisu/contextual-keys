import ContectualKeys from "./main";

/**
 * @conneroisu
 * @author Conner Ohnesorge
 * @alias logger
 * @description This class is used to log messages to the console
 * 
 * This class is used to log messages to the console depending on the debug setting
 */
export default class ContextualKeysLogger {
	static plugin: ContectualKeys;
	static debug: boolean;

	/**
	 * This is the constructor for the logger class
	 * @param plugin The plugin instance
	 */
	constructor(plugin: ContectualKeys) {
		ContextualKeysLogger.plugin = plugin;
		ContextualKeysLogger.debug = plugin.settings.debug;
	}

	/**
	 * This method logs a message to the console if the debug setting is true
	 * @param message The message to log
	 * @param bool the boolean value to check
	 */
	static boollog(message: string, bool: boolean) {
		if (bool) {
			this.log(message);
		}
	}
	/**
	 * This method logs a message to the console
	 * @param message The message to log
	 */
	static log(message: string) {
		console.log(`[${new Date().toUTCString()}] [Contextual Keys] ${message}`);
	}
}
