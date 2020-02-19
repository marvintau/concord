import React, { useContext, useState } from 'react';
import Select from 'react-select';
import {AuthContext} from '../../context/auth';

export default function (){

  const [selectedRole, setROle] = useState(undefined);
  const {role} = useContext(AuthContext);

  let roleList;
  if(['supreme', 'governer'].includes(role)){
    roleList = [{label:'负责人', value:'manager'}, {label:'成员', value:'member'}]
  } else {
    roleList = [{label:'成员', value:'member'}]
  }

  const elem = <Select
    placeholder="选择权限"
    value={selectedRole}
    isSearchable={false}
    options={roleList}
    onChange={(value) => {
        setROle(value);
    }}
  />
  
  return [selectedRole, elem]
}
