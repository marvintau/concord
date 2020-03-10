import React from "react";
import {BrowserRouter as Router} from 'react-router-dom';
import {DepRouter} from './Component/DepRouter';
import Page from './Component/Page';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const App = () => {

  return  <div style={{height:'100vh', width:'100vw'}}>
    <Router>
      <DepRouter {...{directories:undefined}}>
        <Page />
      </DepRouter>
    </Router>
  </div>
};

export default App;