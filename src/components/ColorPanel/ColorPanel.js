import React, { Component, Fragment } from 'react';
import { Sidebar, Menu, Divider, Button, Modal, Icon, Label, Segment } from 'semantic-ui-react';
import { SliderPicker } from 'react-color';
import firebase from '../../firebase';
import { setColor } from '../../actions';
import { compose, setDisplayName } from 'recompose';
import { connect } from 'react-redux';

class ColorPanel extends Component {
	state = {
		modal: false,
		primary: '',
		secondary: '',
		userRef: firebase.database().ref('users'),
		userColors: [],
	};

	componentDidMount() {
		if (this.props.currentUser) {
			this.addListener(this.props.currentUser.uid);
		}
	}

	componentWillUnmount() {
		this.removeListener();
	}

	removeListener = () => {
		this.state.userRef.child(`${this.props.currentUser.uid}/colors`).off();
	};

	addListener = userId => {
		let userColors = [];
		this.state.userRef.child(`${userId}/colors`).on('child_added', snap => {
			userColors.unshift(snap.val());
			this.setState({ userColors });
		});
	};

	openModal = () => {
		this.setState({
			modal: true,
		});
	};

	closeModal = () => {
		this.setState({
			modal: false,
		});
	};

	handleChangePrimary = color => {
		this.setState({ primary: color.hex });
	};

	handleChangeSecondary = color => {
		this.setState({ secondary: color.hex });
	};

	handleSaveColors = () => {
		const { primary, secondary } = this.state;
		if (primary && secondary) {
			this.saveColors(primary, secondary);
		}
	};

	saveColors = (primary, secondary) => {
		const { currentUser } = this.props;
		const { userRef } = this.state;

		userRef
			.child(`${currentUser.uid}/colors`)
			.push()
			.update({
				primary,
				secondary,
			})
			.then(() => {
				console.log('Colors added');
				this.closeModal();
			})
			.catch(err => console.error(err));
	};

	displayUserColors = colors =>
		colors.length > 0 &&
		colors.map((color, i) => (
			<Fragment key={i}>
				<Divider />
				<div className="color__container" onClick={() => this.props.setColor(color.primary, color.secondary)}>
					<div className="color__square" style={{ background: color.primary }}>
						<div className="color__overlay" style={{ background: color.secondary }} />
					</div>
				</div>
			</Fragment>
		));

	render() {
		const { modal, primary, secondary, userColors } = this.state;
		return (
			<Sidebar as={Menu} icon="labeled" inverted vertical visible width="very thin">
				<Divider />
				<Button icon="add" size="small" color="blue" onClick={this.openModal} />
				{this.displayUserColors(userColors)}

				{/* Color Picker modal */}
				<Modal basic open={modal} onClose={this.closeModal}>
					<Modal.Header>Choose App Colors</Modal.Header>
					<Modal.Content>
						<Segment inverted>
							<Label content="Primary Color" />
							<SliderPicker onChange={this.handleChangePrimary} color={primary} />
						</Segment>
						<Segment inverted>
							<Label content="Secondary Color" />
							<SliderPicker onChange={this.handleChangeSecondary} color={secondary} />
						</Segment>
					</Modal.Content>
					<Modal.Actions>
						<Button color="green" inverted onClick={this.handleSaveColors}>
							<Icon name="checkmark" /> Save Colors
						</Button>

						<Button color="red" inverted onClick={this.closeModal}>
							<Icon name="remove" /> Cancel
						</Button>
					</Modal.Actions>
				</Modal>
			</Sidebar>
		);
	}
}

const mapDispatchToProps = {
	setColor,
};

const connectEnhancer = connect(
	null,
	mapDispatchToProps
);

const enhancer = compose(
	setDisplayName('ColorPanel'),
	connectEnhancer
);

export default enhancer(ColorPanel);
