var support = require('./support');

/**
 * Convert a scenario from Cucumber.JS into an XML element <testcase>
 *
 * @method convertScenario
 * @param  {Object}    scenarioJson Scenario output from Cucumber.JS
 * @param  {Object}    options      if `strict` is true, pending or undefined steps will be reported as failures.
 *                                  if `prefix` is provided, it will be added to the testsuite name.
 * @return {Array}                  Array of elements for an XML element <testsuite>
 */
function convertScenario (scenarioJson, featureTestSuite, options) {

    var scenarioOutput = [{
            _attr: {
				classname: featureTestSuite[0]._attr.name,
                name: scenarioJson.name || '',
                time: 0
            }
        }, {
            properties: []
        }],
		scenarioStatus;

    if(options.prefix) {
        scenarioOutput[0]._attr.name = options.prefix + scenarioOutput[0]._attr.name;
    }

    if(scenarioJson.tags) {
        scenarioJson.tags.forEach(function (tagJson) {
            var tag = (typeof tagJson == "string" ? tagJson : tagJson.name);
            scenarioOutput[1].properties.push(support.createProperty(tag, true));
        });
    }

    if(scenarioJson.properties) {
        for (var propertyName in scenarioJson.properties) {
            if (scenarioJson.properties.hasOwnProperty(propertyName)) {
                scenarioOutput[1].properties.push(support.createProperty(
                    propertyName, scenarioJson.properties[propertyName]
                ));
            }
        }
    }

    if(scenarioJson.steps) {
        scenarioJson.steps
        .filter(function (stepJson) {
          return !stepJson.hidden;
        })
        .forEach(function (stepJson) {
			var
				stepResult = stepJson.result,
				stepResultPriority = {
					passed: 0,
					skipped: 1,
					failure: 2
				},
				isAPriorityResult = stepResultPriority[stepResult.status] > stepResultPriority[scenarioStatus];


			if (stepResult.duration > 0) {
				// Convert from nanosecond to seconds
				scenarioOutput[0]._attr.time += stepResult.duration / 1000000000;
			}

			if (!scenarioStatus || isAPriorityResult) {
				scenarioStatus = stepResult.status;
			}

			switch (stepResult.status) {
		        case 'passed':
		            break;
		        case 'failed':
		            scenarioOutput.push(support.createFailure(stepResult.error_message));
		            break;
		        case 'pending':
		        case 'undefined':
		            if (options.strict) {
		                scenarioOutput.push(support.createFailure(stepResult.status == 'pending' ? 'Pending' :
		                        'Undefined step. Implement with the following snippet:\n' +
		                        '  this.' + stepJson.keyword.trim() + '(/^' + stepJson.name + '$/, function(callback) {\n' +
		                        '      // Write code here that turns the phrase above into concrete actions\n' +
		                        '      callback(null, \'pending\');\n' +
		                        '  });'
		                ));
		                break;
		            }
		            // else fall through
		        case 'skipped':
		            break;
		    }
        });
    }

	if (scenarioStatus === 'failed') {
		featureTestSuite[0]._attr.failures += 1;
	} else if (scenarioStatus !== 'passed'){
		featureTestSuite[0]._attr.skipped += 1;
	}

	featureTestSuite[0]._attr.time += scenarioOutput[0]._attr.time;

    return { testcase: scenarioOutput };
}

/**
 * Build testsuite body for json feature
 */
function buildFeatureTestSuite(featureJson) {

	var
	 	elements = featureJson.elements || [],
		featureAttributes = {
			_attr: {
				name: featureJson.name,
				failures: 0,
				errors: 0,
				skipped: 0,
				test: elements.length,
				time: 0
			}
		},
		featureProperties =  {
			properties: []
		},
		featureTestSuite = [ featureAttributes, featureProperties ];

	featureJson.tags.forEach((tag) => {
		featureTestSuite[1].properties.push(support.createProperty(tag.name, true));
	});
	featureTestSuite[1].properties.push(support.createProperty('URI', featureJson.uri));

	return featureTestSuite;
}

/**
 * ConvertFeature must return a <testsuite> with feature information.
 * Each scenario must be an individual <testcase>
 * Skips background steps and calls `convertScenario` each element
 */
function convertFeature(featureJson, options) {

	var
		featureTestSuite = buildFeatureTestSuite(featureJson),
		elements = featureJson.elements || [];

	elements.forEach(function (scenarioJson) {
		if (scenarioJson.type !== 'background') {
			featureTestSuite.push(convertScenario(scenarioJson, featureTestSuite, options));
		}
	})

	return { testsuite: featureTestSuite };
}

function parse (cucumberJson, options) {
	var output = [];

	cucumberJson.forEach(function (featureJson) {
		output = output.concat(convertFeature(featureJson, options));
	});

	return output;
};

module.exports = parse;
