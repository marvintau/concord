const TRIAL_BALANCE = require('./trial-balance');
const SOFP = require('./sofp');
const CASHFLOW = require('./cashflow');
const PAL = require('./profit-and-loss');
const EQUITY = require('./equity');

const BALANCE = require('./balance');
const PROJECT = require('./project');
const CASHFLOW_WORKSHEET = require('./cashflow-worksheet');
const CATEGORY_NAME_ALIASES = require('./category-name-aliases');
const CONFIRMATION_MANAGEMENT = require('./confirmation-management');
const CONFIRMATION_TEMPLATE = require('./confirmation-template');

module.exports = {
  TRIAL_BALANCE,
  BALANCE,
  SOFP,
  PAL,
  EQUITY,
  CASHFLOW,
  
  PROJECT,
  CASHFLOW_WORKSHEET,
  CATEGORY_NAME_ALIASES,
  CONFIRMATION_MANAGEMENT,
  CONFIRMATION_TEMPLATE
}