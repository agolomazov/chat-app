import React from 'react';
import { Header, Segment, Input, Icon } from 'semantic-ui-react';

const MessagesHeader = ({
	channelName,
	numUniqueUsers,
	searchTerm,
	onChangeSearch,
	searchLoading,
	isPrivateChannel,
	handleStar,
	isChannelStarred,
}) => (
	<Segment clearing>
		{/* Channel title */}
		<Header fluid="true" as="h2" floated="left" style={{ marginBottom: 0 }}>
			<span>
				{channelName}
				{!isPrivateChannel && (
					<Icon
						name={isChannelStarred ? 'star' : 'star outline'}
						color={isChannelStarred ? 'yellow' : 'black'}
						onClick={handleStar}
					/>
				)}
			</span>
			<Header.Subheader>{numUniqueUsers}</Header.Subheader>
		</Header>

		{/* Channel Search Input */}
		<Header floated="right">
			<Input
				size="mini"
				icon="search"
				name="searchTerm"
				placeholder="Search Messages"
				value={searchTerm}
				onChange={onChangeSearch}
				loading={searchLoading}
			/>
		</Header>
	</Segment>
);

export default MessagesHeader;
