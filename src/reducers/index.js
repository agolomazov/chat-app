import * as actionTypes from '../actions/types';
import { handleActions } from 'redux-actions';
import { combineReducers } from 'redux';

const initialUserState = {
	currentUser: null,
	isLoading: true,
};

const initialChannelState = {
	currentChannel: null,
	isPrivateChannel: false,
	userPosts: null,
	isLoading: false,
};

const initialColorState = {
	primaryColor: '#4c3c4c',
	secondaryColor: '#eeeeee',
};

export const user_reducer = handleActions(
	{
		[actionTypes.SET_USER]: (state, action) => ({
			currentUser: action.payload.currentUser,
			isLoading: false,
		}),
		[actionTypes.CLEAR_USER]: (state, action) => ({
			...initialUserState,
			isLoading: false,
		}),
	},
	initialUserState
);

const channel_reducer = handleActions(
	{
		[actionTypes.SET_CURRENT_CHANNEL]: (state, action) => ({
			...state,
			currentChannel: action.payload.currentChannel,
			isLoading: false,
		}),
		[actionTypes.SET_PRIVATE_CHANNEL]: (state, action) => ({
			...state,
			isPrivateChannel: action.payload.isPrivateChannel,
		}),
		[actionTypes.SET_USER_POSTS]: (state, action) => ({
			...state,
			userPosts: action.payload.userPosts,
		}),
	},
	initialChannelState
);

const colors_reducer = handleActions(
	{
		[actionTypes.SET_COLORS]: (state, { payload: { primaryColor, secondaryColor } }) => ({
			...state,
			primaryColor,
			secondaryColor,
		}),
	},
	initialColorState
);

export default combineReducers({
	user: user_reducer,
	channel: channel_reducer,
	colors: colors_reducer,
});
