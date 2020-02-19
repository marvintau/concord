import React, {createContext, useState, useContext, useEffect} from 'react';
import {Breadcrumb, BreadcrumbItem, ListGroup, ListGroupItem} from 'reactstrap';
import Sidebar from 'react-sidebar';

import {Route, useHistory, useLocation} from 'react-router-dom';

export const DepRouterContext = createContext({
  currPage: {},
  currPath: [],
  currSubs: [],
  forward: () => {},
  goto: () => {}
})

const SideNavigationBar = ({children}) => {
  const {currPath, currSubs, forward} = useContext(DepRouterContext);

  const style = {
    height:'100%',
    margin:'10px',
    width: '200px'
  }

  let subElems = [];
  if(currSubs !== undefined){
    subElems = currSubs.map((e, i) => {
      return <ListGroupItem key={i} onClick={() => forward(e)} style={{cursor:'pointer'}}>
        {e}
      </ListGroupItem>
    })
  }

  const innerSidebar = <div>
    <h2 style={{margin:'15px', fontWeight:'bold', letterSpacing:'-0.05rem'}}>{currPath[currPath.length-1]}</h2>
    <ListGroup style={style}>
      {subElems}
    </ListGroup>
  </div>

  return <Sidebar
    sidebar={innerSidebar}
    docked={currSubs !== undefined}
    styles={{sidebar: {background: 'white'}}}
  >{children}
  </Sidebar>
}

const NavigationBar = () => {
  const {currPath, goto} = useContext(DepRouterContext);

  const pathElems = currPath.map((e, i) => {
    return <BreadcrumbItem key={i}>
      <a onClick={() => goto(e)} href="#">{e}</a>
    </BreadcrumbItem>
  })

  const bread = <Breadcrumb>{pathElems}</Breadcrumb>

  return currPath.length > 1 ? bread : <></>
}

export function DepRouter({directories, children}) {

  const location = useLocation();
  const history = useHistory();
  const [currPage, setPage] = useState(directories['Home']);
  const [currPath, setPath] = useState(['Home']);
  const [currSubs, setSubs] = useState(directories['Home'].children);

  console.log(location);

  const forward = (child) => {
    const pathList = [...currPath, child];
    setPage(directories[child]);
    setPath(pathList);
    setSubs(directories[child].children);
    history.push(`/${pathList.join('/')}`);
  }

  const goto = (child) => {
    const index = currPath.findIndex(e => e === child);
    console.log('goto', child, index)
    const pathList = currPath.slice(0, index+1);
    setPage(directories[child]);
    setPath(pathList);
    setSubs(directories[child].children);
    history.push(`/${pathList.join('/')}`);
  }

  return <DepRouterContext.Provider value={{currPage, currPath, currSubs, forward, goto}}>
      <SideNavigationBar>
        <NavigationBar />
        {children}
      </SideNavigationBar>
  </DepRouterContext.Provider>
}