# ProActive Cloud Automation portal

## Installation

You need `npm` installed, then run the following commands from the root of the repository to install the required tools and dependencies:
```
npm install -g grunt-cli
npm install -g bower
npm install
bower install
```

You can use `grunt live` to have a live preview of the code in your browser.
You can use `grunt build` to build the release (into dist/) that can be then embedded into the dist/war folder of the scheduler.

[quote]
#Notice
There will be errors when running the live mode because of [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) (between the portal and the scheduler). The problem also happens on the Studio.
One solution is to run this portal using the scheduler (link the portal's dist into scheduling/dist/war/pca).
[/quote]
