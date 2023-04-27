import { TFile, App} from 'obsidian';
import ContectualKeys from './main';
import { Configuration, OpenAIApi } from 'openai';
import ContextualKeysLogger from './logger';
import ContectualKeysSettings from './main';

/**
 * @author Conner Ohnesorge
 */

/**
 *  Keyword Generator Class for the contextual keys plugin 
 */
export default class keywordGenerator{
	static plugin: ContectualKeys;
	static debug: boolean;
	static app: App;
	static settings: ContectualKeysSettings;
	static apiKey: string;

	constructor (plugin: ContectualKeys, app: App, settings: ContectualKeysSettings) {
		keywordGenerator.plugin = plugin;
		keywordGenerator.debug = plugin.settings.debug;
		keywordGenerator.app = app;
		keywordGenerator.settings = settings;
	}

	static async generateKeywords(file: TFile, resultinggeneratedkeywords: string){
		resultinggeneratedkeywords = await this.generate(await app.vault.read(file)); 
		ContextualKeysLogger.log("keywordGenerator.generateAndInsert Generated Keywords: " + resultinggeneratedkeywords);
	}
	/**
	 * Method to generate keywords for a file and insert them into the frontmatter 
	 * @param file the file to generate keywords for 
	 */
	static async generateAndInsertKeywords(file: TFile) {
		const fileContent = await app.vault.read(file);
		const generatedKeywords = "";

		keywordGenerator.generateKeywords(file, generatedKeywords);

		const olderKeywords: string[] = await this.getKeywords(fileContent);
		const newerKeywords: string[] = await keywordGenerator.ExtractGeneratedKeywords(generatedKeywords);

		ContextualKeysLogger.log("keywordGenerator.generateAndInsert Old Keywords: " + olderKeywords);
		ContextualKeysLogger.log("keywordGenerator.generateAndInsert New Keywords: " + newerKeywords);

		const combinedKeywords = this.combineKeywords(olderKeywords, newerKeywords);
		this.insertKeywords(file, combinedKeywords);	
		ContextualKeysLogger.log("keywordGenerator.generateAndInsert Combined Keywords: " + combinedKeywords);
	}
	/**
	 * Inserts the keywords into the file frontmatter 
	 * @param file the file to insert the keywords into
	 * @param keywords the keywords to insert into the file
	 */
	static async insertKeywords(file: TFile, keywords: string[]) {
		// replace the file content with the new content
		// get before and after keywords: in the frontmatter 
		const fileContent = this.plugin.app.vault.read(file);
		let before =  (await fileContent).split('keywords:')[0];
		let after =  (await fileContent).split('keywords:')[1];
		// set before to new line inside of frontmatter if the file doesn't have keywords
		// if there are no keywords in the file then the before will be ---\r md file content
		if(this.areKeywordsInFrontmatter(await fileContent) === false){
			before = before + '---\r' + 'keywords: ';
			// after is the second line
			after = (await after).split('\r')[1];
		}

		// convert the keywords array to a string comma separated
		let keywordsString = keywords.join(', ');
		// add a , to the end of the string if it doesn't already have one
		if(keywordsString[keywordsString.length - 1] !== ','){
			keywordsString += ',';
		}
		// if the keywordsString contains "keywords: " remove it
		if(keywordsString.includes('keywords: ')){
			keywordsString = keywordsString.replace('keywords: ', '');
		}
		// if the keywordsString contains "Keywords:" remove it
		if(keywordsString.includes('Keywords:')){
			keywordsString = keywordsString.replace('Keywords:', '');
		}
		// if the keywordsString has a preceding comma remove it
		if(keywordsString[0] === ','){
			keywordsString = keywordsString.substring(1);
		}

		// write the new file with  before + keywords: combinedKeywords + after
		this.plugin.app.vault.modify(file, before + 'keywords: ' + keywordsString + after);
	}

