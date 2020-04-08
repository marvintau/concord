import React from 'react';
import './docu.css';

const DocHeader = props =>
  <h1 className="doc-header" {...props} />;

const DocPara = props =>
  <p className="doc-para" {...props} />;

const DocLi = props =>
  <li className="doc-line" {...props} />;

export default {
  h1: DocHeader,
  p: DocPara,
  li: DocLi
}
