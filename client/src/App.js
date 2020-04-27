import React from "react";
import {DepRouter} from './Component/DepRouter';
import Page from './Component/Page';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { ExchangeProvider } from "@marvintau/exchange";

const App = () => {

  return <ExchangeProvider>
    <DepRouter {...{directories:undefined}}>
      <Page />
    </DepRouter>
  </ExchangeProvider>
};

export default App;