import React, {useContext} from 'react';
import Select from 'react-select';

import {ProjectContext} from '../../context/projects';


const colorFunc = (styles, { data }) => {
  const {role} = data;
  const color = {
    governer:'#dc3545',
    manager: '#6f42c1',
    normal:  '#007bff',
  }[role]

  return {...styles, color};
};

const memberColorFunc = (styles, { data }) => {
  const {roleProj} = data;

  const background = {
      manager: '#ffc107',
      member: '#EFEFEF'
  }[roleProj]

  return {...styles, background};
};

const selectedMemberStyles = {
  multiValue: memberColorFunc,
  multiValueLabel: (base, {data}) => ({...colorFunc(base, {data}), ...(data.isFixed ? {paddingRight: 6} : {})}),
  multiValueRemove: (base, {data}) => {
      return data.isFixed ? { ...base, display: 'none' } : base;
  },
}

export default function DisplayedList ({project, memberList}){

  const { removeProjectMember} = useContext(ProjectContext);

  const handleRemove = (newValue, {action}) => {
    if(action==='remove-value'){
      newValue = newValue === null ? [] : newValue;
      let removed = memberList.filter(e => !newValue.includes(e))[0]
      removeProjectMember(project, removed.value);
    }
  }

  return <Select isMulti
    components={{Menu:() => <></>, IndicatorsContainer:()=><></>}}
    isClearable={false}
    isOptionDisabled={true}
    isSearchable={false}
    placeholder="无"
    value={memberList}
    options={[]}
    styles={selectedMemberStyles}
    onChange={handleRemove}
  />
}