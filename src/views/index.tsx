import ReactGA from 'react-ga';
ReactGA.initialize(process.env.GA_TRACKING_ID!);

import ReactDOM from 'react-dom';
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import 'bootstrap';
import './index.scss';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { App } from './components/App';

Sentry.init({
	dsn: "https://ec65c9471196443599be9bdf65b8ec1d@o848917.ingest.sentry.io/5815871",
	integrations: [new Integrations.BrowserTracing()],

	// We recommend adjusting this value in production, or using tracesSampler
	// for finer control
	tracesSampleRate: 1.0,
});

ReactDOM.render(<BrowserRouter><App /></BrowserRouter>, document.getElementById('root'));
