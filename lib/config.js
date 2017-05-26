const config = {};

config.resourceConfiguration = {
  people: {basePath: 'people'},
  events: {
    basePath: 'events',
    itemResources: {
      rsvps: {basePath: 'rsvps'}
    }
  },
  groups: {
    basePath: 'groups',
    itemResources: {
      memberships: {basePath: 'memberships'}
    }
  },
  clients: {basePath: 'clients'},
  rsvps: {basePath: 'rsvps'},
  memberships: {basePath: 'memberships'},
  peopleTags: {basePath: 'people_tags'},
  eventTags: {basePath: 'event_tags'},
  groupTags: {basePath: 'group_tags'},
};

config.defaultEndpoint = "https://api.jlm2017.fr";

module.exports = config;
