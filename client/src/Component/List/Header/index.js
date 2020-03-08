import React from 'react';

const HeaderCol = ({width, noBack, children}) =>
  <div className={`flatlist-header-col col-md-${width} ${noBack ? 'clear-back' : ''}`}>{children}</div>;

export default ({colSpecs, hidden}) => {

  const actualCols = hidden ? {none:{width:12}} : colSpecs;

  const cols = [];
  for (let key in actualCols){
    const {width, desc, HeaderColRenderer=HeaderCol, noBackground} = actualCols[key];

    cols.push(<HeaderColRenderer
      key={key}
      width={width}
      noBack={noBackground}
    >{desc}</HeaderColRenderer>)
  }

  return <div className="flatlist-header">
    {cols}
  </div>
}
