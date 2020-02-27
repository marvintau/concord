import React from "react";
import {BrowserRouter as Router, Route} from 'react-router-dom';
import {DepRouter} from './Component/DepRouter';

import TreeListExamplePage from './Page/TreeListExample';
import BalancePage from './Page/Balance';
import ReferredListExamplePage from './Page/ReferredListExample';

import {genEntries, genRefTable} from './nameGenerate';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const entries = genEntries(20000);
const refTable = genRefTable(entries, 200);
// HistoryHodler is passed into as the innerElementType, which is div by normal.
// however, it doesn't affected by scrolling, and is the place where we are going
// to render sticky items.

const App = () => {

  return  <div style={{height:'100vh', width:'100vw'}}>
    <Router>
      <DepRouter {...{directories:undefined}}>
        <Route exact path="/Admin"><></>
          {/* <List data={entries} colSpecs={colSpecs} /> */}
        </Route>
        <Route exact path="/Home"><></>
        </Route>
        <Route path="/Home/Preface/TreeList">
          <TreeListExamplePage data={entries} />
        </Route>
        <Route path="/Home/Preface/Balance">
          <BalancePage data={entries} name="BALANCE" desc="余额表" />
        </Route>
        <Route path="/Home/Preface/ReferredTreeList">
          <ReferredListExamplePage name="CASHFLOW_WORKSHEET" referredTableName="BALANCE" desc="现流表" />
        </Route>
      </DepRouter>
    </Router>
  </div>
};

export default App;