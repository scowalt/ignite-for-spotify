import ReactGA from 'react-ga';
ReactGA.initialize(process.env.GA_TRACKING_ID!);

import ReactDOM from 'react-dom';
import 'bootstrap';
import './index.scss';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { App } from './components/App';

ReactDOM.render(<BrowserRouter><App /></BrowserRouter>, document.getElementById('root'));
