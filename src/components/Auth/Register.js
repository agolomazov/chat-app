import React, { PureComponent } from 'react';
import { Grid, Form, Segment, Button, Header, Message, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import firebase from '../../firebase';
import '../App.css';
import md5 from 'md5';

class Register extends PureComponent {
	state = {
		username: '',
		email: '',
		password: '',
		passwordConfirmation: '',
		errors: [],
		loading: false,
		usersRef: firebase.database().ref('users'),
	};

	displayErrors = errors => errors.map((error, i) => <p key={i}>{error.message}</p>);

	isFormValid = () => {
		let errors = [];
		let error = null;

		if (this.isFormEmpty(this.state)) {
			error = { message: 'Fill in all fields' };
			this.setState({ errors: errors.concat(error) });
			return false;
		} else if (!this.isPasswordValid(this.state)) {
			error = { message: 'Password is invalid' };
			this.setState({
				errors: errors.concat(error),
			});
		} else {
			this.setState({
				errors: [],
			});
			return true;
		}
	};

	isFormEmpty = ({ username, email, password, passwordConfirmation }) => {
		return [!username.length, !email.length, !password.length, !passwordConfirmation.length].some(Boolean);
	};

	isPasswordValid = ({ password, passwordConfirmation }) => {
		if ([password.length < 6, passwordConfirmation.length < 6, password !== passwordConfirmation].some(Boolean)) {
			return false;
		}
		return true;
	};

	handleChange = event => {
		this.setState({
			[event.target.name]: event.target.value,
		});
	};

	handleSubmit = event => {
		event.preventDefault();
		if (this.isFormValid()) {
			this.setState({
				errors: [],
				loading: true,
			});
			const { email, password } = this.state;
			firebase
				.auth()
				.createUserWithEmailAndPassword(email, password)
				.then(createdUser => {
					createdUser.user
						.updateProfile({
							displayName: this.state.username,
							photoURL: `http://gravatar.com/avatar/${md5(createdUser.user.email)}?d=identicon`,
						})
						.then(() => {
							this.saveUser(createdUser).then(() => {
								this.setState({
									loading: false,
								});
								console.log('User saved');
							});
						})
						.catch(error => {
							this.setState({
								errors: [{ message: error.message }],
								loading: false,
							});
						});
				})
				.catch(error => {
					this.setState({
						errors: [{ message: error.message }],
						loading: false,
					});
				});
		}
	};

	handleErrorInput = (errors, field) => {
		return errors.some(error => error.message.toLowerCase().includes(field)) ? 'error' : '';
	};

	saveUser = createdUser => {
		return this.state.usersRef.child(createdUser.user.uid).set({
			name: createdUser.user.displayName,
			avatar: createdUser.user.photoURL,
		});
	};

	render() {
		const { username, email, password, passwordConfirmation, errors, loading } = this.state;
		return (
			<Grid textAlign="center" verticalAlign="middle" className="app">
				<Grid.Column style={{ maxWidth: 450 }}>
					<Header as="h2" icon color="orange" textAlign="center">
						<Icon name="puzzle piece" color="orange" />
						Register for DevChat
					</Header>
					<Form size="large" onSubmit={this.handleSubmit}>
						<Segment stacked>
							<Form.Input
								fluid
								name="username"
								icon="user"
								iconPosition="left"
								placeholder="Username"
								onChange={this.handleChange}
								type="text"
								className={this.handleErrorInput(errors, 'username')}
								value={username}
							/>

							<Form.Input
								fluid
								name="email"
								icon="mail"
								iconPosition="left"
								placeholder="Email Address"
								onChange={this.handleChange}
								className={this.handleErrorInput(errors, 'email')}
								type="email"
								value={email}
							/>

							<Form.Input
								fluid
								name="password"
								icon="lock"
								iconPosition="left"
								placeholder="Password"
								onChange={this.handleChange}
								className={this.handleErrorInput(errors, 'password')}
								type="password"
								value={password}
							/>

							<Form.Input
								fluid
								name="passwordConfirmation"
								icon="repeat"
								iconPosition="left"
								placeholder="Password Confirm"
								onChange={this.handleChange}
								className={this.handleErrorInput(errors, 'password')}
								type="password"
								value={passwordConfirmation}
							/>

							<Button color="orange" fluid loading={loading} size="large">
								Submit
							</Button>
						</Segment>
					</Form>
					{errors.length > 0 && (
						<Message error>
							<h3>Error</h3>
							{this.displayErrors(errors)}
						</Message>
					)}
					<Message>
						Already a user? <Link to="/login">Login</Link>
					</Message>
				</Grid.Column>
			</Grid>
		);
	}
}

export default Register;
