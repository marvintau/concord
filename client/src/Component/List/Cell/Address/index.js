import React from 'react';

import './address.css';

export default ({data, children}) => {
  const {company, address, contact, phone,} = children;

  return <div className="address">
    <div className="address-line"><span className="company">{company}</span></div>
    <div className="address-line"> {address} </div>
    <div>{contact} {phone}</div>
  </div>
}