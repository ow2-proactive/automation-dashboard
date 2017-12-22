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
Then, copy the `dist/` folder in `scheduling/dist/war/` and rename it "proactive-dashboard".
Once scheduling/bin/proactive-server is started, the dashboard is available at `localhost:8080/proactive-dashboard`.

#What does building do with subviews modules?

With the following tasks, grunt injects subviews in the dashboard :
-Replace:   -in `app/scripts/enterpriseConfig.js`/`app/scripts/communityConfig.js`, it sets, for each URL, which view should be displayed
            -in `app/views/common/navigation.html`, it adds item for the navigation menu (left panel)
            -in `app/scripts/enterpriseApp.js`/`app/scripts/communityApp.js`, it adds modules needed for subviews
            -in `app/enterpriseIndex.html`/`app/communityIndex.html`, it adds scripts needed for subviews
-jsbeautifier: re-indents all these files that were not well indented with generated code.
-copy:modifiedSubviews: depending on what is being built (enterprise or community version), it copies:
    -`app/scripts/enterpriseConfig.js`/`app/scripts/communityConfig.js` in `app/scripts/config.js`
    -`app/scripts/enterpriseApp.js`/`app/scripts/communityApp.js` in `app/scripts/app.js`
    -`app/enterpriseIndex.html`/`app/communityIndex.html` in `app/index.html`
    (`app/views/common/navigation.html` is the same, no matter what is being built, so there is no need to copy it)
-Then, some tasks will use theses 3 new files (among others) to build the project.
-'copy:subviews': copy HTML and CSS files from subviews to the building directory (completes `copy:dist`)

## Development

The 3 files `app/index.html, app/scripts/app.js, app/scripts/config.js` are generated with `grunt build`, from enterprise/community sources files (`app/enterpriseIndex.html, app/scripts/enterpriseApp.js, app/scripts/enterpriseConfig.js` or `app/communityIndex.html, app/scripts/communityApp.js, app/scripts/communityConfig.js`).
They can't be modified directly. If what you want to modify is between `<!-- beginSubviewsScripts-->` and `<!-- endSubviewsScripts-->`, you need to change the way it is generated in `Gruntfile.js` (`replace` task) and `enterprise/community.json`. Otherwise, you can modify enterprise/community sources files.


