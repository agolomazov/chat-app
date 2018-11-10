import React, { Component, Fragment } from 'react';
import { Menu, Icon, Modal, Form, Input, Button, Label } from 'semantic-ui-react';
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { setCurrentChannel, setPrivateChannel } from '../../actions';

class Channels extends Component {
	state = {
		modal: false,
		channel: null,
		channels: [],
		channelName: '',
		channelsRef: firebase.database().ref('channels'),
		messagesRef: firebase.database().ref('messages'),
		typingRef: firebase.database().ref('typing'),
		notifications: [],
		channelDetails: '',
		firstLoad: true,
		activeChannel: null,
	};

	componentDidMount() {
		this.addListeners();
	}

	componentWillUnmount() {
		this.removeListenners();
	}

	addListeners = () => {
		let loadedChannels = [];
		this.state.channelsRef.on('child_added', snap => {
			loadedChannels.push(snap.val());
			this.setState({ channels: loadedChannels }, () => this.setFirstChannel());
			this.addNotificationListener(snap.key);
		});
	};

	addNotificationListener = channelID => {
		this.state.messagesRef.child(channelID).on('value', snap => {
			if (this.state.channel) {
				this.handleNotifications(channelID, this.state.channel.id, this.state.notifications, snap);
			}
		});
	};

	handleNotifications = (channelId, currentChannelId, notifications, snap) => {
		let lastTotal = 0;

		let index = notifications.findIndex(notification => notification.id === channelId);
		if (index !== -1) {
			if (channelId !== currentChannelId) {
				lastTotal = notifications[index].total;

				if (snap.numChildren() - lastTotal > 0) {
					notifications[index].count = snap.numChildren() - lastTotal;
				}
			}
			notifications[index].lasKnownTotal = snap.numChildren();
		} else {
			notifications.push({
				id: channelId,
				total: snap.numChildren(),
				lasKnownTotal: snap.numChildren(),
				count: 0,
			});
		}

		this.setState({
			notifications,
		});
	};

	removeListenners = () => {
		this.state.channelsRef.off();
		this.state.channels.forEach(channel => {
			this.state.messagesRef.child(channel.id).off();
		});
	};

	setFirstChannel = () => {
		const firstChannel = this.state.channels[0];
		if (this.state.firstLoad && this.state.channels.length > 0) {
			this.props.setCurrentChannel(firstChannel);
			this.setActiveChannel(firstChannel);
			this.setState({ channel: firstChannel });
		}

		this.setState({
			firstLoad: false,
		});
	};

	closeModal = () => {
		this.setState({
			modal: false,
		});
	};

	openModal = () => {
		this.setState({
			modal: true,
		});
	};

	handleChange = e => {
		this.setState({
			[e.target.name]: e.target.value,
		});
	};

	handleSubmit = e => {
		e.preventDefault();
		if (this.isFormValid(this.state)) {
			this.addChannel();
		}
	};

	addChannel = () => {
		const { channelsRef, channelName, channelDetails } = this.state;
		const { currentUser } = this.props;

		const key = channelsRef.push().key;

		const newChannel = {
			id: key,
			name: channelName,
			details: channelDetails,
			createdBy: {
				name: currentUser.displayName,
				avatar: currentUser.photoURL,
			},
		};

		channelsRef
			.child(key)
			.update(newChannel)
			.then(() => {
				this.setState({
					channelName: '',
					channelDetails: '',
					modal: false,
				});
			});
	};

	isFormValid = ({ channelName, channelDetails }) => channelName && channelDetails;

	getNotificationCount = channel => {
		let count = 0;

		this.state.notifications.forEach(notification => {
			if (notification.id === channel.id) {
				count = notification.count;
			}
		});

		if (count > 0) return count;
	};

	displayChannels = channels => {
		return (
			channels.length > 0 &&
			channels.map(channel => (
				<Menu.Item
					key={channel.id}
					onClick={() => this.changeChannel(channel)}
					name={channel.name}
					style={{ opacity: 0.7 }}
					active={channel.id === this.state.activeChannel}
				>
					{this.getNotificationCount(channel) && (
						<Label color="red">{this.getNotificationCount(channel)}</Label>
					)}
					# {channel.name}
				</Menu.Item>
			))
		);
	};

	changeChannel = channel => {
		this.setActiveChannel(channel);
		this.state.typingRef
			.child(this.state.channel.id)
			.child(this.props.currentUser.uid)
			.remove();

		this.clearNotifications();
		this.props.setCurrentChannel(channel);
		this.props.setPrivateChannel(false);
		this.setState({
			channel,
		});
	};

	clearNotifications = () => {
		let index = this.state.notifications.findIndex(notification => notification.id === this.state.channel.id);

		if (index !== -1) {
			let updateNotifications = [...this.state.notifications];
			updateNotifications[index].total = this.state.notifications[index].lasKnownTotal;
			updateNotifications[index].count = 0;
			this.setState({
				notifications: updateNotifications,
			});
		}
	};

	setActiveChannel = channel => {
		this.setState({
			activeChannel: channel.id,
		});
	};

	render() {
		const { modal, channels } = this.state;
		return (
			<Fragment>
				<Menu.Menu className="menu">
					<Menu.Item>
						<span>
							<Icon name="exchange" /> CHANNELS
						</span>{' '}
						({channels.length}) <Icon name="add" onClick={this.openModal} />
					</Menu.Item>
					{/* Channels */}
					{this.displayChannels(channels)}
				</Menu.Menu>
				{/* Add Channel Modal */}
				<Modal basic open={modal} onClose={this.closeModal}>
					<Modal.Header>Add a Channel</Modal.Header>
					<Modal.Content>
						<Form onSubmit={this.handleSubmit}>
							<Form.Field>
								<Input fluid label="Name of Channel" name="channelName" onChange={this.handleChange} />
							</Form.Field>
							<Form.Field>
								<Input
									fluid
									label="About the channel"
									name="channelDetails"
									onChange={this.handleChange}
								/>
							</Form.Field>
						</Form>
					</Modal.Content>
					<Modal.Actions>
						<Button color="green" inverted onClick={this.handleSubmit}>
							<Icon name="checkmark" /> Add Channel
						</Button>
						<Button color="red" inverted onClick={this.closeModal}>
							<Icon name="remove" /> Cancel
						</Button>
					</Modal.Actions>
				</Modal>
			</Fragment>
		);
	}
}

const mapDispatchToProps = {
	setCurrentChannel,
	setPrivateChannel,
};

const connectEnhancer = connect(
	null,
	mapDispatchToProps
);

const enhancer = compose(connectEnhancer);

export default enhancer(Channels);
