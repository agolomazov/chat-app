import * as actionTypes from './types';
import { createAction } from 'redux-actions';

// User Actions
export const setUser = createAction(actionTypes.SET_USER, user => ({
	currentUser: user,
}));

export const clearUser = createAction(actionTypes.CLEAR_USER);

// Channel Actions
export const setCurrentChannel = createAction(actionTypes.SET_CURRENT_CHANNEL, channel => ({
	currentChannel: channel,
}));

export const setPrivateChannel = createAction(actionTypes.SET_PRIVATE_CHANNEL, isPrivate => ({
	isPrivateChannel: isPrivate,
}));

export const setUserPosts = createAction(actionTypes.SET_USER_POSTS, userPosts => ({
	userPosts,
}));

// Colors Actions
export const setColor = createAction(actionTypes.SET_COLORS, (primaryColor, secondaryColor) => ({
	primaryColor,
	secondaryColor,
}));
