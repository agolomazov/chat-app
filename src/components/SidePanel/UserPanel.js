import React from 'react';
import { Grid, Header, Icon, Dropdown, Image, Modal, Input, Button } from 'semantic-ui-react';
import firebase from '../../firebase';
import { compose, withHandlers, withState, setDisplayName } from 'recompose';
import AvatarEditor from 'react-avatar-editor';

const onLogout = () => {
	firebase.auth().signOut();
};

const stateEnhancer = compose(
	withState('modal', 'setModal', false),
	withState('avatar', 'setAvatar', ''),
	withState('croppedImage', 'setCropImage', ''),
	withState('blob', 'setBlob', ''),
	withState('uploadedCroppedImage', 'setUploadedCroppedImage', ''),
	withState('loading', 'setLoading', false),
	withState('storageRef', 'setStorageRef', firebase.storage().ref())
);

const handlersEnhancer = withHandlers({
	dropdownOptions: ({ setModal }) => () => [
		{
			key: 'user',
			text: (
				<span>
					Signed in as <strong>User</strong>
				</span>
			),
			disabled: true,
		},
		{
			key: 'avatar',
			text: <span onClick={() => setModal(true)}>Change avatar</span>,
		},
		{
			key: 'signout',
			text: <span onClick={onLogout}>Sign Out</span>,
		},
	],
	handleChangeAvatar: ({ setAvatar }) => event => {
		const file = event.target.files[0];
		const reader = new FileReader();

		if (file) {
			reader.readAsDataURL(file);
			reader.addEventListener('load', () => {
				setAvatar(reader.result);
			});
		}
	},
	handleCropImage: ({ setCropImage, setBlob }) => nodeRef => {
		if (nodeRef) {
			nodeRef.getImageScaledToCanvas().toBlob(blob => {
				let imageUrl = URL.createObjectURL(blob);
				setCropImage(imageUrl);
				setBlob(blob);
			});
		}
	},
	uploadCroppedImage: ({
		croppedImage,
		storageRef,
		currentUser,
		blob,
		setUploadedCroppedImage,
		uploadedCroppedImage,
		setModal,
		usersRef,
		setLoading,
	}) => () => {
		setLoading(true);
		storageRef
			.child(`avatar/users/${currentUser.uid}`)
			.put(blob, { contentType: 'image/jpeg' })
			.then(snap => {
				snap.ref.getDownloadURL().then(downloadURL => {
					setUploadedCroppedImage(downloadURL);

					currentUser
						.updateProfile({
							photoURL: downloadURL,
						})
						.then(() => {
							setLoading(false);
							setModal(false);
						});
				});
			});
	},
});

const enhancer = compose(
	setDisplayName('UserPanel'),
	stateEnhancer,
	handlersEnhancer
);

const UserPanel = ({
	dropdownOptions,
	currentUser,
	primaryColor,
	modal,
	setModal,
	handleChangeAvatar,
	avatar,
	handleCropImage,
	croppedImage,
	blob,
	uploadCroppedImage,
	loading,
}) => {
	let avatarEditorRef = null;
	return (
		<Grid style={{ background: primaryColor }}>
			<Grid.Column>
				<Grid.Row style={{ padding: '1.2em', margin: 0 }}>
					{/* App Header */}
					<Header inverted floated="left" as="h2">
						<Icon name="code" />
						<Header.Content>DevChat</Header.Content>
					</Header>
				</Grid.Row>
				{/* User dropdown */}
				<Header style={{ padding: '0.25em' }} as="h4" inverted>
					<Dropdown
						trigger={
							<span>
								{currentUser && (
									<span>
										<Image
											spaced="right"
											avatar
											src={currentUser.photoURL}
											alt={currentUser.displayName}
										/>
										{currentUser.displayName}
									</span>
								)}
							</span>
						}
						options={dropdownOptions()}
					/>
				</Header>

				{/* Change User Avatar Modal */}
				<Modal open={modal} onClose={() => setModal(false)}>
					<Modal.Header>Change Avatar</Modal.Header>
					<Modal.Content>
						<Input fluid type="file" label="New Avatar" name="previewImage" onChange={handleChangeAvatar} />
						<Grid centered stackable columns={2}>
							<Grid.Row>
								<Grid.Column className="ui center aligned grid">
									{avatar && (
										<AvatarEditor
											image={avatar}
											width={120}
											height={120}
											border={50}
											scale={1.2}
											ref={node => (avatarEditorRef = node)}
										/>
									)}
								</Grid.Column>
								<Grid.Column>
									{croppedImage && (
										<Image
											style={{ margin: '3.5em auto' }}
											width={100}
											height={100}
											src={croppedImage}
										/>
									)}
								</Grid.Column>
							</Grid.Row>
						</Grid>
					</Modal.Content>
					<Modal.Actions>
						{croppedImage && (
							<Button color="green" inverted onClick={uploadCroppedImage} loading={loading}>
								<Icon name="save" />
								Change Avatar
							</Button>
						)}
						<Button
							color="green"
							inverted
							loading={loading}
							onClick={() => handleCropImage(avatarEditorRef)}
						>
							<Icon name="image" />
							Preview
						</Button>
						<Button color="red" inverted loading={loading} onClick={() => setModal(false)}>
							<Icon name="remove" />
							Cancel
						</Button>
					</Modal.Actions>
				</Modal>
			</Grid.Column>
		</Grid>
	);
};

export default enhancer(UserPanel);
