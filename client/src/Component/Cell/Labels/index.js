import React, {useState, useContext} from 'react';
import TagInput from "@pathofdev/react-tag-input";
import { GrandExchangeContext } from '../../GrandExchange';

import "@pathofdev/react-tag-input/build/index.css";
import "./labels.css";

export default ({colName, path, children}) => {

  const {setField} = useContext(GrandExchangeContext);

  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState(children);

  const set = (newTags) => {
    setTags(newTags);
    setField(path, colName, newTags);
  }

  return <div className='labels-wrapper'>
    <TagInput placeholder="请输入这一组内的科目别名" bsSize="sm" tags={tags} onChange={(newTags) => set(newTags)} readOnly={!editing}/>
    <div className={editing ? 'label-check-button hov' : 'label-modify-button hov'}  onClick={() => setEditing(!editing)}></div>
  </div>
}