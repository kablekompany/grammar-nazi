const { React } = require('powercord/webpack')
const { SwitchItem, TextInput } = require('powercord/components/settings')

module.exports = class Settings extends React.Component {
	render() {
		return (
			<div>
				<SwitchItem
					note='Adds a period at the end of every message. Ignores question marks and exclamation points.'
					value={this.props.getSetting('punctuation')}
					onChange={() => { this.props.toggleSetting('punctuation') }}
				>
					Forced Punctuation
        </SwitchItem>
				<SwitchItem
					note='Capitalizes the first letter of every sentence.'
					value={this.props.getSetting('capitalization')}
					onChange={() => { this.props.toggleSetting('capitalization') }}
				>
					Normalized Capitalization
        </SwitchItem>
				<SwitchItem
					note='You can interact with your dictionary using chat commands. A preloaded default is injected on install. You can remove unwanted ones with bot commands, also'
					value={this.props.getSetting('dictionary')}
					onChange={() => { this.props.toggleSetting('dictionary') }}
				>
					Custom Dictionary
        </SwitchItem>
				<SwitchItem
					note='Plugin will stop correcting messages that begin with bot prefixes'
					value={this.props.getSetting('ignorebots')}
					onChange={() => { this.props.toggleSetting('ignorebots') }}
				>
					Ignore Bot Prefixes
        </SwitchItem>
				<TextInput
					defaultValue={this.props.getSetting('ignoreBotPrefix', []).join(', ')}
					onChange={u => this.props.updateSetting('ignoreBotPrefix', u.split(',').map(id => id.trim()))}
					note={
						<p>
							Seperate prefixes with commas and include spaces if they have them
            </p>
					}
				>
					Bot Prefix List
        </TextInput>
			</div>
		);
	}
}
