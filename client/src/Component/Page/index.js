import React, {useContext} from 'react';
import {DepRouterContext} from '../DepRouter';

import List from '../List';

export default ({}) => {
  const {currPage} = useContext(DepRouterContext);
  
  const {type, children, ...props} = currPage;

  if (type === undefined && children && children.length > 0){
    return <div>此目录页没有描述，您可以选择左侧菜单进入下级目录一探究竟</div>
  }

  if (['REFT', 'DATA'].includes(type)){
    return <List type={type} {...props} />
  }

  return <>
  </>
}