var
	xml = require('xml'),
	stepParser = require('./parser/step_parser'),
	scenarioParser = require('./parser/scenario_parser');

/**
 * options:
 *  - indent - passed to the XML formatter, defaults to 4 spaces
 *  - stream - passed to the XML formatter
 *  - declaration - passed to the XML formatter
 *  - strict - if true, pending or undefined steps will be reported as failures
 *  - scope - the scope can be scenario or step (by default)
 *
 * @method exports
 * @param  {string} cucumberRaw  the Cucumber JSON report
 * @param  {object=} options     eg: {indent: boolean, strict: boolean, stream: boolean, declaration: {encoding: 'UTF-8'}}
 * @return {string} the JUnit XML report
 */
function cucumberJunit (cucumberRaw, options) {
    var cucumberJson,
        output = [];

    options = options || {};

    if (options.indent === undefined) {
        options.indent = '    ';
    }

    if (!options.declaration) {
        options.declaration = { encoding: 'UTF-8' };
    }

    if (cucumberRaw && cucumberRaw.toString().trim() !== '') {
 				cucumberJson = JSON.parse(cucumberRaw);

				if (options.scope !== undefined && options.scope.toLowerCase() === 'scenario') {
					output = scenarioParser(cucumberJson, options);
				} else {
					output = stepParser(cucumberJson, options);
				}

				// If no items, provide something
        if (output.length === 0) {
            output.push( { testsuite: [] } );
        }
    }

    // wrap all <testsuite> elements in <testsuites> element
    return xml({ testsuites: output }, options);
};

module.exports = cucumberJunit;
