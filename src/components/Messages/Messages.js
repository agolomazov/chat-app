import React, { Component, Fragment } from 'react';
import { Segment, Comment } from 'semantic-ui-react';
import MessagesHeader from './MessagesHeader';
import MessagesForm from './MessagesForm';
import firebase from '../../firebase';
import Message from './Message';
import { setUserPosts } from '../../actions';
import { connect } from 'react-redux';
import { compose, setDisplayName } from 'recompose';
import { ifElse } from 'ramda';
import Typing from './Typing';
import Skeleton from './Skeleton';

class Messages extends Component {
	state = {
		messagesRef: firebase.database().ref('messages'),
		privateMessagesRef: firebase.database().ref('privateMessages'),
		usersRef: firebase.database().ref('users'),
		messages: [],
		messagesLoading: true,
		progressBar: false,
		numUniqueUsers: '',
		searchTerm: '',
		searchLoading: false,
		searchResults: [],
		isChannelStarred: false,
		typingRef: firebase.database().ref('typing'),
		typingUsers: [],
		connectedRef: firebase.database().ref('.info/connected'),
		listeners: [],
	};

	componentDidMount() {
		const { currentUser, currentChannel, listeners } = this.props;

		if (currentChannel && currentUser) {
			this.removeListeners(listeners);
			this.addListeners(currentChannel.id);
			this.addUserStarsListener(currentChannel.id, currentUser.uid);
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.messagesEnd) {
			setTimeout(this.scrollToBottom, 200);
		}
	}

	componentWillUnmount() {
		this.removeListeners(this.state.listeners);
		this.state.connectedRef.off();
	}

	addToListeners = (id, ref, event) => {
		const index = this.state.listeners.findIndex(listener => {
			return listener.id === id && listener.ref === ref && listener.event === event;
		});

		if (index === -1) {
			this.setState(prevState => ({
				listeners: [
					...prevState.listeners,
					{
						id,
						ref,
						event,
					},
				],
			}));
		}
	};

	removeListeners = listeners => {
		listeners &&
			listeners.forEach(listener => {
				listener.ref.child(listener.id).off(listener.event);
			});
	};

	scrollToBottom = () => {
		this.messagesEnd.scrollIntoView({
			behavior: 'smooth',
		});
	};

	addListeners = channelId => {
		this.addMessageListener(channelId);
		this.addTypingListeners(channelId);
	};

	addMessageListener = channelId => {
		let loadedMessages = [];
		const ref = this.getMessagesRef();
		ref.child(channelId).on('child_added', snap => {
			loadedMessages.push(snap.val());
			this.setState({
				messages: loadedMessages,
				messagesLoading: false,
			});
			this.countUniqueUsers(loadedMessages);
			this.countUserPosts(loadedMessages);
		});

		this.addToListeners(channelId, ref, 'child_added');
	};

	addTypingListeners = channelId => {
		let typingUsers = [];

		this.state.typingRef.child(channelId).on('child_added', snap => {
			if (snap.key !== this.props.currentUser.uid) {
				typingUsers = typingUsers.concat({
					id: snap.key,
					name: snap.val(),
				});
				this.setState({
					typingUsers,
				});
			}
		});
		this.addToListeners(channelId, this.state.typingRef, 'child_added');

		this.state.typingRef.child(channelId).on('child_removed', snap => {
			const index = typingUsers.findIndex(user => user.id === snap.key);
			if (index !== -1) {
				typingUsers = typingUsers.filter(user => user.id !== snap.key);
				this.setState({
					typingUsers,
				});
			}
		});

		this.addToListeners(channelId, this.state.typingRef, 'child_removed');

		this.state.connectedRef.on('value', snap => {
			if (snap.val() === true) {
				this.state.typingRef
					.child(channelId)
					.child(this.props.currentUser.uid)
					.onDisconnect()
					.remove(err => {
						if (err !== null) {
							console.error(err);
						}
					});
			}
		});
	};

	addUserStarsListener = (channelId, userId) => {
		this.state.usersRef
			.child(userId)
			.child('starred')
			.once('value')
			.then(data => {
				if (data.val() !== null) {
					const channelIds = Object.keys(data.val());
					const prevStarred = channelIds.includes(channelId);
					this.setState({
						isChannelStarred: prevStarred,
					});
				}
			});
	};

	getMessagesRef = () => {
		const { messagesRef, privateMessagesRef } = this.state;
		const { isPrivateChannel } = this.props;
		return isPrivateChannel ? privateMessagesRef : messagesRef;
	};

	handleStar = () => {
		console.log('handleStar');
		this.setState(
			state => ({
				isChannelStarred: !state.isChannelStarred,
			}),
			() => this.startChannel()
		);
	};

