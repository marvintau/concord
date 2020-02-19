import React, {useState, useContext} from 'react';
import Select from 'react-select';

import {AuthContext} from '../../context/auth';

const colorFunc = (styles, { data }) => {
  const {role} = data;
  const color = {
      governer:'#dc3545',
      manager: '#6f42c1',
      normal:  '#007bff',
  }[role]

  return {...styles, color};
};

export default function(){

  const [member, setMember] = useState(undefined);
  const {user, list:userList} = useContext(AuthContext);

  const optionsList = userList
  .map(({user_name, nickname, role})=> ({label:nickname, value:user_name, role}));

  const memberStyles = {
    option: colorFunc,
    singleValue: colorFunc
  }

  const elem = <Select
    placeholder="选择成员"
    value={member}
    options={optionsList.filter(({value}) => value !== user)}
    styles={memberStyles}
    onChange={(value) => {
      setMember(value);
    }}
  />

  return [member, elem];
}