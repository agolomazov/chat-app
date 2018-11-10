import React, { Component } from 'react';
import firebase from '../../firebase';
import { Menu, Icon } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { setCurrentChannel, setPrivateChannel } from '../../actions';
import { setDisplayName, compose } from 'recompose';

class DirectMessages extends Component {
	state = {
		activeChannel: '',
		users: [],
		usersRef: firebase.database().ref('users'),
		connectedRef: firebase.database().ref('.info/connected'),
		presenceRef: firebase.database().ref('presence'),
	};

	componentDidMount() {
		const { user } = this.props;
		if (user) {
			this.addListeners(user.uid);
		}
	}

	componentWillUnmount() {
		this.removeListeners();
	}

	removeListeners = () => {
		this.state.usersRef.off();
		this.state.presenceRef.off();
		this.state.connectedRef.off();
	};

	addListeners = currentUserId => {
		let loadedUsers = [];
		this.state.usersRef.on('child_added', snap => {
			if (currentUserId !== snap.key) {
				let user = snap.val();
				user['uid'] = snap.key;
				user['status'] = 'offline';
				loadedUsers.push(user);
				this.setState({
					users: loadedUsers,
				});
			}
		});

		this.state.connectedRef.on('value', snap => {
			if (snap.val() === true) {
				const ref = this.state.presenceRef.child(currentUserId);
				ref.set(true);
				ref.onDisconnect().remove(err => {
					if (err !== null) {
						console.error(err);
					}
				});
			}
		});

		this.state.presenceRef.on('child_added', snap => {
			if (currentUserId !== snap.key) {
				this.addStatusToUser(snap.key);
			}
		});

		this.state.presenceRef.on('child_removed', snap => {
			if (currentUserId !== snap.key) {
				this.addStatusToUser(snap.key, false);
			}
		});
	};

	addStatusToUser = (userId, connected = true) => {
		const updatedUsers = this.state.users.reduce((acc, user) => {
			if (user.uid === userId) {
				user['status'] = `${connected ? 'online' : 'offline'}`;
			}
			return [...acc, user];
		}, []);
		this.setState({
			users: updatedUsers,
		});
	};

	isUserOnline = user => user.status === 'online';

	changeChannel = user => {
		const channelId = this.getChannelId(user.uid);
		const channelData = {
			id: channelId,
			name: user.name,
		};
		this.props.setCurrentChannel(channelData);
		this.props.setPrivateChannel(true);
		this.setActiveChannel(user.uid);
	};

	setActiveChannel = userId => {
		this.setState({
			activeChannel: userId,
		});
	};

	getChannelId = userId => {
		const currentUserId = this.props.user.uid;
		return userId < currentUserId ? `${userId}/${currentUserId}` : `${currentUserId}/${userId}`;
	};

	render() {
		const { users, activeChannel } = this.state;

		return (
			<Menu.Menu className="menu">
				<Menu.Item>
					<span>
						<Icon name="mail" /> Direct Messages
					</span>{' '}
					({users.length})
				</Menu.Item>
				{users.map(user => (
					<Menu.Item
						key={user.uid}
						active={user.uid === activeChannel}
						onClick={() => this.changeChannel(user)}
						style={{ opacity: 0.7, fontStyle: 'italic' }}
					>
						<Icon name="circle" color={this.isUserOnline(user) ? 'green' : 'red'} />@ {user.name}
					</Menu.Item>
				))}
			</Menu.Menu>
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

const enhancer = compose(
	setDisplayName('DirectMessages'),
	connectEnhancer
);

export default enhancer(DirectMessages);