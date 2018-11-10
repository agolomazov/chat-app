import React, { Component } from 'react';
import { Segment, Button, Input } from 'semantic-ui-react';
import FileModal from './FileModal';
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase';
import ProgressBar from './ProgressBar';
import { ifElse } from 'ramda';
import { Picker, emojiIndex } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';

class MessagesForm extends Component {
	state = {
		message: '',
		loading: false,
		errors: [],
		modal: false,
		uploadState: '',
		uploadTask: null,
		storageRef: firebase.storage().ref(),
		typingRef: firebase.database().ref('typing'),
		percentUploaded: 0,
		emojiPicker: false,
	};

	componentWillUnmount() {
		if (this.state.uploadTask !== null) {
			this.state.uploadTask.cancel();
			this.setState({
				uploadState: null,
			});
		}
	}

	handleChange = e => {
		this.setState({
			[e.target.name]: e.target.value,
		});
	};

	handleKeyDown = event => {
		const { message, typingRef } = this.state;
		const { currentChannel, currentUser } = this.props;

		// Если пользователь нажал сочетание клавиш CTRL + ENTER
		if (event.ctrlKey && event.keyCode === 13) {
			this.sendMessage();
		}

		if (message) {
			typingRef
				.child(currentChannel.id)
				.child(currentUser.uid)
				.set(currentUser.displayName);
		} else {
			typingRef
				.child(currentChannel.id)
				.child(currentUser.uid)
				.remove();
		}
	};

	handleTogglePicker = () => {
		this.setState(prevState => {
			return {
				emojiPicker: !prevState.emojiPicker,
			};
		});
	};

	handleAddEmoji = emoji => {
		const { message } = this.state;
		const newMessage = this.colonToUnicode(`${message} ${emoji.colons}`);
		this.setState(
			{
				message: newMessage,
				emojiPicker: false,
			},
			() => {
				this.messageInputRef.focus();
			}
		);
	};

	colonToUnicode = message => {
		return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
			x = x.replace(/:/g, '');
			let emoji = emojiIndex.emojis[x];
			if (typeof emoji !== 'undefined') {
				let unicode = emoji.native;
				if (typeof unicode !== 'undefined') {
					return unicode;
				}
			}
			x = `:${x}:`;
			return x;
		});
	};

	openModal = () => {
		this.setState({ modal: true });
	};

	closeModal = () => {
		this.setState({ modal: false });
	};

	createMessage = (fileUrl = null) => {
		const message = {
			timestamp: firebase.database.ServerValue.TIMESTAMP,
			user: {
				id: this.props.currentUser.uid,
				name: this.props.currentUser.displayName,
				avatar: this.props.currentUser.photoURL,
			},
		};
		if (fileUrl !== null) {
			message['image'] = fileUrl;
		} else {
			message['content'] = this.state.message;
		}
		return message;
	};

	sendMessage = () => {
		const { currentChannel, getMessagesRef, currentUser } = this.props;
		const { message, typingRef } = this.state;

		if (message) {
			this.setState({ loading: true });
			getMessagesRef()
				.child(currentChannel.id)
				.push()
				.set(this.createMessage())
				.then(() => {
					this.setState({ loading: false, message: '', errors: [] });
					typingRef
						.child(currentChannel.id)
						.child(currentUser.uid)
						.remove();
				})
				.catch(err => {
					console.error(err);
					this.setState({
						loading: false,
						errors: this.state.errors.concat(err),
					});
				});
		} else {
			this.setState({
				errors: this.state.errors.concat({ message: 'Add a message' }),
			});
		}
	};

	getPath = () => {
		const { isPrivateChannel, currentChannel } = this.props;
		const condition = ifElse(
			isPrivate => isPrivate,
			() => `chat/private/${currentChannel.id}`,
			() => 'chat/public'
		);
		return condition(isPrivateChannel);
	};

	uploadFile = (file, metadata) => {
		const pathToUpload = this.props.currentChannel.id;
		const ref = this.props.getMessagesRef();
		const filePath = `${this.getPath()}/${uuidv4()}.jpg`;

		this.setState(
			{
				uploadState: 'uploading',
				uploadTask: this.state.storageRef.child(filePath).put(file, metadata),
			},
			() => {
				this.state.uploadTask.on(
					'state_changed',
					snap => {
						const percentUploaded = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
						this.props.isProgressBarVisible(percentUploaded);
						this.setState({ percentUploaded });
					},
					err => {
						console.error(err);
						this.setState({
							errors: this.state.errors.concat(err),
							uploadState: 'error',
							uploadTask: null,
						});
					},
					() => {
						this.state.uploadTask.snapshot.ref
							.getDownloadURL()
							.then(downloadUrl => {
								this.sendFileMessage(downloadUrl, ref, pathToUpload);
							})
							.catch(err => {
								console.error(err);
								this.setState({
									errors: this.state.errors.concat(err),
									uploadState: 'error',
									uploadTask: null,
								});
							});
					}
				);
			}
		);
	};

	sendFileMessage = (fileUrl, ref, pathToUpload) => {
		ref.child(pathToUpload)
			.push()
			.set(this.createMessage(fileUrl))
			.then(() => {
				this.setState({ uploadState: 'done' });
			})
			.catch(err => {
				console.error(err);
				this.setState({
					errors: this.state.errors.concat(err),
				});
			});
	};

	render() {
		const { message, errors, loading, modal, uploadState, percentUploaded, emojiPicker } = this.state;
		return (
			<Segment className="message__form">
				{emojiPicker && (
					<Picker
						set="apple"
						onSelect={this.handleAddEmoji}
						className="emojipicker"
						title="Pick your emoji"
						emoji="point_up"
					/>
				)}
				<Input
					fluid
					name="message"
					style={{ marginBottom: 10 }}
					label={
						<Button
							icon={emojiPicker ? 'close' : 'add'}
							onClick={this.handleTogglePicker}
							content={emojiPicker ? 'Close' : null}
						/>
					}
					labelPosition="left"
					placeholder="Write your message"
					value={message}
					ref={node => (this.messageInputRef = node)}
					onChange={this.handleChange}
					onKeyDown={this.handleKeyDown}
					className={errors.some(error => error.message.includes('message')) ? 'error' : ''}
				/>
				<Button.Group icon widths="2">
					<Button
						color="orange"
						content="Add Reply"
						disabled={loading}
						labelPosition="left"
						icon="edit"
						onClick={this.sendMessage}
					/>
					<Button
						color="teal"
						disabled={uploadState === 'uploading'}
						content="Upload Media"
						labelPosition="right"
						icon="cloud upload"
						onClick={this.openModal}
					/>
				</Button.Group>
				<FileModal modal={modal} closeModal={this.closeModal} uploadFile={this.uploadFile} />
				<ProgressBar uploadState={uploadState} percentUploaded={percentUploaded} />
			</Segment>
		);
	}
}

export default MessagesForm;
