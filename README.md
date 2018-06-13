# ProActive Dashboard Portal

## Requirements

You need `npm` installed, then run the following commands from the root of the repository to install the required tools and dependencies:
```
npm install -g grunt-cli
npm install -g bower
npm install
bower install
```

The dashboard subviews are private bitbucket projects that need to be automatically retrieved from Nexus repository by using the following command:
```
gradlew clean build
```

## Building

To build the ProActive Dashboard, just use the following command to generate the enterprise version of the dashboard:
```
grunt clean build --target=enterprise
```

Or use this command instead to build the community version:
```
grunt clean build --target=community
```

If no target is specified, grunt will build the enterprise version by default.
Then, copy the `dist/` folder in `scheduling/dist/war/` and rename it "automation-dashboard".

Once scheduling/bin/proactive-server is started, the dashboard is available at:
```
localhost:8080/automation-dashboard
```

### What does building do with subviews?

With the following tasks, grunt injects subviews in the dashboard, depending on the requested VERSION :
* replace:
  * in `app/templates_versions/VERSION/config.js`, it sets, for each URL, which view should be displayed
  * in `app/templates_versions/common/navigation.html`, it adds item for the navigation menu (left panel)
  * in `app/templates_versions/VERSION/app.js`, it adds modules needed for subviews
  * in `app/templates_versions/VERSION/index.html`, it adds scripts needed for subviews
  * when all files are replaced accordingly to the requested version, they are copied into the `app/` folder:
    * `app/templates_versions/VERSION/config.js` to `app/scripts/config.js`
    * `app/templates_versions/VERSION/app.js` to `app/scripts/app.js`
    * `app/templates_versions/VERSION/index.html` to `app/index.html`
    * `app/templates_versions/common/navigation.html` to `app/views/common/navigation.html`
* jsbeautifier: re-indents all these files that were not well indented with generated code.
* copy:communitySubviews: copies the community subviews html content (or the _unavailable_ alternative pages if necessary) into the final `dist/` folder.
* copy:enterpriseSubviews: copies the enterprise subviews html content (or the _unavailable_ alternative pages if necessary) into the final `dist/` folder.


## Development

The dashboard have 2 versions available:
* community
* enterprise

Both versions have specificies that are described in the `app/templates_versions/` folder.
Each of those versions is composed of the following files:
* `app.js`
* `config.js`
* `index.html`
* `subviews.json`

When building the dashboard, grunt will first copy those files (depending on the selected version) into the `app/` folder before running the build process, so the 3 following files should NOT be created manually into the `app/` folder:
* `app/index.html`
* `app/scripts/app.js`
* `app/scripts/config.js`

Any modification to those files will need to be done from the `app/templates_versions/VERSION` folder instead. What you want to modify is between `<!-- beginSubviewsScripts-->` and `<!-- endSubviewsScripts-->`, you need to change the way it is generated in `Gruntfile.js` (`replace` task) and `enterprise/community.json`. Otherwise, you can modify enterprise/community sources files.

To add/remove a subview, you need to change `app/templates_versions/VERSION/subviews.json`. If you want a view to be in the portal but with its content not available (visible in the navigation panel but "not available" page displays when you click on it), you need to add it in theses files with the attribute `isAvailable` set to `false`. If a view shouldn't be displayed at all, just remove it from the 2 JSON files.

Views will be displayed in the navigation panel in the same order as they are given in `app/templates_versions/VERSION/subviews.json`. The order of `jsFiles` attribute values is also very important as scripts will be injected in `index.html` in the same order.

Images used in the view must be put in `images` attribute.

All attributes are mandatory, except `initFunction` and `images`, which can be omitted.

### Subviews project

Each subview is defined in a bitbucket repository and then imported in this project.
The idea behind for each subview project is building zip archive of subview and publishing it to Nexus repository. Every subview contains gradlew build file to build and publish the zip archive.
In gradle building procedure of automation-dashboard project there are tasks to download zip archives for each subview and extract subview's sources. After building this project all subviews will be present in automation-dashboard.
So it should be enough just to do ``gradle build`` for each subview and then build automation-dashboard, that will compose all subviews.

### Local building and testing subviews project

In order to test subviews and automation dashboard locally, it's required not to publish the subviews archives to main repository, but to local repository of machine.
Each subview project should be build with next command:
```
gradlew clean build install
```

Then automation-dashboard project can be build with all subviews from local repository with next command:
```
gradlew clean build -Plocal
```