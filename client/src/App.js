import React from "react";
import {DepRouter} from './Component/DepRouter';
import Page from './Component/Page';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { GrandExchange } from "./Component/GrandExchange";

const App = () => {

  return  <div style={{height:'100vh', width:'100vw'}}>
    <GrandExchange>
      <DepRouter {...{directories:undefined}}>
        <Page />
      </DepRouter>
    </GrandExchange>
  </div>
};

export default App;