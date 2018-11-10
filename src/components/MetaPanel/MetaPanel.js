import React, { Component } from 'react';
import { Segment, Accordion, Header, Icon, Image, List } from 'semantic-ui-react';

class MetaPanel extends Component {
	state = {
		activeIndex: 0,
	};

	setActiveIndex = (event, titleProps) => {
		const { index } = titleProps;
		const { activeIndex } = this.state;
		const newIndex = activeIndex === index ? -1 : index;
		this.setState({
			activeIndex: newIndex,
		});
	};

	displayTopPosters = posts => {
		return Object.entries(posts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([key, val]) => (
				<List.Item key={key}>
					<Image avatar src={val.avatar} />
					<List.Content>
						<List.Header as="a">{key}</List.Header>
						<List.Description>{val.count} posts</List.Description>
					</List.Content>
				</List.Item>
			));
	};

	render() {
		const { activeIndex } = this.state;
		const { isPrivateChannel, currentChannel, userPosts } = this.props;
		if (isPrivateChannel) {
			return null;
		}
		return (
			<Segment loading={!currentChannel}>
				<Header as="h3" attached="top">
					About # {currentChannel && currentChannel.name}
				</Header>
				<Accordion>
					<Accordion.Title active={activeIndex === 0} index={0} onClick={this.setActiveIndex}>
						<Icon name="dropdown" />
						<Icon name="info" />
						Channel Details
					</Accordion.Title>
					<Accordion.Content active={activeIndex === 0}>
						{currentChannel && currentChannel.details}
					</Accordion.Content>

					<Accordion.Title active={activeIndex === 1} index={1} onClick={this.setActiveIndex}>
						<Icon name="dropdown" />
						<Icon name="user circle" />
						Top Posters
					</Accordion.Title>
					<Accordion.Content active={activeIndex === 1}>
						<List>{userPosts && this.displayTopPosters(userPosts)}</List>
					</Accordion.Content>

					<Accordion.Title active={activeIndex === 2} index={2} onClick={this.setActiveIndex}>
						<Icon name="dropdown" />
						<Icon name="pencil alternate" />
						Created By
					</Accordion.Title>
					<Accordion.Content active={activeIndex === 2}>
						{currentChannel && (
							<Header as="h3">
								<Image src={currentChannel.createdBy.avatar} circular />
								{currentChannel.createdBy.name}
							</Header>
						)}
					</Accordion.Content>
				</Accordion>
			</Segment>
		);
	}
}

export default MetaPanel;
