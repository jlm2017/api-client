const config = {};

config.resources = [
  {
    name: 'people',
    apiUrl: 'people',
    needAuth: true,
    readOnly: false
  },
  {
    name: 'allEvents',
    apiUrl: 'all_events',
    needAuth: true,
    readOnly: false
  },
  {
    name: 'allGroups',
    apiUrl: 'all_groups',
    needAuth: true,
    readOnly: false
  },
  {
    name: 'groups',
    apiUrl: 'groups',
    needAuth: false,
    readOnly: true
  },
  {
    name: 'events',
    apiUrl: 'events',
    needAuth: false,
    readOnly: true
  },
];

config.defaultEndpoint = "https://api.jlm2017.fr";

module.exports = config;
