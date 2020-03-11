import React, {useContext} from 'react';

import { RefDataContext } from '../../../RefData';

import './edit.css';

export default ({data, children, hidden}) => {

  const {remove, insert} = useContext(RefDataContext);
  
  const {path} = data;
  const {item} = data.ref;

  return <div className="link">
    {(hidden || (item && item.startsWith('#'))) ? <></> : <div className="edit">
      <div className="remove" onClick={() => remove(path)} />
      <div className="insert" onClick={() => insert(path)} />
    </div>}
  </div>
  
}