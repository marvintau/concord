import React, {createContext, useState, useContext, useEffect} from 'react';
import {Breadcrumb, BreadcrumbItem, ListGroup, ListGroupItem, Spinner} from 'reactstrap';
import Sidebar from 'react-sidebar';

import {Exchange} from '../Exchange';

import './dep-router.css';

const containProp = (object1, object2) => {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  for (let key2 of keys2){
    if (keys1.includes(key2)){
      return key2;
    }
  }

  return undefined;
}

export const DepRouterContext = createContext({
  currPage: {},
  currArgs: {},
  currPath: [],
  currSubs: [],
  fore: () => {},
  back: () => {},
  fetchDir : () => {}
})

const SideNavigationBar = ({directories, isHidden, children}) => {
  const {currPath, currSubs, fore, back} = useContext(DepRouterContext);

  const style = {
    height:'100%',
    margin:'10px',
    width: '200px'
  }

  let subElems = [];
  if(currSubs !== undefined){
    subElems = currSubs.map((e, i) => {
      return <ListGroupItem key={i} onClick={() => fore(e)} style={{cursor:'pointer'}}>
        {directories[e].desc}
      </ListGroupItem>
    })
  }

  let innerSidebar = <></>;
  if (currPath.length > 0){
    const {path:currPathEnd} = currPath[currPath.length-1];

    const {desc:currPathName, parent: currParent} = directories[currPathEnd];
    innerSidebar = <div>
      <h3 style={{margin:'15px', fontWeight:'bold', letterSpacing:'-0.05rem'}}>{currPathName}</h3>
      <ListGroup style={style}>
        {subElems}
      </ListGroup>
      <ListGroup style={style}>
        {currParent && <ListGroupItem color="warning" style={{cursor:'pointer'}} onClick={() => back(currParent)}>
          返回至 {directories[currParent].desc}
        </ListGroupItem>}
      </ListGroup>
    </div>
  }

  return <Sidebar
    sidebar={innerSidebar}
    docked={currSubs !== undefined && !isHidden}
    styles={{
      sidebar: {background: 'white', overflow:'hidden'},
      content: {
        height: '100vh',
        display:'flex',
        flexDirection:'column',
      }
    }}
  >
    {children}
  </Sidebar>
}

const NavigationBar = ({directories}) => {
  const {currPath, back} = useContext(DepRouterContext);
  // console.log(currPath, 'nav path');
  const pathElems = currPath.map(({path, args}, i) => {

    const {contextualName:ctxPageNavTitle, desc:defPageNavTitle} = directories[path];
    const pageNavTitle = ctxPageNavTitle
        ? args[ctxPageNavTitle]
        : defPageNavTitle

    return <BreadcrumbItem key={i}>
      <a onClick={() => back(path)} href="#">{pageNavTitle}</a>
    </BreadcrumbItem>
  })

  const bread = <Breadcrumb>{pathElems}</Breadcrumb>

  return currPath.length > 1 ? bread : <></>
}

export function DepRouter({children}) {

  const {pull, status, evalSheet, clearAllSheets, refreshSheets} = useContext(Exchange);

  const [dirs, setDirs] = useState({});
  const [currArgs, setArgs] = useState({});
  const [currPage, setPage] = useState({});
  const [currPath, setPath] = useState([]);
  const [currSubs, setSubs] = useState([]);

  // performs initialization.
  // Note that useEffect with empty dep array will guarantee that
  // it will be called single once.
  useEffect(() => {
    (async function(){
      const fetchedDirs = await fetchDir('/');
      setDirs(fetchedDirs);
      init(fetchedDirs);
    })()
  }, [])

  useEffect(() => {
    if (status === 'DONE_PULL') {
      console.log(currPage, 'dep router pull');

      for (let {name: sheetName} of currPage.data) {
        evalSheet(sheetName);
      }

      refreshSheets();
    }
  }, [status])

  const fetchDir = (fetchPath) => {

    const options = {
      method: 'POST',
      cache: 'no-cache',
      headers: {'Content-Type':'application/json;charset=UTF-8'},
      referrer: 'no-referrer',
      body : JSON.stringify({fetchPath})
    }

    return fetch('/pages', options)
    .then(res => {
      return res.json();
    }).then(res => {
      return res;
    })
  }

  const init = (initDirs) => {
    setArgs({});
    setPath([{path:'Home', args:{}}]);
    setPage(initDirs['Home']);
    setSubs(initDirs['Home'].children);  
  }

  const fore = (path, args={}) => {

    const page = dirs[path];

    setPage(page);
    setSubs(page.children);
    
    if (containProp(currArgs, args)){
      clearAllSheets();
    };

    const newArgs = {...currArgs, ...args};
    // console.log(JSON.stringify(newArgs, null, 2), JSON.stringify(currArgs, null, 2), 'args');
    setArgs(newArgs);

    const pathList = [...currPath, {path, args:newArgs}];
    setPath(pathList);

    if (page.data !== undefined){
      pull(page.data, newArgs);
    }

  }

  const back = (dest) => {
    const index = currPath.findIndex(({path}) => path === dest);

    const pathList = currPath.slice(0, index+1);
    setPath(pathList);
    
    const histPage = Object.assign({}, ...pathList.map(({context}) => context), dirs[dest]);
    setPage(histPage);

    const {data, args} = histPage;
    if (data !== undefined){
      pull(data, args);
    }

    setSubs(dirs[dest].children);
  }

  let content;
  if(dirs && Object.keys(dirs).length > 0){
    content = <SideNavigationBar directories={dirs} isHidden={['DATA', 'REFT'].includes(currPage.type)}>
      <NavigationBar directories={dirs} />
      {children}
    </SideNavigationBar>
  } else {
    content = <div style={{height: '100%', width: "100%", display: 'flex', flexDirection: 'column', alignItems:'center', justifyContent:'center'}}>
      <Spinner />
      <div>正在载入，请稍候</div>
      <div>Loading the remaining stuff...</div>
    </div>;
  }

  return <DepRouterContext.Provider value={{
      currPage, currPath, currSubs, currArgs,
      fore, back, fetchDir}}>
    {content}
  </DepRouterContext.Provider>
}