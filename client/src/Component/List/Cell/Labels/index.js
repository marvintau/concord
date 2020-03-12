import React, {useState, useContext} from 'react';
import {Input} from 'reactstrap';
import {DataContext} from '../../../Data';

import Check from './check.svg';
import './labels.css';

export default ({colName, path, children}) => {

  const {setCol} = useContext(DataContext);

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(children.join(', '));

  const set = (text) => {
    setValue(text);
    setCol(path, colName, text.split(/[ ,]+/));
  }

  return !editing
  ? <div className='labels-text' onClick={() => setEditing(true)}>{value}</div>
  : <div className='labels-wrapper'>
      <Input bsSize="sm" value={value} onChange={(e) => set(e.target.value)} />
      <img className='labels-button' src={Check} />
    </div>
}