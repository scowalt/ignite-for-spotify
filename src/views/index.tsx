// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import ReactDOM from 'react-dom';

import './index.scss';
import { TitleBar } from './components/TitleBar';
import { Container } from 'react-bootstrap';

ReactDOM.render(<><TitleBar></TitleBar><Container><h1>Hello world!</h1></Container></>, document.getElementById('root'));