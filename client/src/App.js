import React from "react";
import {DepRouter} from './Component/DepRouter';
import Page from './Component/Page';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { ExchangeProvider } from "./Component/Exchange";

const defaultColumnAliases = {
  借方 : 'md',
  贷方 : 'mc',
  期初 : 'mb',
  期末 : 'me'
}

const App = () => {

  return <ExchangeProvider {...{defaultColumnAliases}}>
    <DepRouter {...{directories:undefined}}>
      <Page />
    </DepRouter>
  </ExchangeProvider>
};

export default App;