import React, { PureComponent } from 'react';
import { Grid, Form, Segment, Button, Header, Message, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import firebase from '../../firebase';
import '../App.css';

class Login extends PureComponent {
	state = {
		email: '',
		password: '',
		errors: [],
		loading: false,
	};

	displayErrors = errors => errors.map((error, i) => <p key={i}>{error.message}</p>);

	handleChange = event => {
		this.setState({
			[event.target.name]: event.target.value,
		});
	};

	handleSubmit = event => {
		event.preventDefault();
		if (this.isFormValid(this.state)) {
			this.setState({
				errors: [],
				loading: true,
			});
			const { email, password } = this.state;
			firebase
				.auth()
				.signInWithEmailAndPassword(email, password)
				.then(signedUser => {
					console.log(signedUser);
					this.setState({
						loading: false,
					});
				})
				.catch(error =>
					this.setState({
						loading: false,
						errors: [{ message: error.message }],
					})
				);
		}
	};

	isFormValid = ({ email, password }) => email && password;

	handleErrorInput = (errors, field) => {
		return errors.some(error => error.message.toLowerCase().includes(field)) ? 'error' : '';
	};

	render() {
		const { email, password, errors, loading } = this.state;
		return (
			<Grid textAlign="center" verticalAlign="middle" className="app">
				<Grid.Column style={{ maxWidth: 450 }}>
					<Header as="h2" icon color="violet" textAlign="center">
						<Icon name="code branch" color="violet" />
						Login to DevChat
					</Header>
					<Form size="large" onSubmit={this.handleSubmit}>
						<Segment stacked>
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

							<Button color="violet" fluid loading={loading} size="large">
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
						Don't have an account? <Link to="/register">Register</Link>
					</Message>
				</Grid.Column>
			</Grid>
		);
	}
}

export default Login;
