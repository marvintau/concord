const {cascade} = require('./utils');

function balance(data){
  return cascade(data, 'ccode');
}

module.exports = balance;