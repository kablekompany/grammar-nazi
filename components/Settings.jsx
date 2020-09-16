const { React } = require('powercord/webpack')
const { SwitchItem } = require('powercord/components/settings')

module.exports = class Settings extends React.Component {
  render() {
    return (
      <div>
        <SwitchItem
          note='Adds a period at the end of every message. Ignores question marks and exclamation points.'
          value= { this.props.getSetting('punctuation') }
          onChange={ () => { this.props.toggleSetting('punctuation') }}
        >
          Forced Punctuation
        </SwitchItem>
        <SwitchItem
          note='Capitalizes the first letter of every sentence.'
          value= { this.props.getSetting('capitalization') }
          onChange={ () => { this.props.toggleSetting('capitalization') }}
        >
          Normalized Capitalization
        </SwitchItem>
        <SwitchItem
          note='You can interact with your dictionary using chat commands.'
          value= { this.props.getSetting('dictionary') }
          onChange={ () => { this.props.toggleSetting('dictionary') }}
        >
          Custom Dictionary
        </SwitchItem>
      </div>
    );
  }
}
