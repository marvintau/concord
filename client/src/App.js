import React from "react";
import {DepRouter} from './Component/DepRouter';
import Page from './Component/Page';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { GrandExchange } from "./Component/GrandExchange";

const App = () => {

  return <GrandExchange>
    <DepRouter {...{directories:undefined}}>
      <Page />
    </DepRouter>
  </GrandExchange>
};

export default App;