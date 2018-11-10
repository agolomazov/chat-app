import React, { Component } from 'react';
import { Modal, Input, Button, Icon } from 'semantic-ui-react';
import mimeType from 'mime-types';

class FileModal extends Component {
	state = {
		file: null,
		allowedFiles: ['image/jpeg', 'image/png'],
	};

	addFile = e => {
		const file = e.target.files[0];
		if (file) {
			this.setState({
				file,
			});
		}
	};

	sendFile = () => {
		const { file } = this.state;
		const { uploadFile, closeModal } = this.props;

		if ([file && this.isAllowedFiles(file.name)].some(Boolean)) {
			const metadata = { contentType: mimeType.lookup(file.name) };
			uploadFile(file, metadata);
			closeModal();
		}
	};

	isAllowedFiles = file => this.state.allowedFiles.includes(mimeType.lookup(file));

	static getDerivedStateFromProps(props) {
		if (!props.modal) {
			return {
				file: null,
			};
		}
		return null;
	}

	render() {
		const { modal, closeModal } = this.props;

		return (
			<Modal basic open={modal} onClose={closeModal}>
				<Modal.Header>Select an Image File</Modal.Header>
				<Modal.Content>
					<Input onChange={this.addFile} fluid label="File types: jpg, png" name="file" type="file" />
				</Modal.Content>
				<Modal.Actions>
					<Button color="green" inverted onClick={this.sendFile}>
						<Icon name="checkmark" /> Send
					</Button>
					<Button color="red" inverted onClick={closeModal}>
						<Icon name="remove" /> Cancel
					</Button>
				</Modal.Actions>
			</Modal>
		);
	}
}

export default FileModal;
