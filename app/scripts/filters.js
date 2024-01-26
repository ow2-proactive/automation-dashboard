/**
 * angular filter to highlight a text that matches a given phrase.
 * usage : ng-bind-html="text | searchHighlight:phrase"
 */
function searchHighlight($sce) {
    return function (text, phrase, useRegExp) {
        if (phrase && text) {
            if (useRegExp) {
                try {
                    text = text.replace(new RegExp('(' + phrase + ')', 'gi'), '<span class="highlighted">$1</span>')
                } catch (regexException) {
                    // do nothing, do not highlight any text
                }
            } else {
                text = text.replace(phrase, '<span class="highlighted">' + phrase + '</span>')
            }
        }
        return $sce.trustAsHtml(text)
    }
}

/**
 * angular filter to format a date-time value (input timestamp in milliseconds)
 */
function dateTimeFormat() {
    // Format duration
    return function (input) {
        input = input || '';
        // Locale based format for dates display.
        return moment(input).format('L HH:mm:ss');
    };
}

function escapeQuotes() {
    return function (input) {
        if (input === null) {
            return input;
        } else {
            return input.replace(/["']/g, "&lsquo;");
        }
    };
}

function isDigit() {
    return function (input) {
        return input.match(/^\d/);
    };
}

function getFirstLetter() {
    return function (input) {
        return Array.from(input)[0];
    };
}

/**
 * angular filter to format a duration value (input in milliseconds)
 */
function durationFormatWE() {
    // Format duration & dismiss small units if larger units apply
    return function (input) {
        var formatString = 'D[d]H[h]m[m]s[s]SSS[ms]';
        if (input > 86400000) { // more than 1 day
            formatString = 'D[d]H[h]'
        } else if (input > 3600000) { // more than 1 hour
            formatString = 'D[d]H[h]m[m]'
        } else if (input > 60000) { // more than 1 min
            formatString = 'D[d]H[h]m[m]s[s]'
        }
        return input ? moment.duration(input).format(formatString) : '';
    };
}

angular
    .module('main')
    .filter('searchHighlight', searchHighlight)
    .filter('dateTimeFormat', dateTimeFormat)
    .filter('durationFormatWE', durationFormatWE)
    .filter('escapeQuotes', escapeQuotes)
    .filter('isDigit', isDigit)
    .filter('getFirstLetter', getFirstLetter)