	startChannel = () => {
		const { isChannelStarred } = this.state;
		const conditionCallback = ifElse(
			condition => condition,
			() => {
				this.state.usersRef.child(`${this.props.currentUser.uid}/starred`).update({
					[this.props.currentChannel.id]: {
						name: this.props.currentChannel.name,
						details: this.props.currentChannel.details,
						createdBy: {
							name: this.props.currentChannel.createdBy.name,
							avatar: this.props.currentChannel.createdBy.avatar,
						},
					},
				});
			},
			() => {
				this.state.usersRef
					.child(`${this.props.currentUser.uid}/starred`)
					.child(this.props.currentChannel.id)
					.remove(err => {
						if (err !== null) {
							console.error(err);
						}
					});
			}
		);

		conditionCallback(isChannelStarred);
	};

	handleSearchChange = event => {
		this.setState(
			{
				searchTerm: event.target.value,
				searchLoading: true,
			},
			() => this.handleSearchMessages()
		);
	};

	handleSearchMessages = () => {
		const channelMessages = [...this.state.messages];
		const regex = new RegExp(this.state.searchTerm, 'gi');
		const searchResults = channelMessages.reduce((acc, message) => {
			if ((message.content && message.content.match(regex)) || message.user.name.match(regex)) {
				return [...acc, message];
			}
			return acc;
		}, []);
		this.setState({
			searchResults,
		});

		setTimeout(() => {
			this.setState({ searchLoading: false });
		}, 100);
	};

	countUniqueUsers = messages => {
		const uniqueUsers = messages.reduce((acc, message) => {
			if (!acc.includes(message.user.name)) {
				acc = acc.concat(message.user.name);
			}
			return acc;
		}, []);
		const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
		this.setState({
			numUniqueUsers: `${uniqueUsers.length} user${plural ? 's' : ''}`,
		});
	};

	countUserPosts = messages => {
		const userPosts = messages.reduce((acc, message) => {
			if (!acc[message.user.name]) {
				acc[message.user.name] = {
					avatar: message.user.avatar,
					count: 0,
				};
			}
			acc[message.user.name].count += 1;
			return acc;
		}, {});
		this.props.setUserPosts(userPosts);
	};

	displayMessages = messages =>
		messages.length > 0 &&
		messages.map(message => <Message key={message.timestamp} message={message} user={this.props.currentUser} />);

	isProgressBarVisible = percent => {
		if (percent > 0) {
			this.setState({
				progressBar: true,
			});
		}
	};

	displayChannelName = channel => {
		return channel ? `${this.props.isPrivateChannel ? '@' : '#'}${channel.name}` : '';
	};

	displayTypingUsers = users =>
		users.map(user => (
			<div key={user.uid} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.2em' }}>
				<span className="user__typing">{user.name} is typing</span> <Typing />
			</div>
		));

	displayMessagesSkeleton = loading => {
		return loading ? (
			<Fragment>
				{[...Array(10)].map((_, i) => (
					<Skeleton key={i} />
				))}
			</Fragment>
		) : null;
	};

	render() {
		const {
			messagesRef,
			messages,
			progressBar,
			numUniqueUsers,
			searchTerm,
			searchResults,
			searchLoading,
			isChannelStarred,
			typingUsers,
			messagesLoading,
		} = this.state;
		const { currentChannel, currentUser, isPrivateChannel } = this.props;
		return (
			<Fragment>
				<MessagesHeader
					channelName={this.displayChannelName(currentChannel)}
					numUniqueUsers={numUniqueUsers}
					searchTerm={searchTerm}
					onChangeSearch={this.handleSearchChange}
					searchLoading={searchLoading}
					isPrivateChannel={isPrivateChannel}
					handleStar={this.handleStar}
					isChannelStarred={isChannelStarred}
				/>

				<Segment>
					<Comment.Group className={progressBar ? 'messages_progress' : 'messages'}>
						{this.displayMessagesSkeleton(messagesLoading)}
						{searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
						{this.displayTypingUsers(typingUsers)}
						<div ref={node => (this.messagesEnd = node)} />
					</Comment.Group>
				</Segment>

				<MessagesForm
					messagesRef={messagesRef}
					currentChannel={currentChannel}
					currentUser={currentUser}
					isProgressBarVisible={this.isProgressBarVisible}
					isPrivateChannel={isPrivateChannel}
					getMessagesRef={this.getMessagesRef}
				/>
			</Fragment>
		);
	}
}

const mapDispatchToProps = {
	setUserPosts,
};

const connectEnhancer = connect(
	null,
	mapDispatchToProps
);
const enhancer = compose(
	setDisplayName('Messages'),
	connectEnhancer
);

export default enhancer(Messages);
