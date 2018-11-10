import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import 'semantic-ui-css/semantic.min.css';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { BrowserRouter as Router, Switch, Route, withRouter } from 'react-router-dom';
import firebase from './firebase';
import Spinner from './components/Spinner/Spinner';
import { setUser, clearUser } from './actions';
import rootReducer from './reducers';
import { compose, setDisplayName, branch, renderComponent, lifecycle } from 'recompose';

const store = createStore(rootReducer, composeWithDevTools());

const Root = () => (
	<Switch>
		<Route path="/login" component={Login} />
		<Route path="/register" component={Register} />
		<Route path="/" component={App} />
	</Switch>
);

const mapDispatchToProps = {
	setUser,
	clearUser,
};

const mapStateToProps = state => ({
	isLoading: state.user.isLoading,
});

const branchEnhancer = branch(({ isLoading }) => isLoading, renderComponent(Spinner));

const lifecycleEnhancer = lifecycle({
	componentDidMount() {
		firebase.auth().onAuthStateChanged(user => {
			if (user) {
				if (this.props.location.pathname !== '/') {
					this.props.history.push('/');
				}
				this.props.setUser(user);
			} else {
				this.props.history.push('/login');
				this.props.clearUser();
			}
		});
	},
});

const connectEnhancer = connect(
	mapStateToProps,
	mapDispatchToProps
);

const enhancer = compose(
	setDisplayName('RootApp'),
	connectEnhancer,
	withRouter,
	lifecycleEnhancer,
	branchEnhancer
);

const RootWithAuth = withRouter(enhancer(Root));

ReactDOM.render(
	<Provider store={store}>
		<Router>
			<RootWithAuth />
		</Router>
	</Provider>,
	document.getElementById('root')
);
