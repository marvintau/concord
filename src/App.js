import React, { useState, useEffect, useContext, useCallback } from "react";
import {BrowserRouter as Router, Route} from 'react-router-dom';
import {DepRouterContext, DepRouter} from './Component/DepRouter';

import TreeListExamplePage from './Page/TreeListExample';
import ReferredListExamplePage from './Page/ReferredListExample';

import {genEntries, genRefTable} from './nameGenerate';

import 'bootstrap/dist/css/bootstrap.min.css';

const entries = genEntries(20000);
const refTable = genRefTable(entries, 200);
console.log(refTable, 'ref');
// HistoryHodler is passed into as the innerElementType, which is div by normal.
// however, it doesn't affected by scrolling, and is the place where we are going
// to render sticky items.


const directories = {
  Home: {
    desc: 'Home',
    children: ['TreeList', 'ReferredTreeList']
  },
  TreeList: {
    desc: 'Tree-like list',
    // children: []
  },
  ReferredTreeList: {
    desc: 'TreeList with referred table',
    // children: []
  }
}

const PageTitle = () => {

  const titleStyle = {
    marginLeft:'10px',
    fontFamily: '"Avenir Next Condensed", "Helvetica Neue", sans-serif',
    lineHeight:'4.5rem',
    fontWeight:'700',
    fontSize:'4rem',
    letterSpacing:'-0.2rem'
  }

  const {currPage:{desc}} = useContext(DepRouterContext);
  console.log(desc);
  return <h1 style={titleStyle}>{desc}</h1>
}

const App = () => {

  return  <div style={{height:'100vh', width:'100vw'}}>
    <Router>
      <DepRouter {...{directories}}>
        <PageTitle />
        <Route exact path="/Home"><></>
          {/* <List data={entries} colSpecs={colSpecs} /> */}
        </Route>
        <Route path="/Home/TreeList">
          <TreeListExamplePage data={entries} />
        </Route>
        <Route path="/Home/ReferredTreeList">
          <ReferredListExamplePage table={refTable} referredTable={entries} />
        </Route>
      </DepRouter>
    </Router>
  </div>
};

export default App;