	static areKeywordsInFrontmatter(fileContent: string): boolean {
		// if the file content inside of the frontmatter contains keywords: return true
		// if keywords are within --- and --- return true
		let inside = false;
		for(const line of fileContent.split('\n')){
			if(line.includes('---')){
				inside = !inside;
			}
			if(line.includes('keywords:')){
				return true;
			}
		}
		return false;
	}


	/**
	 * Combines the old keywords with the new keywords
	 * @param oldKeywords the current file keywords 
	 * @param newKeywords the new keywords to add to the file/generated keywords
	 */
	static combineKeywords(oldKeywords: string[], newKeywords: string[]) {
		// Combine the old keywords with the new keywords
		// ignore duplicates
		const combinedKeywords: string[] = [];
		for(const keyword of oldKeywords){
			combinedKeywords.push(keyword);
		}
		for(const keyword of newKeywords){
			combinedKeywords.push(keyword);
		}
		return combinedKeywords;
	}


	/**
	 * Generates keywords using the openai api and returns the string of the response
	 * @returns A promise that resolves to an array of strings containing the keywords
	 * @param fileContent the content of the file to generate keywords from
	 */
	static async generate(fileContent: string): Promise<string> {
		// Add the prompt "Write a list of keywords in markdown formatting for the following text:"
		const prompt = "Write a list of keywords in markdown formatting for the following text repeat keywords:\n" + fileContent;



		const config = new Configuration({
			apiKey: this.apiKey,
		});

		const openai = new OpenAIApi(config);

		// openai.createChatCompletion = async (request: CreateChatCompletionRequest) => {
		const completion = await openai.createCompletion({
			model: 'text-davinci-003',
			prompt: prompt,
		});

		ContextualKeysLogger.log("Completion: " + await completion.data.choices[0].text);

		if(completion.data.choices[0].text === undefined){
			return "";
		}
		return completion.data.choices[0].text;
	}
	
	static async ExtractGeneratedKeywords(text: string): Promise<string[]> {
		let keywords: string[] = [];
		// for each string separated by a new line
		for(let line of text.split('\n')){
			line = line.toLowerCase();
			
			line = line.replace(/[*-]/g, '');
			if(line.startsWith('keywords:')){
				if(line.split('\n').length >= 2){
					keywords = this.parseVerticalKeywords(line);
				}else{ 
					keywords = this.parseWords(line);
				}
			}


		}
		return await keywords;
	}

	/**
	 * Parses the keywords from the frontmatter of the file
	 * @param file the file to get the keywords from
	 * @returns string[] containing the keywords
	 */
	static async getKeywords(fileContent: string): Promise<string[]> {
		let keywords: string[] = [];

		// adjusting for vertical and horizontal keywords formats, return the keywords as an array of strings
		for(const line of (await fileContent).split('---')){
			if(line.startsWith('keywords:')){
				if(line.split('\n').length >= 2){
					keywords = this.parseVerticalKeywords(line);
				}else{ 
					keywords = keywordGenerator.parseWords(line);
				}
			}
		}
		return await keywords;

	}

	static parseVerticalKeywords(line: string): string[] {
		const parsedKeywords: string[] = [];
		// for each string separated by a new line
		for(const keyword of line.split('\n')){
			if(keyword.startsWith('- ')){
				// add the keyword to an array of strings
				parsedKeywords.push(keyword);
			}
		}
		return parsedKeywords;
	}

	static parseWords(line: string): string[] {
		const parsedKeywords: string[] = [];
		// for each string separated by a comma
		for(const keyword of line.split(',')){
			// add the keyword to an array of strings
			parsedKeywords.push(keyword);
		}
		return parsedKeywords;
	}

	private static getFrontmatter(path: string) {
        const cache = this.app.metadataCache.getCache(path);
		if(cache){
            if (cache.hasOwnProperty('frontmatter')) {
                const cafm =  cache.frontmatter;
					// convert the frontmatter to a string
					if(cafm != null){ return cafm; }
				}
            }
		}
    }

