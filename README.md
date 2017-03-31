# @fi/api-client

@fi/api-client provides a minimal higher-level wrapping around the jlm2017 API.

## Usage

### Creating a client

The `createClient` function is used to create a client with the following options:

* `endpoint`: the base URI (scheme included) at which the API is found
* `auth`: one of `"default"`, `"crossSiteSession"` ou `"basicToken"`.
  * with `"default"`, there is no specific authentication. It can be used to access public read-only resources.
    Authentication may also be handled in this case using the normal cookie/session mechanisms (browser-only)
  * with `"crossSiteSession"` (browser-only) the browser is instructed to send cookies with requests, even if
    they go to another domain.
  * with `"basicToken"`, the API uses the `token` parameter as basic HTTP auth user, with empty password.
* `token` : the token to use with the `basicToken` auth strategy.

### Resources

Once the client is created, resources are avaible as properties.

These two resources are publicly available and read-only:

* `events`: the list of all published, upcoming events
* `groups`: the list of all published groups

The four resources require authentication/authorization and are read-write:

* `allEvents`: events, including past/unpublished events
* `groups`: groups, including unpublished groups
* `people`: the list of persons who declared they support for the campaign
* `clients`: the list of OAuth2 clients

### Finding/Listing and getting

The method `find`/`list` (synonyms) may be used to list or find specific items from a resource. They take an optional
filter as an only argument. They return a Promise that either resolves to a list of results, or rejects with an error.

```
// find a person with specific email address
client.people.find({email: 'user@domain.com'})

// list the events for which user@domain.com is set as the contact address
client.events.list({'location.email': 'user@domain.com'})
```

If an object `id` is known, the corresponding item may be fetched using `get`, which returns a Promise that either resolves
with the object or rejects with an error.
```
client.groups.get("58a32d8663623965059b8e8e").then((group) => {
  console.log(group);
});
```

### Modifying and saving an item

An item may be modified in place and saved using the `save` method that returns a Promise that resolves in case of success, and
rejects in case of error.

```
group.location.name = "Le bar du coin";
group.save().then(() => console.log('Saved!'));
```

### Modifying without getting

Objects may also be modified directly using the `put` and `patch` resource methods.

These take two three arguments:

* The `id` of the object that is to be modified
* The `content` to put or `patch` to apply
* `options`:
  * `etag`: the ETag of the item to modify
  * `overwriteIfChanged`: a boolean

Either `etag` must be present of `overwiteIfChanged` set to `true`.

If `overwiteIfChanged` is set to `true`, providing the `etag` is not required, but may save a round trip.

### Creating an item

Objects may also be modified directly using the `create` (or `post`) method of resources.
