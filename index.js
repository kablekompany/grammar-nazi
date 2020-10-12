const { Plugin } = require('powercord/entities')
const { inject, uninject } = require('powercord/injector')
const { React, getModule, messages } = require('powercord/webpack')
const { findInReactTree } = require('powercord/util')
const { receiveMessage } = messages
const ChannelTextAreaContainer = getModule((m) => m.type && m.type.render && m.type.render.displayName === 'ChannelTextAreaContainer', false)

const Settings = require('./components/Settings')
const spellButton = require('./components/ToggleButton')
const customDefaultDictionary = require('./dictionary.json')
const questionWords = ['who', 'what', 'when', 'where', 'why', 'how', 'can i', 'who are', 'which', 'will']

module.exports = class GrammarNazi extends Plugin {
	async startPlugin() {
		powercord.api.settings.registerSettings('grammar-nazi', {
			category: this.entityID,
			label: 'Grammar Nazi',
			render: Settings
		})
		powercord.api.commands.registerCommand({
			command: 'addword',
			aliases: ['na', 'spelladd', 'sa', 'dictadd', 'da'],
			description: 'Add a key/value pair to the custom dictionary.',
			usage: '{c} "key" "value"',
			executor: (args) => this.addDict(args)
		})
		powercord.api.commands.registerCommand({
			command: 'rmword',
			aliases: ['nr', 'spellremove', 'sr', 'dictremove', 'dr'],
			description: 'Remove a key/value pair from the custom dictionary.',
			usage: '{c} "key"',
			executor: (args) => this.removeDict(args)
		})
		powercord.api.commands.registerCommand({
			command: 'listwords',
			aliases: ['mk', 'nazidictionary', 'nd', 'dictionary'],
			description: 'View the current custom dictionary.',
			usage: '{c}',
			executor: () => this.viewDict()
		})

		/* Stylesheet */
		this.loadStylesheet("style.scss")

		/* Define Settings */
		if (this.settings.get('customDictionary') === undefined) this.settings.set('customDictionary', customDefaultDictionary)
		if (this.settings.get('ignoreBotPrefix') === undefined) this.settings.set('ignoreBotPrefix', [])
		let settingsArray = ['punctuation', 'capitalization', 'ignorebots', 'dictionary', 'nazify']
		for (let i = 0; i < settingsArray.length; i++) {
			if (this.settings.get(settingsArray[i]) === undefined) this.settings.set(settingsArray[i], false)
		}

		/* Inject on Message Send */
		const MessageEvents = await getModule(['sendMessage'])
		inject('message-send', MessageEvents, 'sendMessage', (args) => {
			let text = args[1].content.trim()
			let split = text.split(' ')
			let customDictionary = this.settings.get('customDictionary')
			var botCmd = false
			var question = false

			//Detect Bot Prefix
			if (this.settings.get('ignorebots') === true && this.settings.get('nazify') === true) {
				let botPrefix = this.settings.get('ignoreBotPrefix', []).join(', ')
				for (let k = 0; k < botPrefix.length; k++) {
					botCmd = (text.startsWith(botPrefix[k])) ? true : false;
					if (botCmd) {
						return;
					}
				}
			}

			//  Detect if message is a question
			for (let k = 0; k < questionWords.length; k++) {
				question = (text.startsWith(questionWords[k])) ? true : false;
				// text += '?'
				if (question) {
					return;
					// 	text = text.replace(/.$/, "?");
					// } else {
					// 	text = text + "?";
					// }
					// if (text.slice(text.length - 2) == "i?") {
					// 	text = text.slice(0, text.length - 2) + "I?"; // Correct sentences like "Who am I?"
				}
			}// #TODO- add support for changing punctation on questions

			// inject the message with corrections otherwise
			if (text.indexOf('```') === -1 && this.settings.get('nazify') === true) {
				if (this.settings.get('dictionary')) text = split.map(c => c in customDictionary ? customDictionary[c] : c).join(' ')
				if (this.settings.get('punctuation') && (/[a-z0-9]$/gmi).test(text) && split[split.length - 1].indexOf('http') === -1) text += '.'
				if (this.settings.get('capitalization') && text.indexOf('http') != 0) text = text.charAt(0).toUpperCase() + text.substring(1)
			}

			args[1].content = text
			return args
		}, true)

		/* Inject Chat Button */
		inject('toggle-button', ChannelTextAreaContainer.type, 'render', (args, res) => {
			const props = findInReactTree(res, (r) => r && r.className && r.className.indexOf('buttons-') == 0)
			props.children.unshift(React.createElement('div', {
				className: 'toggle-button',
				onClick: () => this.settings.set('nazify', this.settings.get('nazify') === false ? true : false)
			}, React.createElement(spellButton, { nazify: this.settings.get('nazify') })))
			return res
		})
		ChannelTextAreaContainer.type.render.displayName = 'ChannelTextAreaContainer'
	}

	pluginWillUnload() {
		powercord.api.settings.unregisterSettings('grammar-nazi')
		powercord.api.commands.unregisterCommand('addword')
		powercord.api.commands.unregisterCommand('rmword')
		powercord.api.commands.unregisterCommand('listwords')
		uninject('message-send')
		uninject('toggle-button')
		document.querySelectorAll('toggle-button').forEach(e => e.style.display = 'none')
	}

	async addDict(args) {
		/* Custom Bot Attributes */
		const { BOT_AVATARS } = await getModule(['BOT_AVATARS'])
		const { createBotMessage } = await getModule(['createBotMessage'])
		const { getChannelId } = getModule(['getLastSelectedChannelId'], false)

		const receivedMessage = createBotMessage(getChannelId(), {})

		BOT_AVATARS.GrammarNaziAvatar = 'https://i.imgur.com/wUcHvh0.png'
		receivedMessage.author.username = 'Grammar Nazi'
		receivedMessage.author.avatar = 'GrammarNaziAvatar'

		/* String Formatting */
		let newargs = []
		let text = args.join(' ')
		newargs[0] = text.substring(0, text.indexOf('" "')).replace(/"/g, '')
		newargs[1] = text.substring(text.indexOf('" "') + 2, text.length).replace(/"/g, '')
		if (newargs[0].length < 1 || newargs[1] == ' ') {
			receivedMessage.content = 'Insufficent arguments; both a keyword and value must be supplied.'
			return receiveMessage(receivedMessage.channel_id, receivedMessage)
		}

		/* Duplicate Check */
		let customDictionary = this.settings.get('customDictionary')
		if (newargs[0] in customDictionary) {
			receivedMessage.content = `Entry "${newargs[0]}" already exists!`
			return receiveMessage(receivedMessage.channel_id, receivedMessage)
		}

		/* Save to Dictionary */
		customDictionary[newargs[0]] = newargs[1]
		this.settings.set('customDictionary', customDictionary)

		receivedMessage.content = `Entry "${newargs[0]}" successfully created with value of "${newargs[1]}".`
		return receiveMessage(receivedMessage.channel_id, receivedMessage)
	}

	async removeDict(args) {
		/* Custom Bot Attributes */
		const { BOT_AVATARS } = await getModule(['BOT_AVATARS'])
		const { createBotMessage } = await getModule(['createBotMessage'])
		const { getChannelId } = getModule(['getLastSelectedChannelId'], false)

		const receivedMessage = createBotMessage(getChannelId(), {})

		BOT_AVATARS.GrammarNaziAvatar = 'https://i.imgur.com/wUcHvh0.png'
		receivedMessage.author.username = 'Grammar Nazi'
		receivedMessage.author.avatar = 'GrammarNaziAvatar'

		/* String Formatting */
		let customDictionary = this.settings.get('customDictionary')
		let text = args.join(' ').replace(/"/gm, '')

		/* Arguments Check */
		if (!(args.join(' ').includes('"'))) {
			receivedMessage.content = 'Insufficent arguments; please provide both a keyword and a value.'
			return receiveMessage(receivedMessage.channel_id, receivedMessage)
		}

		/* Remove from Dictionary */
		if (text in customDictionary) {
			delete customDictionary[text]
			this.settings.set('customDictionary', customDictionary)
			receivedMessage.content = `Entry ${args[0]} was successfully deleted!`
			return receiveMessage(receivedMessage.channel_id, receivedMessage)
		} else {
			receivedMessage.content = `Entry ${args[0]} does not exist.`
			return receiveMessage(receivedMessage.channel_id, receivedMessage)
		}
	}

	async viewDict() {
		/* Custom Bot Attributes */
		const { BOT_AVATARS } = await getModule(['BOT_AVATARS'])
		const { createBotMessage } = await getModule(['createBotMessage'])
		const { getChannelId } = getModule(['getLastSelectedChannelId'], false)

		const receivedMessage = createBotMessage(getChannelId(), {})

		BOT_AVATARS.GrammarNaziAvatar = 'https://i.imgur.com/wUcHvh0.png'
		receivedMessage.author.username = 'Grammar Nazi'
		receivedMessage.author.avatar = 'GrammarNaziAvatar'

		/* Write Message */
		let customDictionary = this.settings.get('customDictionary')
		let dictionary = '> '

		for (let i in customDictionary) {
			dictionary += i + ' : ' + customDictionary[i] + '\n> '
		}

		receivedMessage.content = dictionary
		return receiveMessage(receivedMessage.channel_id, receivedMessage)
	}
}
