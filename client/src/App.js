import React from "react";
import {BrowserRouter as Router, Route} from 'react-router-dom';
import {DepRouter} from './Component/DepRouter';

import TreeListExamplePage from './Page/TreeListExample';
import BalancePage from './Page/Balance';
import ReferredListExamplePage from './Page/ReferredListExample';

import {genEntries, genRefTable} from './nameGenerate';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const refCols = {
  ref: {desc: '条目', width: 12, isSortable: false, isFilterable: true, cellType:'Ref'}
}

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
          {/* <TreeListExamplePage data={entries} /> */}
        </Route>
        <Route path="/Home/Preface/Balance">
          {/* <BalancePage data={entries} name="BALANCE" desc="余额表" /> */}
        </Route>
        <Route path="/Home/Preface/ReferredTreeList">
          <ReferredListExamplePage tableName="CASHFLOW_WORKSHEET" referredName="BALANCE" desc="现流表" colSpecs={refCols}/>
        </Route>
      </DepRouter>
    </Router>
  </div>
};

export default App;