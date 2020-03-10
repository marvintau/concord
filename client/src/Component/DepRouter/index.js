import React, {createContext, useState, useContext, useEffect} from 'react';
import {Breadcrumb, BreadcrumbItem, ListGroup, ListGroupItem} from 'reactstrap';
import Sidebar from 'react-sidebar';

import {useHistory, useLocation} from 'react-router-dom';

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
    const currPathEnd = currPath[currPath.length-1];
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
  >{children}
  </Sidebar>
}

const NavigationBar = ({directories}) => {
  const {currPath, goto} = useContext(DepRouterContext);

  const pathElems = currPath.map((e, i) => {
    return <BreadcrumbItem key={i}>
      <a onClick={() => goto(e)} href="#">{directories[e].desc}</a>
    </BreadcrumbItem>
  })

  const bread = <Breadcrumb>{pathElems}</Breadcrumb>

  return currPath.length > 1 ? bread : <></>
}

export function DepRouter({home='Home', directories={}, children}) {

  const history = useHistory();
  const location = useLocation();

  const [initPage, initPath, initSubs] = Object.keys(directories).length === 0
    ? [{}, [], undefined]
    : [directories['Home'], ['Home'], directories['Home'].children]

  const [dirs, setDirs] = useState(directories);
  const [currPage, setPage] = useState(initPage);
  const [currPath, setPath] = useState(initPath);
  const [currSubs, setSubs] = useState(initSubs);
  const [query, setQuery] = useState({});

  // performs initialization
  useEffect(() => {
    (async function(){
      const dir = await fetchDir('/');
      setDirs(dir);

      let pathArray = location.pathname.split('/').slice(1);
      let last = pathArray.slice(-1)[0];
      if (!(last in dir)){
        last = 'Home';
        pathArray = ['Home']
      }
      console.log(pathArray, last);
      setPath(pathArray);
      setPage(dir[last]);
      setSubs(dir[last].children);  
    })()
  }, [])

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

  const queryString = (query) => {
    if (Object.keys(query).length === 0){
      return '';
    } else {
      const joined = Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&');
      return `?${joined}`;
    }
  }

  const forward = (child) => {
    let path;
    if (typeof child === 'string'){
      path = child;
    } else if (typeof child === 'object') {
      console.log(child, 'forward')
      path = child.path;
      setQuery({...query, ...child.query});
    }

    const pathList = [...currPath, path];
    setPage(dirs[path]);
    setPath(pathList);
    setSubs(dirs[path].children);
    history.push(`/${pathList.join('/')}${queryString({...query, ...child.query})}`);
  }

  const goto = (child) => {
    const index = currPath.findIndex(e => e === child);
    console.log('goto', child, index)
    const pathList = currPath.slice(0, index+1);
    setPage(dirs[child]);
    setPath(pathList);
    setSubs(dirs[child].children);
    history.push(`/${pathList.join('/')}`);
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