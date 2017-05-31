'use strict';

const config = {};

config.resourceConfiguration = {
  people: {path: 'people'},
  events: {
    path: 'events',
    itemResources: {
      rsvps: {
        path: 'rsvps',
        extraRoutes: {
          'bulk': {path: 'bulk'}
        }
      }
    },
  },
  groups: {
    path: 'groups',
    itemResources: {
      memberships: {
        path: 'memberships',
        extraRoutes: {
          'bulk': {path: 'bulk'}
        }
      }
    }
  },
  clients: {path: 'clients'},
  rsvps: {path: 'rsvps'},
  memberships: {path: 'memberships'},
  peopleTags: {path: 'people_tags'},
  eventTags: {path: 'event_tags'},
  groupTags: {path: 'group_tags'},
};

config.defaultEndpoint = "https://api.jlm2017.fr";

module.exports = config;
