import React, {createContext, useState, useContext, useEffect} from 'react';
import {Breadcrumb, BreadcrumbItem, ListGroup, ListGroupItem, Spinner} from 'reactstrap';
import Sidebar from 'react-sidebar';

import {GrandExchangeContext} from '../GrandExchange';

import './dep-router.css';

export const DepRouterContext = createContext({
  currPage: {},
  currArgs: {},
  currPath: [],
  currSubs: [],
  fore: () => {},
  back: () => {},
  jump: () => {},
  fetchDir : () => {}
})

const SideNavigationBar = ({directories, isHidden, children}) => {
  const {currPath, currSubs, fore, back, jump} = useContext(DepRouterContext);

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
    styles={{sidebar: {background: 'white'}}}
  >
    <div className="sidebar-content-wrapper">{children}</div>
  </Sidebar>
}

const NavigationBar = ({directories}) => {
  const {currPath, back} = useContext(DepRouterContext);
  const pathElems = currPath.map(({path}, i) => {
    return <BreadcrumbItem key={i}>
      <a onClick={() => back(path)} href="#">{directories[path].desc}</a>
    </BreadcrumbItem>
  })

  const bread = <Breadcrumb>{pathElems}</Breadcrumb>

  return currPath.length > 1 ? bread : <></>
}

export function DepRouter({children}) {

  const {pull, status, evalSheet} = useContext(GrandExchangeContext);

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

      console.log('useEffect, init');

      const {search, pathname} = window.location;
      const args = Object.fromEntries((new URLSearchParams(search)).entries());
      
      const pathSegs = pathname.split('/').slice(1)

      const fetchedDirs = await fetchDir('/');
      setDirs(fetchedDirs);

      if (pathSegs.length > 1 || fetchedDirs[pathSegs[0]] === undefined){
        init(fetchedDirs);
      } else {
        jump(fetchedDirs[pathSegs[0]], args);
      }
    })()
  }, [])

  useEffect(() => {
    if (status === 'DONE_PULL') {
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

  const init = (initDirs) => {
    setArgs({});
    setPath([{path:'Home', args:{}}]);
    setPage(initDirs['Home']);
    setSubs(initDirs['Home'].children);  
  }

  const fore = (path, args={}) => {
    console.log(args, 'args')

    const page = dirs[path];

    setPage(page);
    setSubs(page.children);
    
    const newArgs = {...currArgs, ...args};
    setArgs(newArgs);


    const pathList = [...currPath, {path, args:newArgs}];
    setPath(pathList);

    const {sheetName, referredSheetNames=[]} = page;

    if (sheetName !== undefined){
      pull([...referredSheetNames, sheetName], newArgs);
    }

  }

  const jump = (page, args={}) => {

    setPage(page);
    setArgs(args);
    setPath([]);

    const {sheetName, referredSheetNames=[]} = page;

    if (sheetName !== undefined){
      pull([...referredSheetNames, sheetName], args);
    }
  }

  const back = (dest) => {
    const index = currPath.findIndex(({path}) => path === dest);
    console.log('back', currPath[index], index)

    const pathList = currPath.slice(0, index+1);
    setPath(pathList);
    
    setPage(Object.assign({}, ...pathList.map(({context}) => context), dirs[dest]));
    
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
      <div></div>
      <div>如果您是通过微信扫码进入，并长时间停留在此页，请从右上角菜单选择“在浏览器打开”进入</div>
    </div>;
  }

  return <DepRouterContext.Provider value={{
      currPage, currPath, currSubs, currArgs,
      fore, back, jump, fetchDir}}>
    {content}
  </DepRouterContext.Provider>
}