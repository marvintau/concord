import React, {createContext, useState, useContext, useEffect} from 'react';
import {Breadcrumb, BreadcrumbItem, ListGroup, ListGroupItem} from 'reactstrap';
import Sidebar from 'react-sidebar';

import {GrandExchangeContext} from '../GrandExchange';

import './dep-router.css';

export const DepRouterContext = createContext({
  currPage: {},
  currPath: [],
  currSubs: [],
  forward: () => {},
  goto: () => {},
  fetchDir : () => {}
})

const SideNavigationBar = ({directories, isHidden, children}) => {
  const {currPath, currSubs, forward, goto} = useContext(DepRouterContext);

  const style = {
    height:'100%',
    margin:'10px',
    width: '200px'
  }

  
  let subElems = [];
  if(currSubs !== undefined){
    subElems = currSubs.map((e, i) => {
      return <ListGroupItem key={i} onClick={() => forward(e)} style={{cursor:'pointer'}}>
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
        {currParent && <ListGroupItem color="warning" style={{cursor:'pointer'}} onClick={() => goto(currParent)}>
          返回至 {directories[currParent].desc}
        </ListGroupItem>}
      </ListGroup>
    </div>
  }

  return <Sidebar
    sidebar={innerSidebar}
    docked={currSubs !== undefined && !isHidden}
    styles={{sidebar: {background: 'white'}}}
  >
    <div className="sidebar-content-wrapper">{children}</div>
  </Sidebar>
}

const NavigationBar = ({directories}) => {
  const {currPath, goto} = useContext(DepRouterContext);
  const pathElems = currPath.map(({path}, i) => {
    return <BreadcrumbItem key={i}>
      <a onClick={() => goto(path)} href="#">{directories[path].desc}</a>
    </BreadcrumbItem>
  })

  const bread = <Breadcrumb>{pathElems}</Breadcrumb>

  return currPath.length > 1 ? bread : <></>
}

export function DepRouter({home='Home', directories={}, children}) {

  const {pull, status, evalSheet} = useContext(GrandExchangeContext);

  const [initPage, initPath, initSubs] = Object.keys(directories).length === 0
    ? [{}, [], undefined]
    : [directories['Home'], [{path:'Home', context:{}}], directories['Home'].children]

  const [dirs, setDirs] = useState(directories);
  const [currPage, setPage] = useState(initPage);
  const [currPath, setPath] = useState(initPath);
  const [currSubs, setSubs] = useState(initSubs);

  // performs initialization
  useEffect(() => {
    (async function(){
      const dir = await fetchDir('/');
      setDirs(dir);

      setPath([{path:'Home', context:{}}]);
      setPage(dir['Home']);
      setSubs(dir['Home'].children);  
    })()
  }, [])

  useEffect(() => {
    if (status === 'DONE_PULL') {
      console.log(currPage, 'eff, dep router');
      evalSheet(currPage.sheetName);
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

  const forward = (path, context={}) => {

    const pathList = [...currPath, {path, context}];
    setPath(pathList);

    const page = {...currPage, ...context, ...dirs[path]};
    const {sheetName, referredSheetNames=[]} = page;
    if (sheetName !== undefined){
      pull([...referredSheetNames, sheetName], page);
    }

    console.log(page, dirs[path], path, 'path');
    setPage(page);
    setSubs(dirs[path].children);
  }

  const goto = (gotoPath) => {
    const index = currPath.findIndex(({path}) => path === gotoPath);
    console.log('goto', currPath[index], index)

    const pathList = currPath.slice(0, index+1);
    setPath(pathList);
    
    setPage(Object.assign({}, ...pathList.map(({context}) => context), dirs[gotoPath]));
    
    setSubs(dirs[gotoPath].children);
  }

  let content;
  if(dirs && Object.keys(dirs).length > 0){
    content = <SideNavigationBar directories={dirs} isHidden={['DATA', 'REFT'].includes(currPage.type)}>
      <NavigationBar directories={dirs} />
      {children}
    </SideNavigationBar>
  } else {
    content = 'loading ...';
  }

  return <DepRouterContext.Provider value={{currPage, currPath, currSubs, forward, goto, fetchDir}}>
    {content}
  </DepRouterContext.Provider>
}