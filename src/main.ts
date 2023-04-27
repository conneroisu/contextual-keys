import {
	App,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import keywordGenerator from './keywordGenerator';

/**
 * Settings for the contextual keys plugin. 
 */
interface ContextualKeysSettings {
	apiKey: string;
	debug: boolean;
}

/**
 * Default Settings for the contextual keys plugin.
 */
const DEFAULT_SETTINGS: ContextualKeysSettings = {
	apiKey: "default api key",
	debug: false,
};

/**
 * Contextual Keys Plugin - This plugin will generate contextual keywords for your notes and add them to the frontmatter of the note.
 * @extends Plugin 
 */
export default class ContectualKeys extends Plugin {
	settings: ContextualKeysSettings;
	static keywordGenerator: keywordGenerator;

	async onload() {
		await this.loadSettings();
		const ribbonIconEl = this.addRibbonIcon(
			"key",
			"Contextual Keys",
			(evt: MouseEvent) => {
				// This creates an icon in the left ribbon. Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		ribbonIconEl.addClass("my-plugin-ribbon-class"); // Perform additional things with the ribbon
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// This command will only show up in Command Palette when the check function returns true
		this.addCommand({
			id: "add-contextual-keywords-to-note-in-frontmatter",
			name: "Generate and Add Contextual Keywords to Note in Frontmatter",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// Add a new keywordGenerator
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						// constuct a keywordGenerator
						keywordGenerator.plugin = this;
						keywordGenerator.debug = this.settings.debug;
						keywordGenerator.app = this.app;
						keywordGenerator.apiKey = this.settings.apiKey;
						// add the keywords to the frontmatter with keywordGenerator class
						keywordGenerator.generateAndInsertKeywords(
							markdownView.file
						);

					}
					return true;
				}
			},
		});
		this.addSettingTab(new ContextualKeysSettingTab(this.app, this)); // This adds a settings tab so the user can configure various aspects of the plugin
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}

class ContextualKeysSettingTab extends PluginSettingTab {
	plugin: ContectualKeys;

	constructor(app: App, plugin: ContectualKeys) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Settings for the contextual-keys plugin.",
		});

		new Setting(containerEl)
			.setName("Openai API Key")
			.setDesc("This is your openai api key.")
			.addText((text) =>
				text
					.setPlaceholder("Enter your api key here...")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						console.log("Secret: " + value);
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Debug")
			.setDesc(
				"This value is used to enable debug mode alows logging and reporting to the console."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.debug)
					.onChange(async (value) => {
						console.log("Debug: " + value);
						this.plugin.settings.debug = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName("Contextual Keys: Generate and Add Contextual Keywords to Note in Frontmatter");
		new Setting(containerEl)
			.setName("A Plugin made with ❤️ by @conneroisu"); 

		// reload the plugin button
		new Setting(containerEl)
			.setName("Reload the plugin")
			.setDesc("This will reload the plugin.")
			.addButton((button) =>
				button.setButtonText("Reload").onClick(async () => {
					await this.plugin.unload();
					await this.plugin.onload();
				})
		);

		// report an issue button
		new Setting(containerEl)
			.setName("Report an issue")
			.setDesc("This will take you to the github repo to report an issue/bug.")
			.addButton((button) =>
				button.setButtonText("Report").onClick(async () => {
					window.open("https://github.com/conneroisu/contextual-keys/issues");
				}
			)
		);


		// go to the github repo button
		new Setting(containerEl)
			.setName("Go to the github repo")
			.setDesc("This will take you to the github repo.")
			.addButton((button) =>
				button.setButtonText("Github").onClick(async () => {
					window.open("https://github.com/conneroisu/contextual-keys");
				})
		);

		

	}
}
