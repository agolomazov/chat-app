import React from 'react';
import { Grid } from 'semantic-ui-react';
import './App.css';
import ColorPanel from './ColorPanel/ColorPanel';
import SidePanel from './SidePanel/SidePanel';
import Messages from './Messages/Messages';
import MetaPanel from './MetaPanel/MetaPanel';
import { connect } from 'react-redux';
import { compose, setDisplayName } from 'recompose';

const mapStateToProps = state => ({
	currentUser: state.user.currentUser,
	currentChannel: state.channel.currentChannel,
	isPrivateChannel: state.channel.isPrivateChannel,
	userPosts: state.channel.userPosts,
	primaryColor: state.colors.primaryColor,
	secondaryColor: state.colors.secondaryColor,
});

const enhancer = compose(
	setDisplayName('App'),
	connect(mapStateToProps)
);

const App = ({ currentUser, currentChannel, isPrivateChannel, userPosts, primaryColor, secondaryColor }) => (
	<Grid columns="equal" className="app" style={{ background: secondaryColor }}>
		<ColorPanel key={currentUser && currentUser.name} currentUser={currentUser} />
		<SidePanel currentUser={currentUser} key={currentUser && currentUser.uid} primaryColor={primaryColor} />
		<Grid.Column style={{ marginLeft: 320 }}>
			<Messages
				key={currentChannel && currentChannel.id}
				currentChannel={currentChannel}
				currentUser={currentUser}
				isPrivateChannel={isPrivateChannel}
			/>
		</Grid.Column>
		<Grid.Column width={4}>
			<MetaPanel
				isPrivateChannel={isPrivateChannel}
				key={currentChannel && currentChannel.id}
				currentChannel={currentChannel}
				userPosts={userPosts}
			/>
		</Grid.Column>
	</Grid>
);

export default enhancer(App);
