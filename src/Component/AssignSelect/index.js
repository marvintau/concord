import React, { useContext } from 'react';
import {Button} from 'reactstrap';

import useMemberSelect from './useMemberSelect';
import useRoleSelect from './useRoleSelect';
import DisplayedList from './DisplayedList';

import {AuthContext} from '../../context/auth';
import { ProjectContext } from '../../context/projects';

const buttonStyle = {width:"32%", margin:"5px 1%"};

export default function ({project, members}){

  const [selectedMember, memberSelect] = useMemberSelect();
  const [selectedRole, roleSelect] = useRoleSelect();

  const {user, role, list:userList} = useContext(AuthContext);
  const {assignProjectMember} = useContext(ProjectContext);

  let visibleOnly = members[user] && members[user] === 'member';

  const optionsList = userList
  .map(({user_name, nickname, role})=> ({label:nickname, value:user_name, role}));

  let userNameDict = Object.fromEntries(optionsList.map(({label, value, role}) => [value, {label, role}]));
  let memberList = Object.entries(members).map(([key,val]) => ({
      value:key,
      roleProj:val,
      label:userNameDict[key].label,
      role:userNameDict[key].role,
      isFixed: visibleOnly || (val==='manager' && !['supreme', 'governer'].includes(role))
  }));

  if (visibleOnly){
    return <div style={{width:'100%'}}>
      <div style={{width:"98%", margin:"0px 1%"}}>
        <DisplayedList {...{project, memberList}} />
      </div>
    </div>
  } else {

    let setMember = () => {
      assignProjectMember(project, selectedMember.value, selectedRole.value);
    }
  
    return <div style={{width:'100%'}}>
      <div style={{width:"98%", margin:"0px 1%"}}>
        <DisplayedList {...{project, memberList, disabled:visibleOnly}} />
      </div>
      {!visibleOnly ? <div style={{display:'flex'}}>
          <div style={buttonStyle}>{memberSelect}</div>
          <div style={buttonStyle}>{roleSelect}</div>
          <Button style={buttonStyle} color="warning" disabled={!(selectedMember && selectedRole)} onClick={setMember}>确定</Button>
      </div> : undefined
      }
    </div>
  
  }
}