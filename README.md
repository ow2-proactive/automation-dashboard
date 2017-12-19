# ProActive Dashboard Portal

## Requirements

You need `npm` installed, then run the following commands from the root of the repository to install the required tools and dependencies:
```
npm install -g grunt-cli
npm install -g bower
npm install
bower install
```

The dashboard subviews are git submodules that need to be retrieved by using the following commands:
```
git submodule init
git submodule update
```

## Building

To build the ProActive Dashboard, just use:
```grunt clean build```

