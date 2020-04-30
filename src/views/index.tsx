// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import ReactDOM from 'react-dom';

import './index.scss';
import { TitleBar } from './components/TitleBar';
import { Container } from 'react-bootstrap';
import { Home } from './components/Home';

ReactDOM.render(<><TitleBar></TitleBar><Container fluid="sm"><Home></Home></Container></>, document.getElementById('root'));