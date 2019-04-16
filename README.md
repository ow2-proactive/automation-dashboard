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


### For development

Before building, you need to clone the projects to the following tree structure :

```
├── proactive-dashboard-fork
│   ├── app
│   ├── bower_components
│   ├── bower.json
│   ├── build.gradle
│   ├── cloud-automation
│   ├── cloud-watch-portal
│   ├── generic-catalog-portal
│   ├── gradle
│   ├── gradle.properties
│   ├── gradlew
│   ├── gradlew.bat
│   ├── Gruntfile.js
│   ├── job-analytics-portal
│   ├── job-planner-portal
│   ├── node_modules
│   ├── notification-portal
│   ├── package.json
│   └── README.md
```

cloud-automation, cloud-watch-portal, generic-catalog-portal, job-analytics-portal, job-planner-portal, notification-portal are the subview of the dashboard here but it can be different.
First, clone ProActive Dashboard, and then clone each subviews project inside. `npm install` & `bower install` will respectively create `node_modules` & `bower_components` folders.

Once you have this tree structure, to build the ProActive Dashboard, just use the following command to generate the enterprise version of the dashboard:
```
grunt clean build --target=enterprise
```

Or use this command instead to build the community version:
```
grunt clean build --target=community
```

If no target is specified, grunt will build the enterprise version by default.
This command creates a `/dist` folder that you need to copy under `scheduling/dist/war/`. Rename the copied folder to "automation-dashboard", and launch the scheduling server as detailed in https://github.com/ow2-proactive/scheduling .

You can also create a symbolic link to avoid having to copy and rename this dist folder everytime you build (you need to adapt this command with your paths) :
```
ln -s <...proactive-dashboard/dist> <.../scheduling/dist/war/automation-dashboard>
```

Once scheduling/bin/proactive-server is started, the dashboard is available at:
```
localhost:8080/automation-dashboard
```

#### Code linting

This project uses ESLint plugin for code linting. This tool provides code formatting errors according to specified rules. The `eslint` step is added to `pre-build` project process.
It's required to install the ESLint dependencies for local development. The next command will automatically install all required dependencies:
```
./gradlew clean build
```
**BUT be careful: this command will overwrite your clones of the subviews.**
In this case you can install the dependencies manually with next commands:
```
npm install grunt-eslint
npm install --save eslint-config-airbnb
npm install
```
After installation with running `grunt clean build` in the output you should see the formatting issues in your code with mentioned file names.
The formatting rule specification can be found in `.eslintrc.json` file.

### For production

Automation-dashboard project can be build with all subviews from local repository with next command:
```
./gradlew clean build -Plocal
```

This will call the grunt build defined in the section above.
This method for building is longer than the build with grunt because it will copy the source code of each subview inside your dashboard folder.
It is good to use it if you're not coding and just want to build the dashboard once, without having to clone each subview. **BUT be careful: If you're developing and you have the tree structure defined in the section above, this will overwrite your clones of the subviews.**
If you want to build the dashboard with the latest subviews, you need to build the subviews.

##### Building subviews

Building a subview is building zip archive of subview and publishing it to Nexus repository. Every subview contains gradlew build file to build and publish the zip archive.
In gradle building procedure of automation-dashboard project there are tasks to download zip archives for each subview and extract subview's sources. After building this project all subviews will be present in automation-dashboard.

Each subview project should be build with next command:
```
./gradlew clean build install
```

Then build automation-dashboard, that will compose all subviews.

In order to test subviews and automation dashboard locally, it is required not to publish the subviews archives to main repository, but to local repository of machine.

### What does grunt building do with subviews?

With the following tasks, grunt injects subviews in the dashboard, depending on the requested VERSION :
* replace:
  * in `app/templates_versions/VERSION/config.js`, it sets, for each URL, which view should be displayed
  * in `app/templates_versions/common/navigation.html`, it adds item for the navigation menu (left panel)
  * in `app/templates_versions/VERSION/app.js`, it adds modules needed for subviews
  * in `app/templates_versions/VERSION/index.html`, it adds scripts needed for subviews if they exist
  * when all files are replaced accordingly to the requested version, they are copied into the `app/` folder:
    * `app/templates_versions/VERSION/config.js` to `app/scripts/config.js`
    * `app/templates_versions/VERSION/app.js` to `app/scripts/app.js`
    * `app/templates_versions/VERSION/index.html` to `app/index.html`
    * `app/templates_versions/common/navigation.html` to `app/views/common/navigation.html`
* jsbeautifier: re-indents all these files that were not well indented with generated code.
* copy:communitySubviews: copies the community subviews html content (or the _unavailable_ alternative pages if necessary) into the final `dist/` folder if they exist
* copy:enterpriseSubviews: copies the enterprise subviews html content (or the _unavailable_ alternative pages if necessary) into the final `dist/` folder if they exist

If one of the file given in subviews (in `htmlFile`, `secondaryHtmlFiles` or `jsFiles`) doesn't exist, the build will fail with a warning. You can still use `--force` option to continue the build but the result might not be what you expect.

You can open Gruntfile.js to see the tasks of a grunt build.

## Development

The dashboard has 2 versions available:
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

Any modification to those files will need to be done from the `app/templates_versions/common` folder instead. What you want to modify is between `<!-- beginSubviewsScripts-->` and `<!-- endSubviewsScripts-->`, you need to change the way it is generated in `Gruntfile.js` (`replace` task) and `subviews.json`.

To add/remove a subview, you need to change `app/templates_versions/VERSION/subviews.json`. If you want a view to be in the portal but with its content not available (visible in the navigation panel but "not available" page displays when you click on it), you need to add it in theses files with the attribute `isAvailable` set to `false`. If a view shouldn't be displayed at all, just remove it from the 2 JSON files.

Views will be displayed in the navigation panel in the same order as they are given in `app/templates_versions/VERSION/subviews.json`. The order of `jsFiles` attribute values is also very important as scripts will be injected in `index.html` in the same order. If two angular Service/Controller/Factory have the same name, the last injected one will overwrite the other one. You need to be careful and avoid naming them the same way because this can lead to unexpected behaviors.

Images used in the view must be put in `images` attribute.

All attributes are mandatory, except `initFunction` and `images`, which can be omitted.



