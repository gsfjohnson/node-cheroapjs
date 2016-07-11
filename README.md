# Node.js API

This module interfaces with API.

* [Installation](#installation)
* [Usage](#usage)

# Installation

* Install [Node.js](https://nodejs.org/)
* Install module with `npm`:
```shell
npm install cheroapjs
```

# Usage
* Create `main.js` file with the following code:
```javascript
var cher = require('cheroapjs');

var args = {
  "host": 'host.fqdn.org',
  "username": 'username',
  "password": "password",
  "ssl": true // prefix uri with http://
};
var cher.connect(args);

cher.GetBusinessObjectByPublicId("102352", function (err, result) {
  console.log(result);
});

cher.Logout(function (err, result) {
  console.log('logout success');
})
```
* Run following command.
```shell
node main.js
```

## Contributing

1. Fork the repository on Github
1. Create a named feature branch (like `add_component_x`)
1. Write your change
1. Write tests for your change
1. Run the tests, ensuring they all pass
1. Submit a Pull Request using Github

## License

Confidentiality:
- Not public
- Do not distribute
