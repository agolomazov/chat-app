import React, { Component } from 'react';
import { Menu, Icon } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { setCurrentChannel, setPrivateChannel } from '../../actions';
import { compose, setDisplayName } from 'recompose';
import firebase from '../../firebase';

class Starred extends Component {
	state = {
		starredChannels: [],
		activeChannel: '',
		usersRef: firebase.database().ref('users'),
	};

	componentDidMount() {
		if (this.props.currentUser) {
			this.addListeners(this.props.currentUser.uid);
		}
	}

	componentWillUnmount() {
		this.removeListeners();
	}

	removeListeners = () => {
		this.state.usersRef.child(`${this.props.currentUser.uid}/starred`).off();
	};

	addListeners = userId => {
		this.state.usersRef
			.child(userId)
			.child('starred')
			.on('child_added', snap => {
				const starredChannel = { id: snap.key, ...snap.val() };
				this.setState({
					starredChannels: [...this.state.starredChannels, starredChannel],
				});
			});

		this.state.usersRef
			.child(userId)
			.child('starred')
			.on('child_removed', snap => {
				const channelToRemove = { id: snap.key, ...snap.val() };
				const filteredChannels = this.state.starredChannels.filter(
					channel => channel.id !== channelToRemove.id
				);
				this.setState({
					starredChannels: filteredChannels,
				});
			});
	};

	setActiveChannel = channel => {
		this.setState({
			activeChannel: channel.id,
		});
	};

	changeChannel = channel => {
		this.setActiveChannel(channel);
		this.props.setCurrentChannel(channel);
		this.props.setPrivateChannel(false);
	};

	displayChannels = starredChannels => {
		return (
			starredChannels.length > 0 &&
			starredChannels.map(channel => (
				<Menu.Item
					key={channel.id}
					onClick={() => this.changeChannel(channel)}
					name={channel.name}
					style={{ opacity: 0.7 }}
					active={channel.id === this.state.activeChannel}
				>
					# {channel.name}
				</Menu.Item>
			))
		);
	};

	render() {
		const { starredChannels } = this.state;
		return (
			<Menu.Menu className="menu">
				<Menu.Item>
					<span>
						<Icon name="star" /> STARRED
					</span>{' '}
					({starredChannels.length})
				</Menu.Item>
				{this.displayChannels(starredChannels)}
			</Menu.Menu>
		);
	}
}

const mapDispatchToProps = {
	setCurrentChannel,
	setPrivateChannel,
};

const reduxEnhancer = connect(
	null,
	mapDispatchToProps
);

const enhancer = compose(
	setDisplayName('Starred'),
	reduxEnhancer
);

export default enhancer(Starred);
