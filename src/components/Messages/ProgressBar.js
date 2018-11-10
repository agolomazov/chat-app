import React from 'react';
import { Progress } from 'semantic-ui-react';

const ProgressBar = ({ uploadState, percentUploaded }) =>
	uploadState === 'uploading' && (
		<Progress percent={percentUploaded} className="progress__bar" process indicating size="medium" inverted />
	);

export default ProgressBar;
